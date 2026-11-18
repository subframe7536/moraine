import type { ComponentStyleConfig } from '../../theme/types'

export interface BaseDialogStyleSlot<T = unknown> {
  /** Fixed backdrop that contains the modal shell. */
  overlay?: T

  /** Dialog panel that contains the dialog content. */
  content?: T
}

export type BaseDialogStyleVariants = never

export type BaseDialogStyleConfig = ComponentStyleConfig<BaseDialogStyleSlot>
