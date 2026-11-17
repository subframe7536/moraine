import type { JSX } from 'solid-js'

import type { SlotClassValue, SlotStyleValue } from '../../../../theme/style-types'
import type { ButtonT } from '../../../button'
import type { IconT } from '../../../icon'

export type FeedbackId = string | number

export type FeedbackCloseReason = 'action' | 'cancel' | 'dismiss' | 'timeout' | 'api'

export type FeedbackPending = 'action' | 'cancel'

export interface FeedbackAction {
  /**
   * Button content. When omitted, the host's default label is used, for example the localized OK
   * or Cancel text.
   */
  label?: JSX.Element
  /** Button `variant`; overrides the default the host picks for this button. */
  variant?: ButtonT.Variants['variant']
  /** Button `tone`; overrides the default the host picks for this button. */
  tone?: ButtonT.Variants['tone']
  /** Name of the icon shown before the label. */
  leading?: IconT.Name
  /** Whether the button is disabled. */
  disabled?: boolean
  /** Class applied to the button. */
  class?: SlotClassValue
  /** Style applied to the button. */
  style?: SlotStyleValue
  /**
   * Called when the button is pressed, with the click event. After it runs, the dialog or toast
   * closes, unless the handler throws or rejects (the error is logged) or calls
   * `event.preventDefault()`. Return a promise to show a pending state on the button; the
   * instance closes once it resolves.
   */
  onClick?: (event?: MouseEvent) => void | Promise<unknown>
}

export interface FeedbackHandle<Update> {
  id: FeedbackId
  update: (options: Update) => void
  close: () => void
  result: () => Promise<FeedbackCloseReason>
}
