import type { Orientation } from '../../theme/style-types'
import type { ComponentStyleConfig } from '../../theme/types'

export interface ScrollAreaStyleSlot<T = unknown> {
  /** Native scroll container. */
  root?: T
}

export interface ScrollAreaStyleVariant {
  /** Scroll axis. @default 'vertical' */
  orientation?: Orientation
  /** Whether overflowing edges fade out. @default false */
  shadow?: boolean
  /** Hide the native scrollbar while retaining scrolling. @default false */
  hideScrollbar?: boolean
}

export type ScrollAreaStyleConfig = ComponentStyleConfig<
  ScrollAreaStyleSlot,
  ScrollAreaStyleVariant
>
