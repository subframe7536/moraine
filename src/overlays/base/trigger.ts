import type { Accessor } from 'solid-js'
import { createSignal, onCleanup } from 'solid-js'

import type { ElementProps, SlotStyleValue } from '../../shared/types.ts'

/** Props that an overlay render prop must forward to its trigger root. */
export type OverlayTriggerProps = Omit<
  ElementProps<HTMLElement>,
  'children' | 'class' | 'disabled' | 'onContextMenu' | 'ref' | 'style'
> & {
  class?: string
  disabled?: boolean
  onContextMenu?: (event: MouseEvent) => void
  ref: (element: HTMLElement | undefined) => void
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

export function getOverlayTriggerDisabled(
  element: HTMLElement | undefined,
  disabled: boolean,
): boolean | undefined {
  return isNativeButtonTrigger(element) ? disabled : undefined
}

export function getOverlayTriggerAriaDisabled(
  element: HTMLElement | undefined,
  disabled: boolean,
): 'true' | undefined {
  return !isNativeButtonTrigger(element) && disabled ? 'true' : undefined
}

export function getOverlayTriggerTabIndex(
  element: HTMLElement | undefined,
  disabled: boolean,
): number | undefined {
  return isNativeButtonTrigger(element) ? undefined : disabled ? -1 : 0
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
