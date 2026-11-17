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
     * Whether the last copy succeeded and the `copiedDuration` window is still active.
     */
    isCopied: boolean

    /**
     * Whether the last copy failed and the `copiedDuration` window is still active.
     */
    isError: boolean

    /**
     * Current copy state: `'idle'`, `'copied'` (after a successful copy), or `'failed'`.
     */
    state: CopyState

    /**
     * Starts a copy programmatically. Copies `val`, or the button's `value` when omitted, and
     * resolves to `true` on success or `false` on failure.
     */
    copy: (val?: CopySource) => Promise<boolean>

    /**
     * Whether `navigator.clipboard` or `document.execCommand` is available. Always `false` during
     * server rendering.
     */
    isSupported: boolean

    /**
     * Currently always `false`; the button has no loading state.
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
     * What to copy on click: a string, a `ClipboardItem`, a `ClipboardItem[]`, a `Promise` of
     * either, or a function returning one. A function is called on every click and a promise is
     * awaited first; if it rejects or throws, the copy fails and `onError` receives the error.
     * Non-string data is written with `navigator.clipboard.write`; the `execCommand` fallback can
     * only copy text.
     * @example
     * ```tsx
     * import { CopyButton } from 'moraine'
     *
     * <CopyButton
     *   value={async () => (await fetch('/api/share-link')).text()}
     *   onError={(error) => console.error(error)}
     * >
     *   Copy share link
     * </CopyButton>
     * ```
     */
    value: CopySource

    /**
     * Duration in milliseconds to hold the `'copied'` or `'failed'` state before returning to
     * `'idle'`. While the `'copied'` state is active the icon switches to `copiedIcon` and the
     * default `aria-label` changes to the localized "copied" message.
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
     * Icon displayed in the idle and failed states. Pass `false` (or `null`) to hide the icon;
     * without children the button then has no visible content.
     * @default 'icon-copy'
     */
    icon?: IconT.Name

    /**
     * Icon displayed during the `'copied'` state, in place of `icon`.
     * @default 'icon-check'
     */
    copiedIcon?: IconT.Name

    /**
     * Position of the copy indicator icon relative to the label. Has no effect without children.
     * @default 'leading'
     */
    iconPosition?: 'leading' | 'trailing'

    /**
     * Called after the copy succeeds, with the resolved data that was written (after awaiting a
     * promise or calling a function `value`).
     */
    onCopy?: (data: CopyData) => void

    /**
     * Called when the copy fails, with the thrown or rejected error, or an `Error` when the
     * clipboard could not be written. The button then has `aria-invalid` until `copiedDuration`
     * elapses.
     */
    onError?: (error: unknown) => void

    /**
     * Called on every state change: `'idle'` when a copy starts, then `'copied'` or `'failed'`,
     * and `'idle'` again after `copiedDuration`. `isCopied` is `true` only for `'copied'`.
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
