import type { ComponentStyleConfig } from '../../theme/types'

export interface FormStyleSlot<T = unknown> {
  /** Form root container. */
  root?: T
}

export type FormStyleVariants = never

export type FormStyleConfig = ComponentStyleConfig<FormStyleSlot>
