import type { Component, JSX } from 'solid-js'

import type { BaseProps, ValidComponent } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { IconT } from '../icon'

import type { CopyButtonStyleSlot, CopyButtonStyleVariants } from './copy-button.style-types'
import type { CopyData, CopySource, CopyState } from './create-copy'

export namespace CopyButtonT {
  export type Kind = 'single'

  export type Data = CopyData
  export type Source = CopySource
  export type State = CopyState

  export type Slot<T = unknown> = CopyButtonStyleSlot<T>
  export type Variants = CopyButtonStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface ChildrenRenderProps {
    /**
     * Whether the button is currently in copied state.
     */
    isCopied: boolean

    /**
     * Whether the button is currently in error state.
     */
    isError: boolean

    /**
     * Current copy state: 'idle' | 'copied' | 'failed'.
     */
    state: CopyState

    /**
     * Triggers copy operation with automatic fallback to command.
     */
    copy: (val?: CopySource) => Promise<boolean>

    /**
     * Whether clipboard operations are supported in the current environment.
     */
    isSupported: boolean

    /**
     * Whether the button is currently in loading state.
     */
    loading: boolean
  }

  /**
   * Base props for the CopyButton component.
   */
  export type Base<T extends ValidComponent = 'button'> = {
    /**
     * Element or component to render as.
     * @default 'button'
     */
    as?: T

    /**
     * Value to copy to the clipboard. Accepts a string, ClipboardItem, ClipboardItem[], or an accessor returning either.
     */
    value: CopySource

    /**
     * Duration in milliseconds to hold the 'copied' state before returning to 'idle'.
     * @default 2000
     */
    copiedDuration?: number

    /**
     * Disabled state, including for non-button polymorphic roots.
     */
    disabled?: boolean

    /**
     * Root `data-slot` name
     * @default 'copy-button'
     */
    slotName?: string

    /**
     * Icon displayed in the idle state. Pass `false` to disable icon display.
     * @default 'icon-copy'
     */
    icon?: IconT.Name

    /**
     * Icon displayed when copied.
     * @default 'icon-check'
     */
    copiedIcon?: IconT.Name

    /**
     * Position of the copy indicator icon relative to the label.
     * @default 'leading'
     */
    iconPosition?: 'leading' | 'trailing'

    /**
     * Callback fired when copy succeeds.
     */
    onCopy?: (data: CopyData) => void

    /**
     * Callback fired when copy fails.
     */
    onError?: (error: unknown) => void

    /**
     * Callback fired when copy status changes.
     */
    onStatusChange?: (details: { isCopied: boolean; state: CopyState }) => void

    /**
     * Content or render function receiving the copy state.
     * A render function must declare its parameter, even when unused.
     */
    children?: JSX.Element | Component<ChildrenRenderProps>
  }

  /**
   * Props for the CopyButton component.
   */
  export type Props<T extends ValidComponent = 'button'> = BaseProps<
    T,
    Base<T>,
    Variants,
    Classes,
    Styles,
    'button'
  >
}

/**
 * Props for the CopyButton component.
 */
export type CopyButtonProps<T extends ValidComponent = 'button'> = CopyButtonT.Props<T>
