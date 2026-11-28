import type { ComponentStyleConfig } from '../../theme/types'
export interface HoverCardStyleSlot<T = unknown> {
  /** Element that opens the hover card. */
  trigger?: T

  /** Positioned card anchored to the trigger. */
  content?: T
}

export type HoverCardStyleVariants = never

export type HoverCardStyleConfig = ComponentStyleConfig<HoverCardStyleSlot>
