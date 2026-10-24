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

  export interface ColumnMeta {
    align?: 'left' | 'center' | 'right'
    truncated?: boolean
    class?: SlotClassValue
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
