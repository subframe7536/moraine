import type { Component, JSX } from 'solid-js'

import type { BaseProps, ValidComponent } from '../../shared/types'
import type { ListVirtualizer, VirtualRowProps } from '../../shared/virtual'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'

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

  export type Base<TItem> = {
    /** Content rendered inside the list when the collection is empty. */
    fallback?: JSX.Element
    /** Reactive collection rendered by the list. */
    items?: readonly TItem[]
    /** Renders one collection item. */
    itemRender: Component<ItemRenderProps<TItem>>
    /** Renders only the visible items. The list root is the scroll container. */
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
