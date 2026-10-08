import { createEffect, createMemo, createSignal, mergeProps, on } from 'solid-js'

import { createControllableValue } from '../../shared/controllable-value'
import { createContextProvider } from '../../shared/create-context-provider'
import { createId } from '../../shared/utils'
import type { OverlayMenuFocusStrategy } from '../base/menu'

import { dropdownMenuDataAttributes } from './dropdown-menu.recipe'
import type { DropdownMenuProps } from './dropdown-menu.types'

export function createDropdownMenu(props: DropdownMenuProps) {
  const resolvedId = createId(() => props.id, 'dropdownmenu')
  const contentId = createMemo(() => `${resolvedId()}-content`)
  const [isOpen, setOpenState] = createControllableValue<boolean>({
    value: () => props.open,
    defaultValue: () => props.defaultOpen ?? false,
  })
  const [autoFocusStrategy, setAutoFocusStrategy] =
    createSignal<OverlayMenuFocusStrategy>('content')
  const [triggerElement, setTriggerElement] = createSignal<HTMLElement>()

  const triggerDataAttrs = dropdownMenuDataAttributes.trigger({
    closed: () => !isOpen(),
    disabled: () => props.disabled,
    expanded: isOpen,
  })
  const triggerProps = mergeProps(triggerDataAttrs, {
    id: resolvedId(),
    get 'aria-controls'() {
      return isOpen() ? contentId() : undefined
    },
    'aria-haspopup': 'menu' as const,
    get 'aria-expanded'() {
      return isOpen() ? 'true' : 'false'
    },
    'data-slot': 'dropdown-menu-trigger',
  })

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
    if (open === isOpen()) {
      return
    }

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
    get presentation() {
      return { classes: props.classes, styles: props.styles }
    },
    triggerProps,
    triggerElement,
    setTriggerElement,
    disabled: () => Boolean(props.disabled),
    isOpen,
    commitOpen,
    openWithStrategy,
    menuProps: {
      get id() {
        return resolvedId()
      },
      get open() {
        return isOpen()
      },
      onClose: () => commitOpen(false),
      get triggerElement() {
        return triggerElement()
      },
      get placement() {
        return props.placement
      },
      get align() {
        return props.align
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

export type DropdownMenuContextValue = ReturnType<typeof createDropdownMenu>

export const [DropdownMenuProvider, useDropdownMenuContext] =
  /* @__PURE__ */ createContextProvider<DropdownMenuContextValue>('DropdownMenu')
