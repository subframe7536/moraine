import type { Component, JSX, Ref } from 'solid-js'

import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { ListVirtualizer, VirtualRowProps } from '../../virtualizer/virtualizer.types'

import type { ScrollAreaStyleSlot, ScrollAreaStyleVariants } from './scroll-area.style-types'

export namespace ScrollAreaT {
  export type Kind = 'single'
  export type Slot<T = unknown> = ScrollAreaStyleSlot<T>
  export type Variants = ScrollAreaStyleVariants
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  /** Scroll axis: `x` is horizontal and `y` is vertical. */
  export type Axis = 'x' | 'y'
  /** Logical edge of an axis. On `x`, `start` is the right edge in RTL content. */
  export type Edge = 'start' | 'end'

  /** Whether content extends beyond each edge of one axis. */
  export interface AxisOverflow {
    readonly start: boolean
    readonly end: boolean
  }

  /** Overflowing edges of both axes. Axes outside `orientation` never overflow. */
  export interface Overflow {
    readonly x: AxisOverflow
    readonly y: AxisOverflow
  }

  export interface ScrollToEdgeOptions {
    behavior?: ScrollBehavior
  }

  /** Imperative access to a mounted scroll area. */
  export interface Controller {
    /** Current overflowing edges. Reading it inside a tracking scope subscribes to changes. */
    readonly overflow: Overflow
    /** Scrolls the viewport to an edge of an axis. */
    scrollToEdge: (axis: Axis, edge: Edge, options?: ScrollToEdgeOptions) => void
  }

  /** Attributes a virtualizer supplies for the outer row element. */
  export type RowProps = VirtualRowProps

  export interface ItemRenderProps<TItem> {
    /** Source item being rendered. */
    readonly item: TItem
    /** Current index in the complete item collection. */
    readonly index: number
    /**
     * Attributes from the `virtualizer` for the outer row element: positioning style,
     * measurement ref, and `data-index`. Spread them onto the row; undefined without one.
     */
    readonly props?: RowProps
  }

  /** Virtualizer accepted by the `virtualizer` prop, such as `createListVirtualizer()`. */
  export type Virtualizer<TItem> = ListVirtualizer<TItem>

  export type Base<TItem = unknown> = {
    /** Content rendered inside the viewport. Ignored when `itemRender` is set. */
    children?: JSX.Element
    /** Reactive collection rendered with `itemRender`. */
    items?: readonly TItem[]
    /** Renders one collection item. Takes the place of `children`. */
    itemRender?: Component<ItemRenderProps<TItem>>
    /**
     * Renders only the visible `items`. The viewport is the scroll container; create the
     * virtualizer with `horizontal` for `orientation="horizontal"`.
     */
    virtualizer?: Virtualizer<TItem>
    /** Shadow length in pixels while `shadow` is enabled. @default 40 */
    shadowSize?: number
    /** Distance in pixels from an edge within which it counts as reached. @default 0 */
    edgeThreshold?: number
    /** Milliseconds `hover` and `scroll` scrollbars stay visible after activity ends. @default 600 */
    scrollHideDelay?: number
    /** Receives the native scroll container. */
    viewportRef?: Ref<HTMLDivElement>
    /** Receives the imperative controller once, during setup. */
    controllerRef?: (controller: Controller) => void
    /** Called when the overflowing edges change. */
    onOverflowChange?: (overflow: Overflow) => void
    /** Called when scrolling reaches the start edge of an overflowing axis. */
    onReachStart?: (axis: Axis) => void
    /** Called when scrolling reaches the end edge of an overflowing axis. */
    onReachEnd?: (axis: Axis) => void
  }

  export type Props<TItem = unknown> = BaseProps<'div', Base<TItem>, Variants, Classes, Styles>
}

export type ScrollAreaProps<TItem = unknown> = ScrollAreaT.Props<TItem>
