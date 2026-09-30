import type { Orientation } from '../../theme/style-types'
import type { ComponentStyleConfig } from '../../theme/types'
export interface SeparatorStyleSlot<T = unknown> {
  /** Visual divider element. */
  root?: T
}

export interface SeparatorStyleVariant {
  /** Layout axis used by the component Recipe. */
  orientation?: Orientation
}

export type SeparatorStyleConfig = ComponentStyleConfig<SeparatorStyleSlot, SeparatorStyleVariant>
