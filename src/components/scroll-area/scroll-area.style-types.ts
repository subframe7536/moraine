import type { ComponentStyleConfig } from '../../theme/types'

export interface ScrollAreaStyleSlot<T = unknown> {
  /** Positioning wrapper around the viewport and scrollbars. */
  root?: T
  /** Native scroll container. */
  viewport?: T
  /** Wrapper around the scrolled content. */
  content?: T
  /** Custom scrollbar track, one per scrollable axis. */
  scrollbar?: T
  /** Draggable thumb inside a scrollbar. */
  thumb?: T
  /** Square where the vertical and horizontal scrollbars meet. */
  corner?: T
}

export interface ScrollAreaStyleVariants {
  /** Scrollable axes. @default 'vertical' */
  orientation?: 'vertical' | 'horizontal' | 'both'
  /**
   * Scrollbar presentation. `auto` shows custom scrollbars while an axis overflows, `always` keeps
   * them visible, `hover` shows them while the pointer is over the area or it scrolls, `scroll`
   * shows them while it scrolls, `native` keeps browser scrollbars, and `hidden` hides every
   * scrollbar while retaining scrolling. @default 'auto'
   */
  scrollbar?: 'auto' | 'always' | 'hover' | 'scroll' | 'native' | 'hidden'
  /** Whether edges with more content beyond them fade out as a shadow. @default false */
  shadow?: boolean
}

export type ScrollAreaStyleConfig = ComponentStyleConfig<
  ScrollAreaStyleSlot,
  ScrollAreaStyleVariants
>
