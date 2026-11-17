import type { Component, JSX } from 'solid-js'

import type { BaseProps, ValidComponent } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { ListVirtualizer, VirtualRowProps } from '../../virtualizer/virtualizer.types'

import type { ListStyleSlot, ListStyleVariants } from './list.style-types'

export namespace ListT {
  export type Kind = 'single'
  export type Slot<T = unknown> = ListStyleSlot<T>
  export type Variants = ListStyleVariants
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

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

  /** Render props for the empty state content. */
  export interface EmptyRenderProps {}

  export type Base<TItem> = {
    /**
     * Content or component rendered inside the list root when `items` is empty or `undefined`.
     * Without it, an empty list renders no children. Render a list item here when the root is a `ul`.
     */
    emptyRender?: JSX.Element | Component<EmptyRenderProps>
    /** Collection to render, one `itemRender` call per entry. Treated as empty when `undefined`. */
    items?: readonly TItem[]
    /**
     * Renders one row for an item. Receives the `item`, its `index` in the complete `items`
     * collection, and, when a `virtualizer` is set, `props` to spread onto the row's outer element.
     * @example
     * ```tsx
     * import { List } from 'moraine'
     *
     * <List
     *   items={['Inbox', 'Sent']}
     *   itemRender={(row) => <li data-index={row.index}>{row.item}</li>}
     * />
     * ```
     */
    itemRender: Component<ItemRenderProps<TItem>>
    /**
     * Virtualizer from `moraine/virtualizer` that mounts only the visible rows; create it with
     * `createListVirtualizer()`. The list root becomes the scroll container, so give it a bounded
     * height, and each row must spread `props` from `itemRender` onto its outer element.
     * @example
     * ```tsx
     * import { List } from 'moraine'
     * import { createListVirtualizer } from 'moraine/virtualizer'
     *
     * const items = Array.from({ length: 10_000 }, (_, i) => `Row ${i}`)
     * const virtualizer = createListVirtualizer<string>({ estimateSize: () => 32 })
     *
     * <List
     *   class="h-80 overflow-auto"
     *   items={items}
     *   virtualizer={virtualizer}
     *   itemRender={(row) => <li {...row.props}>{row.item}</li>}
     * />
     * ```
     */
    virtualizer?: Virtualizer<TItem>
  }

  export type Props<TItem, T extends ValidComponent = 'ul'> = BaseProps<
    T,
    Base<TItem> & {
      /** Root element or component. @default 'ul' */
      as?: T
    },
    Variants,
    Classes,
    Styles,
    'ul'
  >
}

export type ListProps<TItem, T extends ValidComponent = 'ul'> = ListT.Props<TItem, T>
