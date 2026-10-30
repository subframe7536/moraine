import type { Accessor } from 'solid-js'

import type { ListT } from '../components/list/list.types'

// Kept apart from `table-virtualizer.tsx` so that `moraine/data-table` declarations can name the
// render props without importing the optional `@tanstack/virtual-core` peer.

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

/** Props passed to a table `virtualRender` component, such as `createTableVirtualizer().virtualRender`. */
export type TableVirtualRenderProps<TItem, TColumn = unknown> = Omit<
  ListT.VirtualRenderProps<TItem, HTMLElement, HTMLTableRowElement>,
  'scrollElement'
> & {
  /**
   * Scroll container for the rows; defaults to the adapter's host `tbody`. Pass an ancestor
   * element only when scrolling happens outside the table body. The adapter then measures the
   * body offset inside it (`scrollMargin`) and the height of a sticky header or footer
   * (`scrollPaddingStart` / `scrollPaddingEnd`), unless those options are set explicitly.
   */
  readonly scrollElement?: HTMLElement
  /**
   * Columns to virtualize horizontally, in display order. Used only when the virtualizer was
   * created with the `columns` option.
   */
  readonly columns?: readonly TColumn[]
  /** Width in px of a column, used when `columns.estimateSize` is not set. */
  columnSize?: (column: TColumn, index: number) => number
  /** Geometry of columns outside the virtualized range. */
  readonly columnLayout?: TableVirtualColumnLayout
  /**
   * Receives a reactive accessor for the column window when the adapter mounts, and `undefined`
   * when it unmounts. Read the accessor while rendering cells: it updates in the same batch as
   * the rows, so rows that mount during a scroll already see the new window.
   */
  onColumnWindow?: (window: Accessor<TableVirtualColumnWindow> | undefined) => void
}
