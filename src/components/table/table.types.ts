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

  export interface HeaderBase {
    children?: JSX.Element
  }
  export type HeaderProps = BaseProps<'thead', HeaderBase, never, never, never>

  export interface BodyBase {
    children?: JSX.Element
  }
  export type BodyProps = BaseProps<'tbody', BodyBase, never, never, never>

  export interface FooterBase {
    children?: JSX.Element
  }
  export type FooterProps = BaseProps<'tfoot', FooterBase, never, never, never>

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

  export interface CaptionBase {
    children?: JSX.Element
  }
  export type CaptionProps = BaseProps<'caption', CaptionBase, never, never, never>
}

/** Props for Table. */
export type TableProps = TableT.Props
