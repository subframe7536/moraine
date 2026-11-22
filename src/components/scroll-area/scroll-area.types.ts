import type { JSX, Ref } from 'solid-js'

import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'

import type { ScrollAreaStyleSlot, ScrollAreaStyleVariants } from './scroll-area.style-types'

export namespace ScrollAreaT {
  export type Kind = 'single'
  export type Slot<T = unknown> = ScrollAreaStyleSlot<T>
  export type Variants = ScrollAreaStyleVariants
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  /** Scroll axis: `x` is horizontal and `y` is vertical. */
  export type Axis = 'x' | 'y'

  /** Whether content extends beyond each edge of one axis. On `x`, `start` is the right edge in RTL content. */
  export interface AxisOverflow {
    readonly start: boolean
    readonly end: boolean
  }

  /** Overflowing edges of both axes. Axes outside `orientation` never overflow. */
  export interface Overflow {
    readonly x: AxisOverflow
    readonly y: AxisOverflow
  }

  export type Base = {
    /** Content rendered inside the viewport. */
    children?: JSX.Element
    /** Length in pixels of the edge fade shadows while the `fade` variant is enabled. Negative values count as `0`. @default 40 */
    fadeSize?: number
    /** Distance in pixels from an edge within which it counts as reached. It also decides when the edge shadows and the `on*Reached` callbacks respond. Negative values count as `0`. @default 0 */
    scrollThreshold?: number
    /** Milliseconds `hover` and `scroll` scrollbars stay visible after pointer or scroll activity ends. Other scrollbar modes ignore it. @default 600 */
    scrollHideDelay?: number
    /** Receives the native scrolling `<div>` that wraps the content, to read or set `scrollTop`, call `scrollTo`, and similar. */
    viewportRef?: Ref<HTMLDivElement>
    /** Called with the new `Overflow` whenever content starts or stops extending beyond an edge, for example while scrolling or after a resize. */
    onOverflowChange?: (overflow: Overflow) => void
    /** Called once each time scrolling returns to the top edge (within `scrollThreshold`) of an overflowing vertical axis; not called for the initial position. */
    onTopReached?: () => void
    /** Called once each time scrolling reaches the bottom edge (within `scrollThreshold`) of an overflowing vertical axis, such as to load more items. */
    onBottomReached?: () => void
    /** Called once each time scrolling reaches the left edge (within `scrollThreshold`) of an overflowing horizontal axis; in RTL content that is the logical end. */
    onLeftReached?: () => void
    /** Called once each time scrolling reaches the right edge (within `scrollThreshold`) of an overflowing horizontal axis; in RTL content that is the logical start. */
    onRightReached?: () => void
  }

  export type Props = BaseProps<'div', Base, Variants, Classes, Styles>
}

export type ScrollAreaProps = ScrollAreaT.Props
