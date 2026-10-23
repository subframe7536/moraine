import type { ComponentStyleConfig } from '../../theme/types'

export interface TableStyleSlot<T = unknown> {
  /** Outer scrollable container. */
  container?: T
  /** Table root element. */
  root?: T
  /** Table header (thead). */
  header?: T
  /** Table body (tbody). */
  body?: T
  /** Table footer (tfoot). */
  footer?: T
  /** Table row (tr). */
  row?: T
  /** Table header cell (th). */
  head?: T
  /** Table data cell (td). */
  cell?: T
  /** Table caption (caption). */
  caption?: T
}

export interface TableStyleVariants {
  /** Density of table rows and cells. @default 'md' */
  size?: 'sm' | 'md' | 'lg'
  /** Whether rows display alternating background colors. @default false */
  striped?: boolean
  /** Whether the table container has an outer border and rounded corners. @default false */
  bordered?: boolean
  /** Whether row and section dividing borders are removed. @default false */
  borderless?: boolean
}

export type TableStyleConfig = ComponentStyleConfig<TableStyleSlot, TableStyleVariants>
