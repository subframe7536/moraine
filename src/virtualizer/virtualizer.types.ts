import type { Accessor, Component, JSX } from 'solid-js'

// Contract between virtualizers from `moraine/virtualizer` and the components that host them.
// It must not import `@tanstack/virtual-core`: the main entry and `moraine/data-table` name these
// types without depending on the optional peer.

/** Options for scrolling a virtual row or column into view. */
export interface VirtualScrollToOptions {
  /** Where the target ends up in the viewport. @default 'auto' */
  align?: 'auto' | 'start' | 'center' | 'end'
  behavior?: 'auto' | 'smooth' | 'instant'
}

/** Attributes a virtualizer supplies for the outer DOM element of one rendered row. */
export type VirtualRowProps<TRowElement extends HTMLElement = HTMLElement> = Omit<
  JSX.HTMLAttributes<TRowElement>,
  'ref' | 'style'
> & {
  /** Measures the row. */
  ref?: (element: TRowElement) => void
  'data-index'?: number | string
  style?: JSX.CSSProperties
}

/** Row attributes from a table virtualizer. */
export type TableVirtualRowProps = VirtualRowProps<HTMLTableRowElement> & {
  /** Set on every row; `Table` stripes it from `data-even` instead of DOM order. */
  'data-virtual-row'?: string
  /** Set on odd indexes (the 2nd, 4th, ... rows), for striping. */
  'data-even'?: string
  /** Set on the last entry, whose trailing spacer row is the last child. */
  'data-last'?: string
}

/** Props a host component passes to a list virtualizer's `virtualRender`. */
export interface VirtualRenderProps<TEntry> {
  /** Complete reactive collection, including structural entries such as group labels. */
  readonly entries: readonly TEntry[]
  /** Scroll container, or undefined while it is not mounted. */
  readonly scrollElement?: HTMLElement
  render: (entry: TEntry, index: number, props: VirtualRowProps) => JSX.Element
}

/** One rendered column of a column-virtualized table. */
export interface TableVirtualColumn {
  /** Position in the virtualized `columns`. */
  readonly index: number
  /** Offset in px from the start of the virtualized columns. */
  readonly start: number
  /** Width in px. */
  readonly size: number
  readonly key: string | number | bigint
}

/**
 * Columns to render in each body row. Render a placeholder cell with `colSpan={skippedBefore}`
 * before the columns and one with `colSpan={skippedAfter}` after them, each only when its count
 * is above 0, so every row still spans every column of the header.
 */
export interface TableVirtualColumnWindow {
  readonly items: readonly TableVirtualColumn[]
  /** Number of virtualized columns before the first rendered one. */
  readonly skippedBefore: number
  /** Number of virtualized columns after the last rendered one. */
  readonly skippedAfter: number
}

/** Horizontal geometry of the columns that sit outside the virtualized range. */
export interface TableVirtualColumnLayout {
  /**
   * Width in px laid out before the first virtualized column, such as start-pinned columns.
   * @default 0
   */
  readonly scrollMargin?: number
  /** Width in px covered at the start edge while scrolling, such as start-pinned columns. */
  readonly scrollPaddingStart?: number
  /** Width in px covered at the end edge while scrolling, such as end-pinned columns. */
  readonly scrollPaddingEnd?: number
}

/** Props a host component passes to a table virtualizer's `virtualRender`. */
export interface TableVirtualRenderProps<TEntry, TColumn = unknown> {
  /** Complete reactive collection of body rows. */
  readonly entries: readonly TEntry[]
  /**
   * Scroll container for the rows; defaults to the adapter's host `tbody`. Pass an ancestor
   * element only when scrolling happens outside the table body. The adapter then measures the
   * body offset inside it (`scrollMargin`) and the height of a sticky header or footer
   * (`scrollPaddingStart` / `scrollPaddingEnd`), unless those options are set explicitly.
   */
  readonly scrollElement?: HTMLElement
  render: (entry: TEntry, index: number, props: TableVirtualRowProps) => JSX.Element
  /**
   * Columns to virtualize horizontally, in display order. Used only when the virtualizer was
   * created with the `columns` option.
   */
  readonly columns?: readonly TColumn[]
  /** Width in px of a column, used when `columns.estimateSize` is not set. */
  columnSize?: (column: TColumn, index: number) => number
  /** Geometry of columns outside the virtualized range. */
  readonly columnLayout?: TableVirtualColumnLayout
}

/**
 * What a list-style host (`List`, `Tree`, `Select`, `Combobox`, `MultiSelect`, `CommandPalette`)
 * needs from its `virtualizer` prop. `createListVirtualizer()` returns one.
 */
export interface ListVirtualizer<TEntry> {
  /** Renders the visible rows. Hosts mount it; callers pass the whole virtualizer instead. */
  readonly virtualRender: Component<VirtualRenderProps<TEntry>>
  /** Scrolls an entry into view. Hosts call it for keyboard navigation. */
  scrollToIndex: (index: number, options?: VirtualScrollToOptions) => void
}

/**
 * What a table host (`Table.Body`, `DataTable`) needs from its `virtualizer` prop.
 * `createTableVirtualizer()` returns one.
 */
export interface TableVirtualizer<TEntry, TColumn = unknown> {
  /** Renders the visible rows. Hosts mount it; callers pass the whole virtualizer instead. */
  readonly virtualRender: Component<TableVirtualRenderProps<TEntry, TColumn>>
  /** Scrolls a body row into view. */
  scrollToIndex: (index: number, options?: VirtualScrollToOptions) => void
  /**
   * Columns to render in each body row while the rows are mounted and the virtualizer has the
   * `columns` option; otherwise `undefined`. It updates in the same batch as the rows.
   */
  readonly columnWindow: Accessor<TableVirtualColumnWindow | undefined>
}
