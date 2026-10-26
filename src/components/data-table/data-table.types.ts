import type {
  CellData,
  ColumnDef,
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  ExpandedState,
  PaginationState,
  Row as TanStackRow,
  RowData,
  RowSelectionState,
  SolidTable,
  SortingState,
  TableFeatures,
  TableOptions,
} from '@tanstack/solid-table'
import type { Accessor, Component, JSX, Ref } from 'solid-js'

import type { ComponentMessages } from '../../provider/locale/messages.types'
import type { TableVirtualRenderProps } from '../../shared/table-virtualizer'
import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'

import type { DataTableFeatures } from './data-table-features'
import type { defaultDataTableMessages } from './data-table.messages'
import type { DataTableStyleSlot, DataTableStyleVariants } from './data-table.style-types'

declare module '@tanstack/solid-table' {
  interface ColumnMeta<
    in out TFeatures extends TableFeatures,
    in out TData extends RowData,
    TValue extends CellData = CellData,
  >
    extends DataTableT.ColumnMeta {}
}

type MaybeAccessor<T> = T | Accessor<T>

export namespace DataTableT {
  export type Kind = 'single'
  export type Slot<T = unknown> = DataTableStyleSlot<T>
  export type Variants = DataTableStyleVariants
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type Messages = ComponentMessages<typeof defaultDataTableMessages>
  export type Translations = Partial<Messages>

  export type Features = DataTableFeatures

  export type Column<
    TData extends RowData = RowData,
    TValue extends CellData = CellData,
  > = ColumnDef<Features, TData, TValue>

  export type Row<TData extends RowData = RowData> = TanStackRow<Features, TData>

  export type Instance<TData extends RowData = RowData> = SolidTable<Features, TData>

  export interface ColumnMeta {
    align?: 'left' | 'center' | 'right'
    truncated?: boolean
    class?: SlotClassValue
  }

  export interface PaginationConfig {
    /** Initial number of rows per page. @default 10 */
    pageSize?: number
    /** Page size choices shown in the pagination toolbar dropdown, or `false` to hide the dropdown. @default [5, 10, 20, 50] */
    pageSizes?: readonly number[] | false
  }

  export interface State {
    sorting: SortingState
    pagination: PaginationState
    rowSelection: RowSelectionState
    expanded: ExpandedState
    columnOrder: ColumnOrderState
    columnPinning: ColumnPinningState
    columnVisibility: ColumnVisibilityState
    columnSizing: ColumnSizingState
    columnFilters: ColumnFiltersState
    globalFilter: unknown
  }

  export type ControlledState = {
    [K in keyof State]?: MaybeAccessor<State[K] | undefined>
  }

  export interface Options<TData extends RowData = RowData> {
    /** Row records to display, or a reactive accessor returning them. */
    data: MaybeAccessor<readonly TData[]>
    /** Column definitions, or a reactive accessor returning them. */
    columns: MaybeAccessor<readonly Column<TData>[]>
    /** Derives a stable unique ID for each row. Nested rows are automatically prefixed with their parent row's ID. */
    getRowId?: (originalRow: TData, index: number, parent?: Row<TData>) => string
    /** Whether column sorting is enabled by default. @default true */
    sorting?: MaybeAccessor<boolean | undefined>
    /** Prepends a selection column (`'multiple'` checkboxes or `'single'` radio buttons) with id `'select'`. */
    selection?: MaybeAccessor<'single' | 'multiple' | undefined>
    /** Predicate controlling whether a given row can be selected. */
    canSelectRow?: (row: Row<TData>) => boolean
    /** Prepends an expand/collapse chevron column with id `'expand'` and enables row expansion. @default false */
    expandable?: MaybeAccessor<boolean | ((row: Row<TData>) => boolean) | undefined>
    /** Enables client-side or server-side pagination and renders the pagination toolbar. @default false */
    pagination?: boolean | PaginationConfig
    /** Enables interactive column width resizing. @default false */
    resizable?: MaybeAccessor<boolean | undefined>
    /** Enables server-driven manual sorting, filtering, and pagination. @default false */
    manual?: MaybeAccessor<boolean | undefined>
    /** Total row count across all pages when `manual` is enabled. */
    rowCount?: MaybeAccessor<number | undefined>
    /** Uncontrolled initial table state slices. */
    initialState?: Partial<State>
    /** Controlled table state slices (values or accessors). */
    state?: ControlledState
    /** Called with the resolved sorting state when sorting changes. */
    onSortingChange?: (sorting: SortingState) => void
    /** Called with the resolved pagination state when page index or size changes. */
    onPaginationChange?: (pagination: PaginationState) => void
    /** Called with the resolved row selection map when selection changes. */
    onRowSelectionChange?: (rowSelection: RowSelectionState) => void
    /** Called with the resolved expanded state when expanded rows change. */
    onExpandedChange?: (expanded: ExpandedState) => void
    /** Called with the resolved column order when column order changes. */
    onColumnOrderChange?: (columnOrder: ColumnOrderState) => void
    /** Called with the resolved column pinning state when pinning changes. */
    onColumnPinningChange?: (columnPinning: ColumnPinningState) => void
    /** Called with the resolved column visibility map when visibility changes. */
    onColumnVisibilityChange?: (columnVisibility: ColumnVisibilityState) => void
    /** Called with the resolved column sizing map when column sizes change. */
    onColumnSizingChange?: (columnSizing: ColumnSizingState) => void
    /** Called with the resolved column filters when filters change. */
    onColumnFiltersChange?: (columnFilters: ColumnFiltersState) => void
    /** Called with the resolved global filter value when global filter changes. */
    onGlobalFilterChange?: (globalFilter: unknown) => void
    /** Escape hatch for advanced TanStack `TableOptions` not covered by top-level options. */
    tableOptions?: Partial<Omit<TableOptions<Features, TData>, 'features' | 'data' | 'columns'>>
  }

  export interface EmptyRenderProps {
    readonly colSpan: number
  }

  export interface LoadingRenderProps {
    readonly colSpan: number
  }

  export interface ExpandedRowRenderProps<TData extends RowData = RowData> {
    readonly row: Row<TData>
  }

  export type VirtualRenderProps<TData extends RowData = RowData> = TableVirtualRenderProps<
    Row<TData>
  >

  export interface Base<TData extends RowData = RowData> {
    /** Table instance created with `createDataTable`. */
    table: Instance<TData>
    /** Localized message overrides for this data table instance. */
    translations?: Translations
    /** Ref forwarded to the outer scroll container element. */
    containerRef?: Ref<HTMLDivElement>
    /** Custom class or class getter applied to each row (`<tr>`). */
    rowClass?: SlotClassValue | ((row: Row<TData>) => SlotClassValue)
    /** Whether the table is currently in a loading state. */
    loading?: boolean
    /** Custom loading state content. */
    loadingRender?: JSX.Element | Component<LoadingRenderProps>
    /** Custom empty state content rendered when there are no rows. */
    emptyRender?: JSX.Element | Component<EmptyRenderProps>
    /** Maximum height for the table scroll container (e.g. `400` or `'400px'`). */
    maxHeight?: number | string
    /** Component rendered inside the expanded sub-row when a row is expanded. */
    expandedRowRender?: Component<ExpandedRowRenderProps<TData>>
    /** Callback fired when a table body row is clicked. */
    onRowClick?: (row: Row<TData>, event: MouseEvent) => void
    /** Callback fired when a table body row is double-clicked. */
    onRowDoubleClick?: (row: Row<TData>, event: MouseEvent) => void
    /** Component mounted inside `tbody` to render virtualized rows. */
    virtualRender?: Component<VirtualRenderProps<TData>>
  }

  export type Props<TData extends RowData = RowData> = BaseProps<
    'table',
    Base<TData>,
    Variants,
    Classes,
    Styles
  >
}

/** Props for DataTable. */
export type DataTableProps<TData extends RowData = RowData> = DataTableT.Props<TData>
