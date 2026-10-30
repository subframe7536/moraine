import type { Component, JSX, Ref } from 'solid-js'

import type { BaseProps } from '../../shared/types'
import type { TableVirtualRowProps, TableVirtualizer } from '../../shared/virtual'
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

  // Header, Footer, and Caption have no configuration of their own. They are `FlowComponent`s,
  // which supply `children`, so their props accept native attributes only.
  export type HeaderProps = BaseProps<'thead', object, never, never, never, 'thead', true>

  export interface ItemRenderProps<TItem> {
    /** Source item being rendered. */
    readonly item: TItem
    /** Index in `items`. */
    readonly index: number
    /**
     * Attributes from the `virtualizer` for the row: `data-index`, the measurement ref,
     * `aria-rowindex`, and striping attributes. Spread them onto `Table.Row`; undefined
     * without a virtualizer.
     */
    readonly props?: TableVirtualRowProps
  }

  /** Virtualizer accepted by `Table.Body`, such as `createTableVirtualizer()`. */
  export type Virtualizer<TItem> = TableVirtualizer<TItem>

  export interface BodyBase<TItem = unknown> {
    /** Rows rendered through `itemRender`. */
    items?: readonly TItem[]
    /** Renders one row of `items` as a single `Table.Row`. Without it, `children` render. */
    itemRender?: Component<ItemRenderProps<TItem>>
    /** Renders only the visible rows of `items`. Requires `itemRender`. */
    virtualizer?: Virtualizer<TItem>
    /**
     * Scroll container of a `virtualizer`, when an ancestor of the table scrolls. Defaults to
     * the body, which must then be a bounded block.
     */
    scrollElement?: HTMLElement
    children?: JSX.Element
  }
  export type BodyProps<TItem = unknown> = BaseProps<'tbody', BodyBase<TItem>, never, never, never>
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
