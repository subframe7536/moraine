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
  /** Whether row and section dividing borders are removed. @default false */
  borderless?: boolean
  /** Whether vertical divider borders are added between table columns. @default false */
  verticalBorder?: boolean
}

export type TableStyleConfig = ComponentStyleConfig<TableStyleSlot, TableStyleVariants>
