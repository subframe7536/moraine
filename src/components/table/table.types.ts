import type { JSX, Ref } from 'solid-js'

import type { BaseProps } from '../../shared/types'
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
