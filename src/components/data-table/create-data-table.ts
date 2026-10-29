import { createTable, functionalUpdate, stateSlicesEqual } from '@tanstack/solid-table'
import type { Row, RowData, TableOptions, Updater } from '@tanstack/solid-table'
import { DEV, createMemo, mergeProps, untrack } from 'solid-js'

import {
  EXPAND_COLUMN_ID,
  SELECT_COLUMN_ID,
  buildExpandColumn,
  buildSelectColumn,
} from './data-table-columns'
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

/** Column id as TanStack resolves it: `id`, then `accessorKey` (dots become `_`), then a string `header`. */
function resolveColumnId(column: object): string | undefined {
  const def = column as { id?: string; accessorKey?: string | number; header?: unknown }
  if (def.id !== undefined) {
    return def.id
  }
  if (def.accessorKey !== undefined) {
    return String(def.accessorKey).replaceAll('.', '_')
  }
  return typeof def.header === 'string' ? def.header : undefined
}

/** Finds a column definition, at any group depth, whose resolved id is `id`. */
function findColumnById(
  columns: readonly object[],
  id: string,
): { readonly id?: string } | undefined {
  for (const column of columns) {
    if (resolveColumnId(column) === id) {
      return column
    }
    const children = (column as { columns?: readonly object[] }).columns
    const nested = children ? findColumnById(children, id) : undefined
    if (nested) {
      return nested
    }
  }
  return undefined
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
  const warnedIds = DEV ? new Set<string>() : undefined
  // A user column whose resolved id is reserved replaces the generated column, so ids never
  // collide. Derived ids (`accessorKey`, string `header`) replacing it are usually accidental.
  const hasUserColumn = (columns: readonly DataTableT.Column<TData>[], id: string): boolean => {
    const match = findColumnById(columns, id)
    if (DEV && match && match.id !== id && !warnedIds!.has(id)) {
      warnedIds!.add(id)
      console.warn(
        `[moraine] A DataTable column derives the reserved id "${id}" and replaces the generated "${id}" column. Set an explicit \`id\` on that column to keep both.`,
      )
    }
    return match !== undefined
  }

  // Row-model memos treat `data`/`columns` by reference. Getters that rebuild
  // arrays on every read would churn them into spurious auto-resets, so cache
  // resolution behind memos that only recompute when tracked inputs change.
  const memoizedData = createMemo(() => options.data as TData[])
  const memoizedColumns = createMemo(() => {
    const userColumns = options.columns
    const prefix: DataTableT.Column<TData>[] = []
    if (options.selection && !hasUserColumn(userColumns, SELECT_COLUMN_ID)) {
      prefix.push(buildSelectColumn<TData>(options.selection))
    }
    if (options.expandable && !hasUserColumn(userColumns, EXPAND_COLUMN_ID)) {
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
  //
  // Top-level options own every TanStack option they configure, so they merge after
  // `tableOptions`. Only options without a top-level counterpart stay overridable.
  const resolvedTableOptions = mergeProps(
    {
      get autoResetPageIndex() {
        return options.manual ? false : null
      },
    },
    options.tableOptions ?? {},
    {
      features,
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
      ...(options.state !== undefined ? { state: options.state } : {}),
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
