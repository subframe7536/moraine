import type { Accessor } from 'solid-js'
import { createSignal, onCleanup } from 'solid-js'

import type { ElementProps, SlotStyleValue } from '../../shared/types'

/** Props that an overlay render prop must forward to its trigger root. */
export type OverlayTriggerProps = Omit<
  ElementProps<HTMLElement>,
  'children' | 'class' | 'disabled' | 'onContextMenu' | 'ref' | 'style'
> & {
  /** Class applied to the trigger root. */
  class?: string

  /** Whether the trigger is disabled. */
  disabled?: boolean

  /** Context menu handler forwarded to the trigger root. */
  onContextMenu?: (event: MouseEvent) => void

  /** Registers the trigger root used for positioning and focus restoration. */
  ref: (element: HTMLElement | undefined) => void

  /** Style applied to the trigger root. */
  style?: SlotStyleValue
}

function isNativeButtonTrigger(element: HTMLElement | undefined): element is HTMLButtonElement {
  return typeof HTMLButtonElement !== 'undefined' && element instanceof HTMLButtonElement
}

export function createOverlayTriggerRef(): {
  element: Accessor<HTMLElement | undefined>
  ref: (element: HTMLElement | undefined) => void
} {
  const [element, setElement] = createSignal<HTMLElement | undefined>(undefined)

  const ref = (nextElement: HTMLElement | undefined): void => {
    setElement(nextElement)

    if (!nextElement) {
      return
    }

    onCleanup(() => {
      if (element() === nextElement) {
        setElement(undefined)
      }
    })
  }

  return { element, ref }
}

export function getOverlayTriggerAccessibility(
  element: HTMLElement | undefined,
  disabled: boolean,
): {
  ariaDisabled: 'true' | undefined
  disabled: boolean | undefined
  tabIndex: number | undefined
} {
  if (isNativeButtonTrigger(element)) {
    return { ariaDisabled: undefined, disabled, tabIndex: undefined }
  }

  return {
    ariaDisabled: disabled ? 'true' : undefined,
    disabled: undefined,
    tabIndex: disabled ? -1 : 0,
  }
}

export function validateOverlayTrigger(
  element: HTMLElement | undefined,
  overlayName: string,
): void {
  if (element instanceof HTMLElement) {
    return
  }

  throw new Error(
    `${overlayName} trigger render prop must forward the provided props to a single HTMLElement root.`,
  )
}
