import type { Component, JSX } from 'solid-js'

import type { Sortable as SortableContract, SortableDropPosition } from '../../dnd/sortable.types'
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

  /** Attributes for the outer row element from the `virtualizer` and the `sortable`. */
  export type RowProps = VirtualRowProps & {
    /** Present while this row is the drag source. */
    'data-dragging'?: ''
    /** Where the dragged row would land relative to this row. */
    'data-drop-position'?: SortableDropPosition
  }

  export interface ItemRenderProps<TItem> {
    /** Source item being rendered. */
    readonly item: TItem
    /** Current index in the complete item collection. */
    readonly index: number
    /**
     * Attributes for the outer row element: positioning style, measurement ref, and `data-index`
     * from the `virtualizer`, and the drag ref and drag state attributes from the `sortable`.
     * Spread them onto the row; undefined without either.
     */
    readonly props?: RowProps
    /**
     * Restricts drag activation to an element inside the row, such as a grip button. Without it,
     * the whole row starts a drag. Undefined without a `sortable`.
     */
    readonly handleRef?: (element: HTMLElement) => void
  }

  /** Reorder reported when a drag ends on a new position. */
  export interface ReorderEvent<TItem> {
    /** Moved item. */
    readonly item: TItem
    /** Index of the item before the move. */
    readonly from: number
    /** Index of the item after the move. */
    readonly to: number
    /** Copy of `items` with the move applied. */
    readonly items: TItem[]
  }

  /** Virtualizer accepted by the `virtualizer` prop, such as `createListVirtualizer()`. */
  export type Virtualizer<TItem> = ListVirtualizer<TItem>

  /** Sortable accepted by the `sortable` prop, such as `createSortable()`. */
  export type Sortable = SortableContract

  export type Base<TItem> = {
    /** Content rendered inside the list when the collection is empty. */
    fallback?: JSX.Element
    /** Reactive collection rendered by the list. */
    items?: readonly TItem[]
    /** Renders one collection item. */
    itemRender: Component<ItemRenderProps<TItem>>
    /** Renders only the visible items. The list root is the scroll container. */
    virtualizer?: Virtualizer<TItem>
    /** Lets users reorder rows by dragging. Update `items` from `onReorder`. */
    sortable?: Sortable
    /** Called when a drag moves a row to a new index. */
    onReorder?: (event: ReorderEvent<TItem>) => void
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
