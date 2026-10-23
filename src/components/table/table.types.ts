import type { JSX, Ref } from 'solid-js'

import type { BaseProps, ValidComponent } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'

import type { TableStyleSlot, TableStyleVariants } from './table.style-types'

export namespace TableT {
  export type Kind = 'composite'
  export type Slot<T = unknown> = TableStyleSlot<T>
  export type Variants = TableStyleVariants
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Base<T extends ValidComponent = 'table'> {
    /** Element or component to render as. @default 'table' */
    as?: T
    /** Ref forwarded to the scroll container element. */
    containerRef?: Ref<HTMLDivElement>
    /** Table parts and direct content. */
    children?: JSX.Element
  }

  /** Props for Table. */
  export type Props<T extends ValidComponent = 'table'> = BaseProps<
    T,
    Base<T>,
    Variants,
    Classes,
    Styles,
    'table'
  >

  export interface HeaderBase<T extends ValidComponent = 'thead'> {
    as?: T
    /** Text alignment for all header cells in this section. */
    align?: 'left' | 'center' | 'right'
    children?: JSX.Element
  }
  export type HeaderProps<T extends ValidComponent = 'thead'> = BaseProps<
    T,
    HeaderBase<T>,
    never,
    never,
    never,
    'thead'
  >

  export interface BodyBase<T extends ValidComponent = 'tbody'> {
    as?: T
    children?: JSX.Element
  }
  export type BodyProps<T extends ValidComponent = 'tbody'> = BaseProps<
    T,
    BodyBase<T>,
    never,
    never,
    never,
    'tbody'
  >

  export interface FooterBase<T extends ValidComponent = 'tfoot'> {
    as?: T
    children?: JSX.Element
  }
  export type FooterProps<T extends ValidComponent = 'tfoot'> = BaseProps<
    T,
    FooterBase<T>,
    never,
    never,
    never,
    'tfoot'
  >

  export interface RowBase<T extends ValidComponent = 'tr'> {
    as?: T
    /** Whether this row is selected. */
    selected?: boolean
    children?: JSX.Element
  }
  export type RowProps<T extends ValidComponent = 'tr'> = BaseProps<
    T,
    RowBase<T>,
    never,
    never,
    never,
    'tr'
  >

  export interface HeadBase<T extends ValidComponent = 'th'> {
    as?: T
    /** Text alignment for the column header. @default 'left' */
    align?: 'left' | 'center' | 'right'
    /** Whether the header content should be truncated with an ellipsis. @default false */
    truncated?: boolean
    children?: JSX.Element
  }
  export type HeadProps<T extends ValidComponent = 'th'> = BaseProps<
    T,
    HeadBase<T>,
    never,
    never,
    never,
    'th'
  >

  export interface CellBase<T extends ValidComponent = 'td'> {
    as?: T
    /** Text alignment for the cell. @default 'left' */
    align?: 'left' | 'center' | 'right'
    /** Whether the cell content should be truncated with an ellipsis. @default false */
    truncated?: boolean
    children?: JSX.Element
  }
  export type CellProps<T extends ValidComponent = 'td'> = BaseProps<
    T,
    CellBase<T>,
    never,
    never,
    never,
    'td'
  >

  export interface CaptionBase<T extends ValidComponent = 'caption'> {
    as?: T
    /** Position of the caption relative to the table. @default 'bottom' */
    side?: 'top' | 'bottom'
    children?: JSX.Element
  }
  export type CaptionProps<T extends ValidComponent = 'caption'> = BaseProps<
    T,
    CaptionBase<T>,
    never,
    never,
    never,
    'caption'
  >
}

/** Props for Table. */
export type TableProps = TableT.Props
