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
    readonly rowProps?: RowProps
  }

  /** Virtualizer accepted by the `virtualizer` prop, such as `createListVirtualizer()`. */
  export type Virtualizer<TItem> = ListVirtualizer<TItem>

  export type Base<TItem = unknown> = {
    /** Content rendered inside the viewport. Ignored when `itemRender` is set. */
    children?: JSX.Element
    /** Reactive collection rendered with `itemRender`. Has no effect without `itemRender`. */
    items?: readonly TItem[]
    /**
     * Renders one collection item. Takes the place of `children`. It is mounted as a component, so
     * read `props.item` and `props.index` lazily instead of destructuring them.
     * @example
     * ```tsx
     * import { ScrollArea } from 'moraine'
     *
     * <ScrollArea
     *   class="h-48"
     *   items={['Alpha', 'Beta', 'Gamma']}
     *   itemRender={(props) => (
     *     <p>
     *       {props.index + 1}. {props.item}
     *     </p>
     *   )}
     * />
     * ```
     */
    itemRender?: Component<ItemRenderProps<TItem>>
    /**
     * Renders only the visible `items`. The viewport is the scroll container; create the
     * virtualizer with `horizontal` for `orientation="horizontal"`. Requires `itemRender`, and
     * the row element must spread `props.props` so the virtualizer can position and measure it.
     * @example
     * ```tsx
     * import { ScrollArea } from 'moraine'
     * import { createListVirtualizer } from 'moraine/virtualizer'
     *
     * const rows = Array.from({ length: 10000 }, (_, index) => `Row ${index + 1}`)
     * const virtualizer = createListVirtualizer<string>({ estimateSize: () => 32 })
     *
     * <ScrollArea
     *   class="h-64"
     *   items={rows}
     *   virtualizer={virtualizer}
     *   itemRender={(props) => <div {...props.props}>{props.item}</div>}
     * />
     * ```
     */
    virtualizer?: Virtualizer<TItem>
    /** Length in pixels of the edge fade shadows while the `shadow` variant is enabled. Negative values count as `0`. @default 40 */
    shadowSize?: number
    /** Distance in pixels from an edge within which it counts as reached. It also decides when the edge shadows and the `on*Reached` callbacks respond. Negative values count as `0`. @default 0 */
    scrollThreshold?: number
    /** Milliseconds `hover` and `scroll` scrollbars stay visible after pointer or scroll activity ends. Other scrollbar modes ignore it. @default 600 */
    scrollHideDelay?: number
    /** Receives the native scrolling `<div>` that wraps the content, to read or set `scrollTop` and similar. */
    viewportRef?: Ref<HTMLDivElement>
    /**
     * Receives the imperative controller once, during setup. Store it and call it later; the viewport
     * only exists after mount, so `scrollToEdge` called during setup does nothing.
     * @example
     * ```tsx
     * import { ScrollArea } from 'moraine'
     * import type { ScrollAreaT } from 'moraine'
     *
     * let controller: ScrollAreaT.Controller | undefined
     *
     * <>
     *   <button onClick={() => controller?.scrollToEdge('y', 'end', { behavior: 'smooth' })}>
     *     Jump to bottom
     *   </button>
     *   <ScrollArea class="h-48" setController={(value) => (controller = value)}>
     *     Long content
     *   </ScrollArea>
     * </>
     * ```
     */
    setController?: (controller: Controller) => void
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

  export type Props<TItem = unknown> = BaseProps<'div', Base<TItem>, Variants, Classes, Styles>
}

export type ScrollAreaProps<TItem = unknown> = ScrollAreaT.Props<TItem>
