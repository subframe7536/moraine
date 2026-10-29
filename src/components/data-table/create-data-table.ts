import { createTable, functionalUpdate, stateSlicesEqual } from '@tanstack/solid-table'
import type { Row, RowData, TableOptions, Updater } from '@tanstack/solid-table'
import { DEV, createMemo, mergeProps, untrack } from 'solid-js'

import { buildExpandColumn, buildSelectColumn } from './data-table-columns'
import { getDataTableFeatures } from './data-table-features'
import type { DataTableFeatures } from './data-table-features'
import type { DataTableT } from './data-table.types'

export const DEFAULT_DATA_TABLE_PAGE_SIZES = [5, 10, 20, 50] as const

export interface DataTableInternalConfig {
  readonly paginated: boolean
  readonly pageSizes: readonly number[] | false
  readonly hasSelection: boolean
}

const FALLBACK_CONFIG: DataTableInternalConfig = Object.freeze({
  paginated: false,
  pageSizes: DEFAULT_DATA_TABLE_PAGE_SIZES,
  hasSelection: false,
})

// DataTable-only settings (`pagination`, `selection`) that TanStack table options cannot carry.
const _tableConfigMap = new WeakMap<object, DataTableInternalConfig>()
const _warnedTables = DEV ? new WeakSet<object>() : undefined

/** Reads DataTable settings registered by `createDataTable` for `table`. */
export function getDataTableConfig(table: object): DataTableInternalConfig {
  const config = _tableConfigMap.get(table)
  if (config) {
    return config
  }
  if (DEV && !_warnedTables!.has(table)) {
    _warnedTables!.add(table)
    console.warn(
      '[moraine] DataTable received a table that was not created with createDataTable. Pagination and selection UI are disabled.',
    )
  }
  return FALLBACK_CONFIG
}

/**
 * Creates a reactive TanStack Solid Table instance configured for `DataTable`.
 *
 * Options read through the table options object, so declare getters for
 * values that change over time (`get data() { return rows() }`). Controlled
 * state slices live under `state` (`get sorting() { return sorting() }`) and
 * report resolved values through `on[Slice]Change` callbacks.
 */
export function createDataTable<TData extends RowData = RowData>(
  options: DataTableT.Options<TData>,
): DataTableT.Instance<TData> {
  const initialPageSize =
    typeof options.pagination === 'object' && options.pagination !== null
      ? options.pagination.pageSize
      : undefined

  const initialState: Partial<DataTableT.State> = {
    ...options.initialState,
    ...(initialPageSize !== undefined
      ? {
          pagination: {
            pageIndex: options.initialState?.pagination?.pageIndex ?? 0,
            pageSize: initialPageSize,
          },
        }
      : {}),
  }

  let table!: DataTableT.Instance<TData>

  const expandCol = buildExpandColumn<TData>()

  // Row-model memos treat `data`/`columns` by reference. Getters that rebuild
  // arrays on every read would churn them into spurious auto-resets, so cache
  // resolution behind memos that only recompute when tracked inputs change.
  const memoizedData = createMemo(() => options.data as TData[])
  const memoizedColumns = createMemo(() => {
    const userColumns = options.columns
    const prefix: DataTableT.Column<TData>[] = []
    if (options.selection && !userColumns.some((col) => col.id === 'select')) {
      prefix.push(buildSelectColumn<TData>(options.selection))
    }
    if (options.expandable && !userColumns.some((col) => col.id === 'expand')) {
      prefix.push(expandCol)
    }
    return prefix.length > 0 ? [...prefix, ...userColumns] : [...userColumns]
  })

  const paginationConfig = createMemo(() => {
    const opt = options.pagination
    return {
      enabled: Boolean(opt),
      pageSizes:
        typeof opt === 'object' && opt !== null
          ? (opt.pageSizes ?? DEFAULT_DATA_TABLE_PAGE_SIZES)
          : DEFAULT_DATA_TABLE_PAGE_SIZES,
    }
  })

  const tableState = options.tableOptions?.state
  const ownState = options.state
  const mergedState = mergeProps(tableState ?? {}, ownState ?? {})
  const hasState = tableState !== undefined || ownState !== undefined

  function makeChangeHandler<K extends keyof DataTableT.State>(
    key: K,
    getCallback: () => ((next: DataTableT.State[K]) => void) | undefined,
  ) {
    return (updater: Updater<DataTableT.State[K]>) => {
      // TanStack write path: external atoms first, base atoms otherwise. When
      // the slice is controlled through `state`, the base-atom write stays
      // shadowed by `atoms[key]` but keeps the internal snapshot consistent.
      const atom = (table.options.atoms?.[key] ?? table.baseAtoms[key]) as
        | { get: () => DataTableT.State[K]; set: (updater: Updater<DataTableT.State[K]>) => void }
        | undefined
      const prev = untrack(() => (table.atoms[key]?.get() ?? atom?.get()) as DataTableT.State[K])
      const next = functionalUpdate(updater, prev)
      if (stateSlicesEqual(prev, next)) {
        return
      }
      atom?.set(() => next)
      getCallback()?.(next)
    }
  }

  const features = getDataTableFeatures()
  // `mergeProps` treats `undefined` as "fall back to a previous source". The
  // initial options snapshot is captured once by `constructTable`, so a getter
  // returning `undefined` would keep resurrecting stale values on later
  // merges. Volatile options return `false`/`null` — `null` stays defined for
  // mergeProps but nullish for TanStack `??` defaults.
  const resolvedTableOptions = mergeProps(
    {
      get data() {
        return memoizedData()
      },
      get columns() {
        return memoizedColumns()
      },
      getRowId: options.getRowId
        ? (originalRow: TData, index: number, parent?: Row<DataTableFeatures, TData>): string => {
            const leafId = options.getRowId!(originalRow, index, parent)
            return parent ? `${parent.id}.${leafId}` : leafId
          }
        : undefined,
      get enableSorting() {
        return options.sorting ?? true
      },
      get enableMultiRowSelection() {
        return options.selection !== 'single'
      },
      get enableRowSelection() {
        return options.canSelectRow ?? (options.selection !== undefined ? true : null)
      },
      get enableColumnResizing() {
        return options.resizable ?? false
      },
      get manualSorting() {
        return options.manual || null
      },
      get manualFiltering() {
        return options.manual || null
      },
      get manualPagination() {
        return options.manual === true || !paginationConfig().enabled
      },
      get rowCount() {
        return options.rowCount ?? null
      },
      get autoResetPageIndex() {
        return options.manual ? false : null
      },
      getRowCanExpand: (row: Row<DataTableFeatures, TData>) => {
        const expandable = options.expandable
        if (typeof expandable === 'function') {
          return expandable(row)
        }
        // Without `expandable`, keep TanStack's default so tree data (`getSubRows`) expands.
        return expandable === true || row.subRows.length > 0
      },
      initialState,
      onSortingChange: makeChangeHandler('sorting', () => options.onSortingChange),
      onPaginationChange: makeChangeHandler('pagination', () => options.onPaginationChange),
      onRowSelectionChange: makeChangeHandler('rowSelection', () => options.onRowSelectionChange),
      onExpandedChange: makeChangeHandler('expanded', () => options.onExpandedChange),
      onColumnOrderChange: makeChangeHandler('columnOrder', () => options.onColumnOrderChange),
      onColumnPinningChange: makeChangeHandler(
        'columnPinning',
        () => options.onColumnPinningChange,
      ),
      onColumnVisibilityChange: makeChangeHandler(
        'columnVisibility',
        () => options.onColumnVisibilityChange,
      ),
      onColumnSizingChange: makeChangeHandler('columnSizing', () => options.onColumnSizingChange),
      onColumnFiltersChange: makeChangeHandler(
        'columnFilters',
        () => options.onColumnFiltersChange,
      ),
      onGlobalFilterChange: makeChangeHandler('globalFilter', () => options.onGlobalFilterChange),
    },
    options.tableOptions ?? {},
    {
      features,
      ...(hasState ? { state: mergedState } : {}),
    },
  ) as TableOptions<DataTableFeatures, TData>

  table = createTable(resolvedTableOptions)

  const config: DataTableInternalConfig = {
    get paginated() {
      return paginationConfig().enabled
    },
    get pageSizes() {
      return paginationConfig().pageSizes
    },
    get hasSelection() {
      return Boolean(options.selection)
    },
  }
  _tableConfigMap.set(table, config)

  return table
}
