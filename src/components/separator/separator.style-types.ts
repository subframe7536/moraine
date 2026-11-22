import type { Orientation } from '../../theme/style-types'
import type { ComponentStyleConfig } from '../../theme/types'
export interface SeparatorStyleSlot<T = unknown> {
  /** Visual divider element. */
  root?: T
}

export interface SeparatorStyleVariants {
  /**
   * `horizontal` draws a full-width line; `vertical` draws a full-height line for use between items in a row. Both set the matching `aria-orientation` and `data-orientation`.
   * @default 'horizontal'
   */
  orientation?: Orientation
}

export type SeparatorStyleConfig = ComponentStyleConfig<SeparatorStyleSlot, SeparatorStyleVariants>
