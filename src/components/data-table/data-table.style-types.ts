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
  /** Whether the table header sticks to the top of the container during scrolling. @default false */
  stickyHeader?: boolean
}
