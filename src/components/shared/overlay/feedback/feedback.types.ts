import type { JSX } from 'solid-js'

import type { SlotClassValue, SlotStyleValue } from '../../../../theme/style-types'
import type { ButtonT } from '../../../button'
import type { IconT } from '../../../icon'

export type FeedbackId = string | number

export type FeedbackCloseReason = 'action' | 'cancel' | 'dismiss' | 'timeout' | 'api'

export type FeedbackPending = 'action' | 'cancel'

export interface FeedbackAction {
  label?: JSX.Element
  variant?: ButtonT.Variants['variant']
  tone?: ButtonT.Variants['tone']
  leading?: IconT.Name
  disabled?: boolean
  class?: SlotClassValue
  style?: SlotStyleValue
  onClick?: (event?: MouseEvent) => void | Promise<unknown>
}

export interface FeedbackHandle<Update> {
  id: FeedbackId
  update: (options: Update) => void
  close: () => void
  result: () => Promise<FeedbackCloseReason>
}
