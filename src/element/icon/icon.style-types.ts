import type { ComponentStyleConfig } from '../../theme/types'

export interface IconStyleSlot<T = unknown> {
  /** Rendered icon element. */
  root?: T
}

export type IconStyleVariant = never

export type IconStyleConfig = ComponentStyleConfig<IconStyleSlot>
