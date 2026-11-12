import { createSignal, mergeProps } from 'solid-js'

import { createContextProvider } from '../../shared/create-context-provider'
import { createId } from '../../shared/utils'
import { createOverlayMenuOpen } from '../shared/overlay/menu'

import { dropdownMenuDataAttributes } from './dropdown-menu.recipe'
import type { DropdownMenuProps } from './dropdown-menu.types'

export function createDropdownMenu(props: DropdownMenuProps) {
  const resolvedId = createId(() => props.id, 'dropdownmenu')
  const contentId = () => `${resolvedId()}-content`
  const { isOpen, commitOpen, openWithStrategy, autoFocusStrategy, setAutoFocusStrategy } =
    createOverlayMenuOpen({
      open: () => props.open,
      defaultOpen: () => props.defaultOpen,
      onOpenChange: (open) => props.onOpenChange?.(open),
      disabled: () => Boolean(props.disabled),
      defaultAutoFocusStrategy: 'content',
    })
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

  return {
    get slotOverrides() {
      return { classes: props.classes, styles: props.styles }
    },
    size: () => props.size,
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
