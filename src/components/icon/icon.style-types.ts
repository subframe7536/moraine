import type { ComponentStyleConfig } from '../../theme/types'

export interface IconStyleSlot<T = unknown> {
  /** Rendered icon element. */
  root?: T
}

export type IconStyleVariants = never

/**
 * Variants that Icon selects from `name`. They are not props, so they stay out of
 * `IconStyleVariants`.
 */
export interface IconInternalVariants {
  /** `true` for a string icon class, `false` for a JSX node or component. */
  isMask?: boolean
}

export type IconStyleConfig = ComponentStyleConfig<IconStyleSlot>
