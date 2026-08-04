import type { JSX } from 'solid-js'
import { createMemo, createSignal, mergeProps, splitProps } from 'solid-js'

import type { IconT } from '../../elements/icon/index.ts'
import type { ComponentOrElement } from '../../shared/render-prop.ts'
import type { BaseProps, ElementProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { useControllableValue } from '../../shared/use-controllable-value.ts'
import { callHandler, callRef, cn, useId } from '../../shared/utils.ts'
import { OverlayMenu } from '../base/menu/index.ts'
import type {
  OverlayMenuFocusStrategy,
  OverlayMenuItemVariantProps,
  OverlayMenuPlacement,
  OverlayMenuRootProps,
  OverlayMenuSharedItem,
  OverlayMenuSharedItemRenderProps,
  OverlayMenuSharedSlots,
} from '../base/menu/index.ts'

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
  export interface Base extends Omit<OverlayMenuRootProps<Item>, 'itemProps' | 'itemRender'> {
    /** Custom renderer for individual items. */
    itemRender?: ComponentOrElement<ItemRenderProps>
    /** Additional attributes for an interactive menu item. */
    itemProps?: (props: ItemRenderProps) => ElementProps<HTMLDivElement> | undefined
    /**
     * Trigger content used to open the dropdown menu.
     */
    children: JSX.Element
    /** Root trigger click handler. */
    onClick?: JSX.EventHandlerUnion<HTMLSpanElement, MouseEvent>
    /** Root trigger keyboard handler. */
    onKeyDown?: JSX.EventHandlerUnion<HTMLSpanElement, KeyboardEvent>
  }

  /**
   * Props for the DropdownMenu component.
   */
  export type Props = BaseProps<'span', Base, Variant, Slot>
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
    'class',
    'style',
    'children',
    'onClick',
    'onKeyDown',
    'ref',
  ])
  const merged = mergeProps(
    {
      size: 'md' as const,
      checkedIcon: 'icon-check' as IconT.Name,
      submenuIcon: 'icon-chevron-right' as IconT.Name,
      placement: 'bottom-start' as OverlayMenuPlacement,
      gutter: 0,
    },
    local,
  )
  const resolvedId = useId(() => merged.id, 'dropdownmenu')
  const contentId = createMemo(() => `${resolvedId()}-content`)
  const [openState, setOpenState] = useControllableValue<boolean>({
    value: () => merged.open,
    defaultValue: () => merged.defaultOpen ?? false,
  })
  const isOpen = createMemo(() => Boolean(openState()))
  const [autoFocusStrategy, setAutoFocusStrategy] =
    createSignal<OverlayMenuFocusStrategy>('content')
  let triggerElement: HTMLElement | undefined

  const commitOpen = (open: boolean): void => {
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

  const openWithStrategy = (strategy: OverlayMenuFocusStrategy): void => {
    if (merged.disabled) {
      return
    }

    setAutoFocusStrategy(strategy)
    commitOpen(true)
  }

  return (
    <>
      <span
        ref={(element) => {
          triggerElement = element
          callRef(local.ref, element)
        }}
        data-slot="trigger"
        data-disabled={merged.disabled ? '' : undefined}
        data-expanded={isOpen() ? '' : undefined}
        data-closed={isOpen() ? undefined : ''}
        tabIndex={-1}
        aria-haspopup="menu"
        aria-controls={isOpen() ? contentId() : undefined}
        aria-expanded={isOpen() ? 'true' : 'false'}
        {...rest}
        style={{ ...merged.styles?.trigger, ...merged.style }}
        class={cn('outline-none', merged.classes?.trigger, merged.class)}
        onClick={(event) => {
          callHandler(event, local.onClick)
          if (event.defaultPrevented || merged.disabled) {
            return
          }

          if (isOpen()) {
            commitOpen(false)
            return
          }

          openWithStrategy('content')
        }}
        onKeyDown={(event) => {
          callHandler(event, local.onKeyDown)
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
        }}
      >
        {merged.children}
      </span>

      <OverlayMenu<DropdownMenuT.Item>
        id={resolvedId()}
        open={isOpen()}
        onClose={() => {
          commitOpen(false)
        }}
        triggerElement={triggerElement}
        placement={merged.placement}
        gutter={merged.gutter}
        autoFocusStrategy={autoFocusStrategy()}
        onAutoFocusHandled={() => {
          setAutoFocusStrategy('none')
        }}
        classes={merged.classes}
        styles={merged.styles}
        size={merged.size}
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
