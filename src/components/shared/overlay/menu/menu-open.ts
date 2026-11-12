import type { Accessor } from 'solid-js'
import { createEffect, createSignal, on } from 'solid-js'

import { createControllableValue } from '../../../../shared/controllable-value'

import type { OverlayMenuFocusStrategy } from './menu.utils'

export interface CreateOverlayMenuOpenOptions {
  open?: Accessor<boolean | undefined>
  defaultOpen?: Accessor<boolean | undefined>
  onOpenChange?: (open: boolean) => void
  disabled?: Accessor<boolean | undefined>
  defaultAutoFocusStrategy?: OverlayMenuFocusStrategy
}

export interface OverlayMenuOpenState {
  isOpen: Accessor<boolean>
  commitOpen: (nextOpen: boolean) => void
  openWithStrategy: (strategy: OverlayMenuFocusStrategy) => void
  autoFocusStrategy: Accessor<OverlayMenuFocusStrategy>
  setAutoFocusStrategy: (strategy: OverlayMenuFocusStrategy) => void
}

/**
 * Normalizes controlled and uncontrolled open state, focus strategy, and disabled
 * auto-closing for overlay menus.
 */
export function createOverlayMenuOpen(options: CreateOverlayMenuOpenOptions): OverlayMenuOpenState {
  const [openState, setOpenState] = createControllableValue({
    value: () => options.open?.(),
    defaultValue: () => options.defaultOpen?.() ?? false,
    onChange: options.onOpenChange,
  })
  const isOpen = () => openState()
  const [autoFocusStrategy, setAutoFocusStrategy] = createSignal<OverlayMenuFocusStrategy>(
    options.defaultAutoFocusStrategy ?? 'none',
  )

  createEffect(
    on(
      () => Boolean(options.disabled?.()) && isOpen(),
      (shouldClose) => {
        if (shouldClose) {
          commitOpen(false)
        }
      },
    ),
  )

  function commitOpen(nextOpen: boolean): void {
    if (nextOpen === isOpen() || (nextOpen && options.disabled?.())) {
      return
    }

    if (!nextOpen) {
      setAutoFocusStrategy('none')
    }

    setOpenState(nextOpen)
  }

  function openWithStrategy(strategy: OverlayMenuFocusStrategy): void {
    if (options.disabled?.()) {
      return
    }

    setAutoFocusStrategy(strategy)
    commitOpen(true)
  }

  return {
    isOpen,
    commitOpen,
    openWithStrategy,
    autoFocusStrategy,
    setAutoFocusStrategy,
  }
}
