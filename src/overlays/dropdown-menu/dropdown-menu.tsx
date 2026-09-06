import type { JSX } from 'solid-js'
import {
  Show,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  onCleanup,
  onMount,
  splitProps,
} from 'solid-js'

import { resolveComponentStyle, useMoraineConfig } from '../../shared/provider/index.ts'
import type { ComponentOrElement } from '../../shared/render-prop.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import type { BaseProps, ElementProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { useControllableValue } from '../../shared/use-controllable-value.ts'
import { callHandler, callRef, useId } from '../../shared/utils.ts'
import { OverlayMenu } from '../base/menu/index.ts'
import type {
  OverlayMenuFocusStrategy,
  OverlayMenuItemVariantProps,
  OverlayMenuRootProps,
  OverlayMenuSharedItem,
  OverlayMenuSharedItemRenderProps,
  OverlayMenuSharedSlots,
} from '../base/menu/index.ts'
import type { OverlayTriggerProps } from '../base/trigger.ts'
import {
  createOverlayTriggerRef,
  getOverlayTriggerAccessibility,
  validateOverlayTrigger,
} from '../base/trigger.ts'

export namespace DropdownMenuT {
  export interface Slot<T = unknown> extends OverlayMenuSharedSlots<T> {}
  export type Variant = Pick<OverlayMenuItemVariantProps, 'size'>
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export interface Item extends OverlayMenuSharedItem<Item> {}
  export type ItemRenderProps = OverlayMenuSharedItemRenderProps<Item>

  /**
   * Base props for the DropdownMenu component.
   */
  export interface Base extends Omit<
    OverlayMenuRootProps<Item>,
    'classes' | 'itemProps' | 'itemRender' | 'styles'
  > {
    /** Custom renderer for individual items. */
    itemRender?: ComponentOrElement<ItemRenderProps>
    /** Additional attributes for an interactive menu item. */
    itemProps?: (props: ItemRenderProps) => ElementProps<HTMLDivElement> | undefined
    /**
     * Trigger content used to open the dropdown menu.
     */
    children?: (props: OverlayTriggerProps) => JSX.Element
  }

  /**
   * Props for the DropdownMenu component.
   */
  export type TriggerProps = OverlayTriggerProps
  export type Props = BaseProps<'span', Base, Variant, Classes, Styles>
}

/**
 * Props for the DropdownMenu component.
 */
export interface DropdownMenuProps extends DropdownMenuT.Props {}

/**
 * Triggered action menu anchored to its child content.
 */
export function DropdownMenu(props: DropdownMenuProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'id',
    'open',
    'defaultOpen',
    'onOpenChange',
    'disabled',
    'items',
    'itemRender',
    'itemProps',
    'contentProps',
    'contentTop',
    'contentBottom',
    'placement',
    'gutter',
    'preventScroll',
    'overflowPadding',
    'checkedIcon',
    'submenuIcon',
    'size',
    'classes',
    'styles',
    'children',
    'class',
    'style',
  ])
  const moraine = useMoraineConfig()
  const providerDropdownMenu = () => moraine().dropdownMenu

  const merged = mergeProps(
    {
      size: 'md' as const,
      checkedIcon: 'icon-check' as const,
      submenuIcon: 'icon-chevron-right' as const,
      placement: 'bottom-start' as const,
      gutter: 0,
    },
    () => providerDropdownMenu()?.variants,
    local,
  )

  const resolved = resolveComponentStyle({
    rootSlot: 'trigger' as const,
    base: { classes: { content: 'min-w-32' } },
    get provider() {
      return providerDropdownMenu()
    },
    get instance() {
      return {
        class: local.class,
        classes: local.classes,
        style: local.style,
        styles: local.styles,
      }
    },
  })

  const resolvedId = useId(() => merged.id, 'dropdownmenu')
  const contentId = createMemo(() => `${resolvedId()}-content`)
  const [openState, setOpenState] = useControllableValue<boolean>({
    value: () => merged.open,
    defaultValue: () => merged.defaultOpen ?? false,
  })
  const isOpen = createMemo(() => Boolean(openState()))
  const [autoFocusStrategy, setAutoFocusStrategy] =
    createSignal<OverlayMenuFocusStrategy>('content')
  const trigger = createOverlayTriggerRef()

  const triggerRender = createMemo(() => merged.children)
  const userTriggerProps = mergeProps(rest, {
    get class() {
      return resolved.slotClass('trigger')
    },
    get style() {
      return resolved.slotStyle('trigger')
    },
  }) as Partial<OverlayTriggerProps>
  const triggerProps = mergeProps(
    {
      id: resolvedId(),
      get 'aria-controls'() {
        return isOpen() ? contentId() : undefined
      },
      'aria-haspopup': 'menu',
      get 'aria-expanded'() {
        return isOpen() ? 'true' : 'false'
      },
      get 'data-closed'() {
        return isOpen() ? undefined : ''
      },
      get 'data-disabled'() {
        return merged.disabled ? '' : undefined
      },
      get 'data-expanded'() {
        return isOpen() ? '' : undefined
      },
      'data-slot': 'trigger',
      get disabled() {
        return getOverlayTriggerAccessibility(trigger.element(), Boolean(merged.disabled)).disabled
      },
      get 'aria-disabled'() {
        return getOverlayTriggerAccessibility(trigger.element(), Boolean(merged.disabled))
          .ariaDisabled
      },
      get tabIndex() {
        return getOverlayTriggerAccessibility(trigger.element(), Boolean(merged.disabled)).tabIndex
      },
    },
    userTriggerProps,
    {
      ref: (element: HTMLElement | undefined) => {
        trigger.ref(element)
        callRef(userTriggerProps.ref, element)
        if (element) {
          onCleanup(() => {
            callRef(userTriggerProps.ref, undefined)
          })
        }
      },
      onClick: (event: MouseEvent) => {
        callHandler<HTMLElement, MouseEvent>(event, userTriggerProps.onClick)
        if (event.defaultPrevented || merged.disabled) {
          return
        }

        if (isOpen()) {
          commitOpen(false)
          return
        }

        openWithStrategy('content')
      },
      onKeyDown: (event: KeyboardEvent) => {
        callHandler<HTMLElement, KeyboardEvent>(event, userTriggerProps.onKeyDown)
        if (event.defaultPrevented || merged.disabled) {
          return
        }

        if (event.key === 'Escape' && isOpen()) {
          event.preventDefault()
          commitOpen(false)
          return
        }

        if (event.key === 'ArrowDown') {
          event.preventDefault()
          openWithStrategy('first')
          return
        }

        if (event.key === 'ArrowUp') {
          event.preventDefault()
          openWithStrategy('last')
          return
        }

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()

          if (isOpen()) {
            commitOpen(false)
            return
          }

          openWithStrategy('first')
        }
      },
    },
  ) as OverlayTriggerProps

  onMount(() => {
    if (triggerRender()) {
      validateOverlayTrigger(trigger.element(), 'DropdownMenu')
    }
  })

  createEffect(() => {
    if (merged.disabled && isOpen()) {
      commitOpen(false)
    }
  })

  function commitOpen(open: boolean): void {
    if (open && merged.disabled) {
      return
    }

    if (merged.open === undefined) {
      setOpenState(open)
    }

    if (!open) {
      setAutoFocusStrategy('none')
    }

    merged.onOpenChange?.(open)
  }

  function openWithStrategy(strategy: OverlayMenuFocusStrategy): void {
    if (merged.disabled) {
      return
    }

    setAutoFocusStrategy(strategy)
    commitOpen(true)
  }

  return (
    <>
      <Show when={triggerRender()}>
        {(render) => renderComponentOrElement(render(), triggerProps)}
      </Show>

      <OverlayMenu<DropdownMenuT.Item>
        id={resolvedId()}
        open={isOpen()}
        onClose={() => {
          commitOpen(false)
        }}
        triggerElement={trigger.element()}
        placement={merged.placement}
        gutter={merged.gutter}
        autoFocusStrategy={autoFocusStrategy()}
        onAutoFocusHandled={() => {
          setAutoFocusStrategy('none')
        }}
        slotClassAndStyle={resolved.slotClassAndStyle}
        size={merged.size ?? undefined}
        items={merged.items}
        checkedIcon={merged.checkedIcon}
        submenuIcon={merged.submenuIcon}
        itemRender={merged.itemRender}
        contentProps={merged.contentProps}
        itemProps={merged.itemProps}
        contentTop={merged.contentTop}
        contentBottom={merged.contentBottom}
        preventScroll={merged.preventScroll}
        overflowPadding={merged.overflowPadding}
      />
    </>
  )
}
