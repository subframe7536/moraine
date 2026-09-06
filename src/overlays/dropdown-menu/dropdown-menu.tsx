import type { JSX, ValidComponent } from 'solid-js'
import {
  children as resolveChildren,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  onMount,
  splitProps,
} from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createContextProvider } from '../../shared/create-context-provider.tsx'
import { resolveComponentStyle, useMoraineDesign } from '../../shared/provider/index.ts'
import type { ElementProps } from '../../shared/types.ts'
import { useControllableValue } from '../../shared/use-controllable-value.ts'
import { useId } from '../../shared/utils.ts'
import { OverlayMenu } from '../base/menu/index.ts'
import type { OverlayMenuFocusStrategy } from '../base/menu/index.ts'
import type { OverlayTriggerProps } from '../base/trigger.ts'
import {
  createOverlayTriggerRef,
  getOverlayTriggerAccessibility,
  mergeMenuTriggerProps,
  validateOverlayTrigger,
} from '../base/trigger.ts'

import type { DropdownMenuProps, DropdownMenuT } from './dropdown-menu.types.ts'

export type { DropdownMenuProps, DropdownMenuT } from './dropdown-menu.types.ts'

/**
 * Triggered action menu anchored to its child content.
 */
function createDropdownMenu(props: DropdownMenuProps) {
  const merged = mergeProps(
    {
      placement: 'bottom-start' as const,
      gutter: 0,
    },
    props,
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
  const trigger = createOverlayTriggerRef()

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
    {
      ref: (element: HTMLElement | undefined) => {
        trigger.ref(element)
      },
      onClick: (event: MouseEvent) => {
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

  return {
    triggerProps,
    triggerElement: trigger.element,
    menuProps: {
      get id() {
        return resolvedId()
      },
      get open() {
        return isOpen()
      },
      onClose: () => commitOpen(false),
      get triggerElement() {
        return trigger.element()
      },
      get placement() {
        return merged.placement
      },
      get gutter() {
        return merged.gutter
      },
      get shift() {
        return merged.shift
      },
      get autoFocusStrategy() {
        return autoFocusStrategy()
      },
      get preventScroll() {
        return merged.preventScroll
      },
      get overflowPadding() {
        return merged.overflowPadding
      },
      onAutoFocusHandled: () => setAutoFocusStrategy('none'),
    },
  }
}

const [DropdownMenuProvider, useDropdownMenuContext] =
  createContextProvider<ReturnType<typeof createDropdownMenu>>('DropdownMenu')

/** Menu state and interaction context, without a DOM root. */
export function DropdownMenu(props: DropdownMenuProps): JSX.Element {
  const context = createDropdownMenu(props)
  return <DropdownMenuProvider value={context}>{props.children}</DropdownMenuProvider>
}

function DropdownMenuTrigger<T extends ValidComponent = 'button'>(
  props: DropdownMenuT.TriggerProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, ['as', 'children', 'class', 'style'])
  const context = useDropdownMenuContext()
  const design = useMoraineDesign()
  const resolved = resolveComponentStyle({
    rootSlot: 'trigger',
    design: {
      get classes() {
        return design().dropdownMenu.recipe()
      },
    },
    get instance() {
      return local
    },
  })
  const binding = mergeMenuTriggerProps(
    mergeProps(rest, resolved.rootClassAndStyle()) as Partial<OverlayTriggerProps>,
    context.triggerProps,
  )
  const children = resolveChildren(() => local.children)
  onMount(() => validateOverlayTrigger(context.triggerElement(), 'DropdownMenu'))
  return (
    <Dynamic
      component={(local.as as ValidComponent) ?? 'button'}
      type={local.as === undefined || local.as === 'button' ? 'button' : undefined}
      {...binding}
    >
      {children()}
    </Dynamic>
  )
}

function DropdownMenuContent(props: DropdownMenuT.ContentProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'items',
    'itemRender',
    'itemProps',
    'contentTop',
    'contentBottom',
    'checkedIcon',
    'submenuIcon',
    'size',
    'class',
    'style',
    'classes',
    'styles',
  ])
  const context = useDropdownMenuContext()
  const design = useMoraineDesign()
  const merged = mergeProps(
    { size: 'md' as const, checkedIcon: 'icon-check', submenuIcon: 'icon-chevron-right' },
    () => design().dropdownMenu.defaultVariants,
    local,
  )
  const resolved = resolveComponentStyle({
    rootSlot: 'content',
    design: {
      get classes() {
        return design().dropdownMenu.recipe({ size: merged.size })
      },
    },
    get instance() {
      return local
    },
  })
  return (
    <OverlayMenu<DropdownMenuT.Item>
      {...context.menuProps}
      slotClassAndStyle={resolved.slotClassAndStyle}
      size={merged.size ?? undefined}
      items={merged.items}
      checkedIcon={merged.checkedIcon}
      submenuIcon={merged.submenuIcon}
      itemRender={merged.itemRender}
      contentProps={rest as ElementProps<HTMLDivElement>}
      itemProps={merged.itemProps}
      contentTop={merged.contentTop}
      contentBottom={merged.contentBottom}
    />
  )
}

DropdownMenu.Trigger = DropdownMenuTrigger
DropdownMenu.Content = DropdownMenuContent
