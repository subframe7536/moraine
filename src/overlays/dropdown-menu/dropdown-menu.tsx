import type { JSX, ValidComponent } from 'solid-js'
import {
  children as resolveChildren,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  on,
  onMount,
  splitProps,
} from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createContextProvider } from '../../shared/create-context-provider'
import { createComponentStyles } from '../../shared/provider'
import { useControllableValue } from '../../shared/use-controllable-value'
import { useId } from '../../shared/utils'
import { OverlayMenu } from '../base/menu'
import type { OverlayMenuFocusStrategy } from '../base/menu'
import type { OverlayTriggerProps } from '../base/trigger'
import {
  createOverlayTriggerRef,
  getOverlayTriggerAccessibility,
  mergeMenuTriggerProps,
  validateOverlayTrigger,
} from '../base/trigger'

import type { DropdownMenuProps, DropdownMenuT } from './dropdown-menu.types'

/**
 * Triggered action menu anchored to its child content.
 */
function createDropdownMenu(props: DropdownMenuProps) {
  const resolvedId = useId(() => props.id, 'dropdownmenu')
  const contentId = createMemo(() => `${resolvedId()}-content`)
  const [openState, setOpenState] = useControllableValue<boolean>({
    value: () => props.open,
    defaultValue: () => props.defaultOpen ?? false,
  })
  const isOpen = createMemo(() => Boolean(openState()))
  const [autoFocusStrategy, setAutoFocusStrategy] =
    createSignal<OverlayMenuFocusStrategy>('content')
  const trigger = createOverlayTriggerRef()

  const triggerProps = {
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
      return props.disabled ? '' : undefined
    },
    get 'data-expanded'() {
      return isOpen() ? '' : undefined
    },
    'data-slot': 'trigger',
    get disabled() {
      return getOverlayTriggerAccessibility(trigger.element(), Boolean(props.disabled)).disabled
    },
    get 'aria-disabled'() {
      return getOverlayTriggerAccessibility(trigger.element(), Boolean(props.disabled)).ariaDisabled
    },
    get tabIndex() {
      return getOverlayTriggerAccessibility(trigger.element(), Boolean(props.disabled)).tabIndex
    },
    ref: (element: HTMLElement | undefined) => {
      trigger.ref(element)
    },
    onClick: (event: MouseEvent) => {
      if (event.defaultPrevented || props.disabled) {
        return
      }

      if (isOpen()) {
        commitOpen(false)
        return
      }

      openWithStrategy('content')
    },
    onKeyDown: (event: KeyboardEvent) => {
      if (event.defaultPrevented || props.disabled) {
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
  } as OverlayTriggerProps

  createEffect(
    on(
      () => Boolean(props.disabled) && isOpen(),
      (shouldClose) => {
        if (shouldClose) {
          commitOpen(false)
        }
      },
    ),
  )

  function commitOpen(open: boolean): void {
    if (open && props.disabled) {
      return
    }

    if (props.open === undefined) {
      setOpenState(open)
    }

    if (!open) {
      setAutoFocusStrategy('none')
    }

    props.onOpenChange?.(open)
  }

  function openWithStrategy(strategy: OverlayMenuFocusStrategy): void {
    if (props.disabled) {
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
        return props.placement
      },
      get gutter() {
        return props.gutter
      },
      get shift() {
        return props.shift
      },
      get autoFocusStrategy() {
        return autoFocusStrategy()
      },
      get preventScroll() {
        return props.preventScroll
      },
      get overflowPadding() {
        return props.overflowPadding
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

  const resolved = createComponentStyles('dropdownMenu', local, { rootSlot: 'trigger' })
  const binding = mergeMenuTriggerProps(rest, context.triggerProps)
  const children = resolveChildren(() => local.children)
  onMount(() => validateOverlayTrigger(context.triggerElement(), 'DropdownMenu'))
  return (
    <Dynamic
      component={(local.as as ValidComponent) ?? 'button'}
      type={local.as === undefined || local.as === 'button' ? 'button' : undefined}
      {...binding}
      {...resolved.root}
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

  const merged = mergeProps(
    { checkedIcon: 'icon-check', submenuIcon: 'icon-chevron-right' },

    local,
  )
  const resolved = createComponentStyles('dropdownMenu', local, { rootSlot: 'content' })
  return (
    <OverlayMenu<DropdownMenuT.Item>
      {...context.menuProps}
      slotBinding={resolved.slot}
      size={resolved.variants.size ?? undefined}
      items={merged.items}
      checkedIcon={merged.checkedIcon}
      submenuIcon={merged.submenuIcon}
      itemRender={merged.itemRender}
      contentProps={rest}
      itemProps={merged.itemProps}
      contentTop={merged.contentTop}
      contentBottom={merged.contentBottom}
    />
  )
}

DropdownMenu.Trigger = DropdownMenuTrigger
DropdownMenu.Content = DropdownMenuContent
