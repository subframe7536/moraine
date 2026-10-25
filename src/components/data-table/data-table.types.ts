import type {
  ColumnDef,
  PaginationState,
  Row,
  RowData,
  RowSelectionState,
  SolidTable,
  SortingState,
  TableFeatures,
} from '@tanstack/solid-table'
import type { Accessor, Component, JSX, Ref } from 'solid-js'

import type { TableVirtualRenderProps } from '../../shared/table-virtualizer'
import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'

import type { DataTableStyleSlot, DataTableStyleVariants } from './data-table.style-types'

export namespace DataTableT {
  export type Kind = 'single'
  export type Slot<T = unknown> = DataTableStyleSlot<T>
  export type Variants = DataTableStyleVariants
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface EmptyRenderProps {
    readonly colSpan: number
  }

  export interface LoadingRenderProps {
    readonly colSpan: number
  }

  export type VirtualRenderProps<
    TData extends RowData = RowData,
    _TFeatures extends TableFeatures = TableFeatures,
  > = TableVirtualRenderProps<Row<any, TData>>

  export type ColumnPinningPosition = 'left' | 'right'

  export interface ColumnPinningState {
    left?: string[]
    right?: string[]
  }

  export interface ColumnMeta {
    align?: 'left' | 'center' | 'right'
    truncated?: boolean
    class?: SlotClassValue
    pinned?: ColumnPinningPosition
  }

  export interface Base<
    TData extends RowData = RowData,
    TFeatures extends TableFeatures = TableFeatures,
  > {
    /** Ref forwarded to the outer scroll container element. */
    containerRef?: Ref<HTMLDivElement>
    /** Custom class or class getter applied to each row (`<tr>`). */
    rowClass?: SlotClassValue | ((row: Row<TFeatures, TData>) => SlotClassValue)
    /** Whether the table is currently in a loading state. */
    loading?: boolean
    /** Custom loading state content. */
    loadingRender?: JSX.Element | Component<LoadingRenderProps>
    /** Custom empty state content rendered when there are no rows. */
    emptyRender?: JSX.Element | Component<EmptyRenderProps>

    /** Whether the table header sticks to the top of the container during scrolling. @default false */
    stickyHeader?: boolean
    /** Maximum height for the table scroll container (e.g. `400` or `'400px'`). */
    maxHeight?: number | string

    /** Enable column width resizing with drag handles. @default false */
    resizable?: boolean
    /** Resize mode for columns: live on drag ('onChange') or on release ('onEnd'). @default 'onEnd' */
    columnResizeMode?: 'onChange' | 'onEnd'

    /** Initial column pinning state in convenience mode. */
    defaultColumnPinning?: ColumnPinningState
    /** Controlled column pinning state in convenience mode. */
    currentColumnPinning?: ColumnPinningState
    /** Callback fired when column pinning changes in convenience mode. */
    onColumnPinningChange?: (pinning: ColumnPinningState) => void

    /** Callback to determine if a specific row can be selected. When false, the row checkbox/radio is disabled. */
    isRowSelectable?: (row: Row<TFeatures, TData>) => boolean

    /** Enable expandable rows in convenience mode. @default false */
    expandable?: boolean
    /** Custom content rendered inside the expanded sub-row. */
    expandedRowRender?: (row: Row<TFeatures, TData>) => JSX.Element
    /** Whether to automatically prepend an expand chevron toggle column. @default true when expandable or expandedRowRender is provided */
    expandColumn?: boolean
    /** Initial expanded rows state in convenience mode. */
    defaultExpanded?: Record<string, boolean> | boolean
    /** Controlled expanded rows state in convenience mode. */
    currentExpanded?: Record<string, boolean> | boolean
    /** Callback fired when expanded rows change in convenience mode. */
    onExpandedChange?: (expanded: Record<string, boolean> | boolean) => void

    /** Callback fired when a table body row is clicked. */
    onRowClick?: (row: Row<TFeatures, TData>, event: MouseEvent) => void
    /** Callback fired when a table body row is double-clicked. */
    onRowDoubleClick?: (row: Row<TFeatures, TData>, event: MouseEvent) => void

    // --- Instance Mode ---
    /** Existing TanStack Solid Table instance. */
    table?: SolidTable<TFeatures, TData>

    // --- Convenience Mode ---
    /** Reactive dataset or accessor rendered when no external table instance is provided. */
    data?: Accessor<readonly TData[]> | readonly TData[]
    /** Column definitions rendered when no external table instance is provided. */
    columns?: readonly ColumnDef<TFeatures, TData>[]
    /** Enable client-side column sorting in convenience mode. @default false */
    sorting?: boolean
    /** Initial sorting state when uncontrolled in convenience mode. */
    defaultSorting?: SortingState
    /** Controlled sorting state in convenience mode. */
    currentSorting?: SortingState
    /** Callback fired when sorting changes in convenience mode. */
    onSortingChange?: (sorting: SortingState) => void
    /** Enable row selection checkboxes in convenience mode. @default false */
    selectable?: boolean | 'single' | 'multiple'
    /** Initial row selection state when uncontrolled in convenience mode. */
    defaultRowSelection?: RowSelectionState
    /** Controlled row selection state in convenience mode. */
    currentRowSelection?: RowSelectionState
    /** Callback fired when row selection changes in convenience mode. */
    onRowSelectionChange?: (rowSelection: RowSelectionState) => void
    /** Enable bottom pagination controls in convenience mode. @default false */
    pagination?: boolean
    /** Initial pagination state (pageIndex, pageSize) in convenience mode. */
    defaultPagination?: PaginationState
    /** Controlled pagination state in convenience mode. */
    currentPagination?: PaginationState
    /** Callback fired when pagination changes in convenience mode. */
    onPaginationChange?: (pagination: PaginationState) => void
    /** Available page size choices in the pagination dropdown. @default [5, 10, 20, 50] */
    pageSizeOptions?: readonly number[]
    /** Whether to show the page size selection dropdown menu in the pagination toolbar. @default true */
    showPageSize?: boolean
    /** Total row count for remote pagination. */
    rowCount?: number
    /** Whether pagination is handled externally (remote / server-side). */
    manualPagination?: boolean
    /** Whether sorting is handled externally (remote / server-side). */
    manualSorting?: boolean
    /** Whether filtering is handled externally (remote / server-side). */
    manualFiltering?: boolean
    /** Component mounted inside `tbody` to render virtualized rows. */
    virtualRender?: Component<VirtualRenderProps<TData, TFeatures>>
  }

  export type Props<
    TData extends RowData = RowData,
    TFeatures extends TableFeatures = TableFeatures,
  > = BaseProps<'table', Base<TData, TFeatures>, Variants, Classes, Styles>
}

/** Props for DataTable. */
export type DataTableProps<
  TData extends RowData = RowData,
  TFeatures extends TableFeatures = TableFeatures,
> = DataTableT.Props<TData, TFeatures>
