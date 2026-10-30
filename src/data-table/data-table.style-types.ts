import type { ComponentStyleConfig } from '../theme/types'

export interface DataTableStyleSlot<T = unknown> {
  /** Outer scrollable container. */
  container?: T
  /** Host `table` element. */
  root?: T
  /** Table header container (`thead`). */
  header?: T
  /** Table body container (`tbody`). */
  body?: T
  /** Table footer container (`tfoot`). */
  footer?: T
  /** Table row (`tr`). */
  row?: T
  /** Header cell (`th`). */
  head?: T
  /** Body or footer cell (`td`). */
  cell?: T
  /** Empty state content area. */
  empty?: T
  /** Loading overlay or indicator. */
  loading?: T
  /** Button used in sortable column headers. */
  sortButton?: T
  /** Icon indicating sort direction. */
  sortIcon?: T
  /** Sort priority number shown on sorted columns while more than one column is sorted. */
  sortIndex?: T
  /** Pagination toolbar container. */
  pagination?: T
  /** Drag resize handle on column headers. */
  resizer?: T
  /** Expanded detail row (`tr`). */
  expandedRow?: T
  /** Expanded detail cell container (`td`). */
  expandedCell?: T
  /** Expand/collapse chevron toggle button. */
  expandButton?: T
  /** Row and select-all checkbox shown when `selection` is `'multiple'`. */
  checkbox?: T
  /** Check or indeterminate icon inside the checkbox. */
  checkboxIcon?: T
}

export type DataTableStyleVariants = {
  /** Size density of table cells, text, and padding. @default 'md' */
  size?: 'sm' | 'md' | 'lg'
  /** Alternating background shading on even rows. @default false */
  striped?: boolean
  /** Highlight row on mouse hover. @default false */
  hoverEffect?: boolean
  /** Border divider layout. @default 'row' */
  showBorder?: 'row' | 'col' | 'both'
  /** Whether the header and/or footer stick to the edges of the scroll container (`true` sticks both). @default false */
  sticky?: boolean | 'header' | 'footer'
}

export type DataTableStyleConfig = ComponentStyleConfig<DataTableStyleSlot, DataTableStyleVariants>
