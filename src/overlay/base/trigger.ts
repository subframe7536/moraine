import type { JSX } from 'solid-js'

import type { BaseProps, ElementProps, ValidComponent } from '../../shared/types'
import type { SlotStyleValue } from '../../theme/style-types'

import { isHTMLElement, isNativeButtonElement } from './dom'

export interface OverlayTriggerBase<T extends ValidComponent = 'button'> {
  /** Element or component to render as. */
  as?: T
  /** Whether this trigger is disabled. */
  disabled?: boolean
  /** Trigger label and visual content. */
  children?: JSX.Element
}

export type OverlayTriggerComponentProps<T extends ValidComponent = 'button'> = BaseProps<
  T,
  OverlayTriggerBase<T>,
  never,
  never,
  never,
  'button'
>

/** Props that an overlay render prop must forward to its trigger root. */
export type OverlayTriggerBinding = Omit<
  ElementProps,
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

export function getContextMenuTriggerAccessibility(
  element: HTMLElement | undefined,
  disabled: boolean,
): {
  ariaDisabled: 'true' | undefined
  disabled: boolean | undefined
  tabIndex: number | undefined
} {
  if (isNativeButtonElement(element)) {
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
  if (isHTMLElement(element)) {
    return
  }

  throw new Error(
    `${overlayName} trigger render prop must forward the provided props to a single HTMLElement root.`,
  )
}
