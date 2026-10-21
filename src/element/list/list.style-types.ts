import type { ComponentStyleConfig } from '../../theme/types'

export interface ListStyleSlot<T = unknown> {
  /** List container element. */
  root?: T
}

export type ListStyleVariants = never

export type ListStyleConfig = ComponentStyleConfig<ListStyleSlot>
