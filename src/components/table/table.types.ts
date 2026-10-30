import type { Component, JSX, Ref } from 'solid-js'

import type { BaseProps } from '../../shared/types'
import type {
  TableVirtualColumnLayout,
  TableVirtualRowProps,
  TableVirtualizer,
} from '../../shared/virtual'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'

import type { TableStyleSlot, TableStyleVariants } from './table.style-types'

export namespace TableT {
  export type Kind = 'composite'
  export type Slot<T = unknown> = TableStyleSlot<T>
  export type Variants = TableStyleVariants
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Base {
    /** Ref forwarded to the scroll container element. */
    containerRef?: Ref<HTMLDivElement>
    /** Table parts and direct content. */
    children?: JSX.Element
  }

  /** Props for Table. */
  export type Props = BaseProps<'table', Base, Variants, Classes, Styles>

  // Header, Body, Footer, and Caption have no configuration of their own. They are
  // `FlowComponent`s, which supply `children`, so their props accept native attributes only.
  export type HeaderProps = BaseProps<'thead', object, never, never, never, 'thead', true>
  export type BodyProps = BaseProps<'tbody', object, never, never, never, 'tbody', true>

  /** Virtualizer accepted by `Table.VirtualRows`, such as `createTableVirtualizer()`. */
  export type Virtualizer<TItem, TColumn = unknown> = TableVirtualizer<TItem, TColumn>

  export interface ItemRenderProps<TItem> {
    /** Source item being rendered. */
    readonly item: TItem
    /** Index in `items`. */
    readonly index: number
    /**
     * Row attributes from the virtualizer: `data-index`, the measurement ref, `aria-rowindex`,
     * and striping attributes. Spread them onto `Table.Row`.
     */
    readonly props: TableVirtualRowProps
  }

  export interface VirtualRowsBase<TItem, TColumn = unknown> {
    /** Virtualizer that renders only the visible rows. */
    virtualizer: Virtualizer<TItem, TColumn>
    /** Every body row, in display order. */
    items: readonly TItem[]
    /** Renders one item as a single `Table.Row`. */
    itemRender: Component<ItemRenderProps<TItem>>
    /**
     * Scroll container, when an ancestor of the table scrolls. Defaults to the host `tbody`,
     * which must then be a bounded block.
     */
    scrollElement?: HTMLElement
    /**
     * Columns to virtualize horizontally, in display order. Used when the virtualizer has the
     * `columns` option; render the cells of each row with `Table.VirtualCells`.
     */
    columns?: readonly TColumn[]
    /** Width in px of a column, used when the virtualizer's `columns.estimateSize` is not set. */
    columnSize?: (column: TColumn, index: number) => number
    /** Geometry of cells outside `columns`, such as pinned ones. */
    columnLayout?: TableVirtualColumnLayout
    /**
     * `aria-colindex` of the first of `columns`. Raise it when cells render before them, and set
     * `aria-colcount` on the table to the full column count.
     * @default 1
     */
    columnIndexStart?: number
  }
  export type VirtualRowsProps<TItem, TColumn = unknown> = BaseProps<
    never,
    VirtualRowsBase<TItem, TColumn>,
    never,
    never,
    never
  >

  export interface CellRenderProps<TColumn> {
    /** Column being rendered. */
    readonly column: TColumn
    /** Index in the `columns` of `Table.VirtualRows`. */
    readonly index: number
    /** Cell attributes, such as `aria-colindex`. Spread them onto `Table.Cell`. */
    readonly props: { 'aria-colindex': number }
  }

  export interface VirtualCellsBase<TColumn = unknown> {
    /**
     * Renders one visible column as a single `Table.Cell`. Placeholder cells fill the skipped
     * columns, so the row still spans every column of the header.
     */
    itemRender: Component<CellRenderProps<TColumn>>
  }
  export type VirtualCellsProps<TColumn = unknown> = BaseProps<
    never,
    VirtualCellsBase<TColumn>,
    never,
    never,
    never
  >
  export type FooterProps = BaseProps<'tfoot', object, never, never, never, 'tfoot', true>

  export interface RowBase {
    /** Whether this row is selected. */
    selected?: boolean
    children?: JSX.Element
  }
  export type RowProps = BaseProps<'tr', RowBase, never, never, never>

  export interface HeadBase {
    /** Text alignment for the column header. @default 'left' */
    align?: 'left' | 'center' | 'right'
    /** Whether the header content should be truncated with an ellipsis. @default false */
    truncated?: boolean
    children?: JSX.Element
  }
  export type HeadProps = BaseProps<'th', HeadBase, never, never, never>

  export interface CellBase {
    /** Text alignment for the cell. @default 'left' */
    align?: 'left' | 'center' | 'right'
    /** Whether the cell content should be truncated with an ellipsis. @default false */
    truncated?: boolean
    children?: JSX.Element
  }
  export type CellProps = BaseProps<'td', CellBase, never, never, never>

  export type CaptionProps = BaseProps<'caption', object, never, never, never, 'caption', true>
}

/** Props for Table. */
export type TableProps = TableT.Props
