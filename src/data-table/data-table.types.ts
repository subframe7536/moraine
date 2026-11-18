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
  Header as TanStackHeader,
  Row as TanStackRow,
  RowData,
  RowSelectionState,
  SortingState,
  Table,
  TableFeatures,
  TableOptions,
} from '@tanstack/table-core'
import type { Component, JSX, Ref } from 'solid-js'

import type { ComponentMessages } from '../provider/locale/messages.types'
import type { BaseProps } from '../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../theme/style-types'
import type { TableVirtualizer } from '../virtualizer/virtualizer.types'

import type { DataTableFeatures } from './data-table-features'
import type { defaultDataTableMessages } from './data-table.messages'
import type { DataTableStyleSlot, DataTableStyleVariants } from './data-table.style-types'

declare module '@tanstack/table-core' {
  interface ColumnMeta<
    in out TFeatures extends TableFeatures,
    in out TData extends RowData,
    TValue extends CellData = CellData,
  >
    extends DataTableT.ColumnMeta {}
}

/** TanStack options configured by top-level `createDataTable` options. */
type OwnedTableOption =
  | 'features'
  | 'data'
  | 'columns'
  | 'state'
  | 'initialState'
  | 'getRowId'
  | 'getRowCanExpand'
  | 'enableSorting'
  | 'enableRowSelection'
  | 'enableMultiRowSelection'
  | 'enableColumnResizing'
  | 'manualSorting'
  | 'manualFiltering'
  | 'manualPagination'
  | 'rowCount'
  | `on${Capitalize<keyof DataTableT.State>}Change`

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

  export type Header<TData extends RowData = RowData> = TanStackHeader<Features, TData>

  /** Pagination settings `createDataTable` records on its instance for `DataTable`. */
  export interface PaginationSettings {
    readonly paginated: boolean
    readonly pageSizes: readonly number[] | false
  }

  /**
   * Table created with `createDataTable`. A table from `createTable` has no `paginationSettings`,
   * so `DataTable` renders it without the pagination toolbar.
   */
  export type Instance<TData extends RowData = RowData> = Table<Features, TData> & {
    readonly paginationSettings?: PaginationSettings
  }

  /** Presentation hints read from a column definition's `meta`. */
  export interface ColumnMeta {
    /**
     * Text alignment of the column's header and cells, logical to the writing direction.
     * @default 'start'
     */
    align?: 'start' | 'center' | 'end'
    /** Truncates overflowing header and cell text with an ellipsis instead of wrapping. */
    truncated?: boolean
    /** Extra classes merged onto the column's header and cells, after the recipe classes. */
    class?: SlotClassValue
  }

  export interface PaginationConfig {
    /**
     * Initial number of rows per page. Seeds `pagination.pageSize` of the initial state; the
     * page index still comes from `initialState.pagination`.
     * @default 10
     */
    pageSize?: number
    /**
     * Page size choices shown in the pagination toolbar dropdown, or `false` to hide the dropdown.
     * The current page size is added to the list when it is missing.
     * @default [5, 10, 20, 50]
     */
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

  /**
   * Options for `createDataTable`. Options are read through the reactive
   * table options object: declare getters (`get data() { return rows() }`)
   * on the options object or on `state` for values that change over time.
   */
  export interface Options<TData extends RowData = RowData> {
    /**
     * Row records to display. Declare a getter (`get data() { return rows() }`) so the table
     * follows changes; a plain array is read once. With `manual`, pass only the rows of the
     * current page.
     */
    data: readonly TData[]
    /**
     * Column definitions (TanStack `ColumnDef`s, such as `{ accessorKey, header }`). Declare a
     * getter for reactive columns. Generated `select` and `expand` columns are prepended to
     * these.
     */
    columns: readonly Column<TData>[]
    /**
     * Derives a stable unique ID for each row, used as the key of `rowSelection` and `expanded`
     * state. Defaults to the row index. Nested rows are automatically prefixed with their parent
     * row's ID and a dot.
     */
    getRowId?: (originalRow: TData, index: number, parent?: Row<TData>) => string
    /**
     * Whether column sorting is enabled for all columns. A column's own `enableSorting` overrides
     * it. Sortable headers render a sort button.
     * @default true
     */
    sortable?: boolean
    /**
     * Prepends a selection column (`'multiple'` checkboxes or `'single'` radio buttons) with id
     * `'select'`. A user column whose resolved id is `'select'` replaces the generated column.
     * With `'multiple'`, the header checkbox selects every row on the current page, or every row
     * when `DataTable` has a `virtualizer`. Selected rows are tracked in the `rowSelection` state.
     */
    selectionMode?: 'single' | 'multiple'
    /**
     * Predicate controlling whether a given row can be selected. Rows it rejects render a
     * disabled checkbox or radio button.
     */
    canSelectRow?: (row: Row<TData>) => boolean
    /**
     * Prepends an expand/collapse chevron column with id `'expand'`; a user column whose resolved
     * id is `'expand'` replaces it. `true` lets every row expand; a predicate decides per row. When omitted, only rows with sub-rows
     * (`tableOptions.getSubRows`) can expand. For tree data, pass
     * `(row) => row.subRows.length > 0` to show the chevron only on parent rows.
     * @default false
     */
    expandable?: boolean | ((row: Row<TData>) => boolean)
    /**
     * Enables client-side or server-side (with `manual`) pagination and renders the pagination
     * toolbar below the table. `true` uses the defaults; pass a `PaginationConfig` to set the
     * initial `pageSize` and the `pageSizes` choices. The toolbar is hidden when `DataTable` has
     * a `virtualizer`.
     * @default false
     * @example
     * ```tsx
     * import { DataTable, createDataTable } from 'moraine/data-table'
     *
     * const table = createDataTable({
     *   data: [{ name: 'Ada' }, { name: 'Alan' }],
     *   columns: [{ accessorKey: 'name', header: 'Name' }],
     *   paginated: { pageSize: 25, pageSizes: [25, 50, 100] },
     * })
     *
     * <DataTable table={table} />
     * ```
     */
    paginated?: boolean | PaginationConfig
    /**
     * Enables interactive column width resizing with drag and keyboard handles, and switches the
     * table to a fixed layout. Columns without a `maxSize`, in their definition
     * or in `tableOptions.defaultColumn`, are capped at 1000px. A column opts out with
     * `enableResizing: false`.
     * @default false
     */
    resizable?: boolean
    /**
     * Enables server-driven manual sorting, filtering, and pagination: the table keeps the sorting,
     * filter, and pagination state but does not reorder, filter, or slice `data` itself, and the
     * page index is not reset when data changes. Fetch the page in the `onSortingChange`,
     * `onColumnFiltersChange`, `onGlobalFilterChange`, and `onPaginationChange` callbacks and pass
     * the total as `rowCount`.
     * @default false
     */
    manual?: boolean
    /**
     * Total row count across all pages when `manual` is enabled. Used by the pagination toolbar
     * to compute the number of pages and the row summary.
     */
    rowCount?: number
    /**
     * Uncontrolled initial table state slices, such as the starting `sorting` or
     * `columnVisibility`. Read once; later changes are ignored, and a slice controlled through
     * `state` takes precedence.
     * @example
     * ```tsx
     * import { DataTable, createDataTable } from 'moraine/data-table'
     *
     * const table = createDataTable({
     *   data: [{ name: 'Ada', age: 36 }],
     *   columns: [
     *     { accessorKey: 'name', header: 'Name' },
     *     { accessorKey: 'age', header: 'Age' },
     *   ],
     *   initialState: { sorting: [{ id: 'age', desc: true }], pagination: { pageIndex: 0, pageSize: 20 } },
     * })
     *
     * <DataTable table={table} />
     * ```
     */
    initialState?: Partial<State>
    /**
     * Controlled table state slices. A key that is present takes ownership of
     * that slice; when its value resolves to `undefined`, the slice falls back
     * to `initialState`. Pair each slice with its `on[Slice]Change` callback, which receives the
     * next value (only when it actually changed) so you can store it. Declare each slice as a
     * getter so the table reads the latest value.
     * @example
     * ```tsx
     * import { createSignal } from 'solid-js'
     * import { DataTable, createDataTable } from 'moraine/data-table'
     * import type { DataTableT } from 'moraine/data-table'
     *
     * const [sorting, setSorting] = createSignal<DataTableT.State['sorting']>([])
     * const table = createDataTable({
     *   data: [{ name: 'Ada' }],
     *   columns: [{ accessorKey: 'name', header: 'Name' }],
     *   state: {
     *     get sorting() {
     *       return sorting()
     *     },
     *   },
     *   onSortingChange: setSorting,
     * })
     *
     * <DataTable table={table} />
     * ```
     */
    state?: Partial<State>
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
    /**
     * Escape hatch for advanced TanStack `TableOptions` not covered by top-level options.
     * Options that a top-level option configures (state, initial state, change callbacks,
     * row ids, sorting, selection, expansion, resizing, and manual modes) are owned by the
     * top-level option and cannot be set here.
     * @example
     * ```tsx
     * import { DataTable, createDataTable } from 'moraine/data-table'
     *
     * interface Node {
     *   name: string
     *   children?: Node[]
     * }
     * const table = createDataTable<Node>({
     *   data: [{ name: 'src', children: [{ name: 'index.ts' }] }],
     *   columns: [{ accessorKey: 'name', header: 'Name' }],
     *   tableOptions: { getSubRows: (node) => node.children },
     * })
     *
     * <DataTable table={table} />
     * ```
     */
    tableOptions?: Partial<Omit<TableOptions<Features, TData>, OwnedTableOption>>
  }

  export interface EmptyRenderProps {
    /** Number of visible leaf columns, matching the `colSpan` of the empty-state cell. */
    readonly colSpan: number
  }

  export interface LoadingRenderProps {
    /** Number of visible leaf columns of the table. */
    readonly colSpan: number
  }

  export interface ExpandedRowRenderProps<TData extends RowData = RowData> {
    /** The expanded row; use `row.original` for the source record. */
    readonly row: Row<TData>
  }

  /** Row passed to `rowProps`. */
  export interface RowPropsContext<TData extends RowData = RowData> {
    readonly row: Row<TData>
    /** Position among the rendered body rows. */
    readonly index: number
  }

  /** Header cell passed to `headProps`. */
  export interface HeadPropsContext<TData extends RowData = RowData> {
    readonly header: Header<TData>
    /** Position among the cells of its header row, in display order. */
    readonly index: number
  }

  /**
   * Attributes for a header cell element. `class` and `style` come from the `head` slot instead;
   * `ref` is composed with the table's own, and `colSpan` and `aria-sort` stay owned by the table.
   */
  export type HeadAttributes = Omit<
    JSX.ThHTMLAttributes<HTMLTableCellElement>,
    'children' | 'class' | 'classList' | 'style' | 'colSpan' | 'aria-sort'
  >

  /**
   * Attributes for a body row element. `class` merges into the `row` slot; `ref`, `onClick`,
   * and `onDblClick` are composed with the table's own.
   */
  export type RowAttributes = Omit<
    JSX.HTMLAttributes<HTMLTableRowElement>,
    'children' | 'class' | 'classList' | 'style'
  > & {
    class?: SlotClassValue
  }

  /**
   * Virtualizer accepted by the `virtualizer` prop, such as
   * `createTableVirtualizer<DataTableT.Row<TData>>()`. The columns it virtualizes are the
   * TanStack leaf columns of the unpinned region, so it needs no column type parameter.
   */
  export type Virtualizer<TData extends RowData = RowData> = TableVirtualizer<Row<TData>>

  export interface Base<TData extends RowData = RowData> {
    /**
     * Table instance created with `createDataTable`. Sorting, selection, pagination, expansion,
     * and the other behavior live on it; `DataTable` only renders it. Without the instance's
     * pagination settings (a plain TanStack table), no pagination toolbar is rendered.
     */
    table: Instance<TData>
    /**
     * Localized messages for this data table, merged per key over the provider messages. Some
     * entries are functions that receive a context object.
     * @example
     * ```tsx
     * import { DataTable, createDataTable } from 'moraine/data-table'
     *
     * const table = createDataTable({
     *   data: [{ name: 'Ada' }],
     *   columns: [{ accessorKey: 'name', header: 'Name' }],
     *   paginated: true,
     * })
     *
     * <DataTable
     *   table={table}
     *   translations={{ empty: 'Aucun résultat', rowCount: ({ total }) => `${total} ligne(s)` }}
     * />
     * ```
     */
    translations?: Translations
    /**
     * Ref callback or variable for the outer container `<div>`, which wraps the scrolling table,
     * the loading overlay, and the pagination toolbar. The inherited `ref` targets the `<table>`.
     */
    wrapperRef?: Ref<HTMLDivElement>
    /**
     * Extra attributes for each body row (`<tr>`), such as drag wiring from
     * `createListSortable().useRow`. Called once per row, under that row's owner, so it may call
     * row-level hooks; read `context` fields lazily to follow index changes. Its `class` merges
     * into the `row` slot, and its `ref`, `onClick`, and `onDblClick` run alongside the table's
     * own (before `onRowClick` and `onRowDoubleClick`).
     * @example
     * ```tsx
     * import { DataTable, createDataTable } from 'moraine/data-table'
     *
     * const table = createDataTable({
     *   data: [{ id: 'a', name: 'Ada', active: false }],
     *   columns: [{ accessorKey: 'name', header: 'Name' }],
     * })
     *
     * <DataTable
     *   table={table}
     *   rowProps={({ row }) => ({ class: row.original.active ? undefined : 'opacity-60', title: row.id })}
     * />
     * ```
     */
    rowProps?: (context: RowPropsContext<TData>) => RowAttributes
    /**
     * Extra attributes for each header cell (`<th>`), such as drag wiring from
     * `createListSortable().useRow` to reorder columns. Called once per header cell, under its
     * owner; read `context` fields lazily to follow index changes. Its `ref` is composed with the
     * table's own.
     * @example
     * ```tsx
     * import { DataTable, createDataTable } from 'moraine/data-table'
     *
     * const table = createDataTable({
     *   data: [{ name: 'Ada' }],
     *   columns: [{ accessorKey: 'name', header: 'Name' }],
     * })
     *
     * <DataTable table={table} headProps={({ header }) => ({ title: `Column ${header.column.id}` })} />
     * ```
     */
    headProps?: (context: HeadPropsContext<TData>) => HeadAttributes
    /**
     * Whether the table is loading. Shows the loading overlay (a spinner, or `loadingRender`) over
     * the table, sets `aria-busy`, and announces the localized `loading` message to screen
     * readers. Rows stay rendered, and the empty state is hidden while loading.
     */
    loading?: boolean
    /**
     * Replaces the default spinner inside the loading overlay shown while `loading` is `true`.
     * A component receives the visible column count as `colSpan`.
     * @example
     * ```tsx
     * import { DataTable, createDataTable } from 'moraine/data-table'
     *
     * const table = createDataTable({
     *   data: [],
     *   columns: [{ accessorKey: 'name', header: 'Name' }],
     * })
     *
     * <DataTable table={table} loading loadingRender={<span>Fetching rows…</span>} />
     * ```
     */
    loadingRender?: JSX.Element | Component<LoadingRenderProps>
    /**
     * Replaces the default `No results.` message inside the single empty-state cell, rendered when
     * the table has no rows and is not `loading`. A component receives the visible column count
     * as `colSpan`.
     * @example
     * ```tsx
     * import { DataTable, createDataTable } from 'moraine/data-table'
     *
     * const table = createDataTable({
     *   data: [],
     *   columns: [{ accessorKey: 'name', header: 'Name' }],
     * })
     *
     * <DataTable table={table} emptyRender={() => <p>No users yet. Invite someone to get started.</p>} />
     * ```
     */
    emptyRender?: JSX.Element | Component<EmptyRenderProps>
    /**
     * Maximum height of the table scroll container. A number is in pixels and a string is any CSS
     * length (e.g. `400` or `'50vh'`). Rows scroll vertically beyond it; combine with `sticky` to
     * keep the header visible. Unset or `0` leaves the height unbounded.
     */
    maxHeight?: number | string
    /**
     * Component rendered in a detail row below each expanded row, spanning every column. Rows
     * expand through the `expandable` option, tree `getSubRows` data, or the row's
     * `toggleExpanded()`. Receives the `row`. Ignored, with a development warning, when
     * `virtualizer` is set.
     * @example
     * ```tsx
     * import { DataTable, createDataTable } from 'moraine/data-table'
     *
     * const table = createDataTable({
     *   data: [{ name: 'Ada', bio: 'Mathematician' }],
     *   columns: [{ accessorKey: 'name', header: 'Name' }],
     *   expandable: true,
     * })
     *
     * <DataTable table={table} expandedRowRender={(props) => <p>{props.row.original.bio}</p>} />
     * ```
     */
    expandedRowRender?: Component<ExpandedRowRenderProps<TData>>
    /**
     * Called when a body row is clicked, with the row and the click event, and gives rows a
     * clickable style. Clicks on the selection control and the expand button do not reach it.
     * A click handler returned by `rowProps` runs first.
     * @example
     * ```tsx
     * import { DataTable, createDataTable } from 'moraine/data-table'
     *
     * const table = createDataTable({
     *   data: [{ id: 'a', name: 'Ada' }],
     *   columns: [{ accessorKey: 'name', header: 'Name' }],
     * })
     *
     * <DataTable table={table} onRowClick={(row, event) => console.log(row.original.id, event.metaKey)} />
     * ```
     */
    onRowClick?: (row: Row<TData>, event: MouseEvent) => void
    /**
     * Called when a body row is double-clicked, with the row and the event. Like `onRowClick`, it
     * gives rows a clickable style, and the selection and expand controls do not trigger it.
     */
    onRowDoubleClick?: (row: Row<TData>, event: MouseEvent) => void
    /**
     * Renders only the visible rows, and the visible center columns when the virtualizer has the
     * `columns` option. Create it with `createTableVirtualizer()` from `moraine/virtualizer`.
     * Disables pagination (the toolbar is hidden and every row is shown in one scroll) and
     * `expandedRowRender`. Bound the scroll area with `maxHeight`.
     * @example
     * ```tsx
     * import { DataTable, createDataTable } from 'moraine/data-table'
     * import type { DataTableT } from 'moraine/data-table'
     * import { createTableVirtualizer } from 'moraine/virtualizer'
     *
     * interface Person {
     *   name: string
     * }
     * const people: Person[] = Array.from({ length: 5000 }, (_, i) => ({ name: `Person ${i}` }))
     * const table = createDataTable({ data: people, columns: [{ accessorKey: 'name', header: 'Name' }] })
     * const virtualizer = createTableVirtualizer<DataTableT.Row<Person>>({ estimateSize: () => 40 })
     *
     * <DataTable table={table} virtualizer={virtualizer} maxHeight={400} />
     * ```
     */
    virtualizer?: Virtualizer<TData>
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
