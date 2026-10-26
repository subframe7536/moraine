import { createTable, functionalUpdate } from '@tanstack/solid-table'
import type { Row, RowData, TableOptions, TableState, Updater } from '@tanstack/solid-table'

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

const _tableConfigMap = new WeakMap<object, DataTableInternalConfig>()

export function getDataTableConfig(table: object): DataTableInternalConfig {
  return (
    _tableConfigMap.get(table) ?? {
      paginated: false,
      pageSizes: DEFAULT_DATA_TABLE_PAGE_SIZES,
      hasSelection: false,
    }
  )
}

function resolveMaybeAccessor<T>(value: T | (() => T)): T {
  return typeof value === 'function' ? (value as () => T)() : value
}

const STATE_SLICE_KEYS = [
  'sorting',
  'pagination',
  'rowSelection',
  'expanded',
  'columnOrder',
  'columnPinning',
  'columnVisibility',
  'columnSizing',
  'columnFilters',
  'globalFilter',
] as const

type StateSliceKey = (typeof STATE_SLICE_KEYS)[number]

/**
 * Creates a reactive TanStack Solid Table instance configured for `DataTable`.
 */
export function createDataTable<TData extends RowData = RowData>(
  options: DataTableT.Options<TData>,
): DataTableT.Instance<TData> {
  const paginationOpt = options.pagination
  const paginated = Boolean(paginationOpt)
  const initialPageSize =
    typeof paginationOpt === 'object' && paginationOpt !== null ? paginationOpt.pageSize : undefined
  const pageSizesOpt =
    typeof paginationOpt === 'object' && paginationOpt !== null
      ? paginationOpt.pageSizes
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

  const selectCol = () => {
    const sel = resolveMaybeAccessor(options.selection)
    return sel ? buildSelectColumn<TData>(sel) : undefined
  }
  const expandCol = buildExpandColumn<TData>()

  // `expandable` accepts a row predicate; accessors are distinguished by arity.
  type ExpandableValue = boolean | ((row: DataTableT.Row<TData>) => boolean) | undefined
  const resolveExpandable = (): ExpandableValue => {
    const exp = options.expandable
    if (typeof exp !== 'function') {
      return exp
    }
    return exp.length === 0
      ? (exp as () => ExpandableValue)()
      : (exp as (row: DataTableT.Row<TData>) => boolean)
  }

  const resolveColumns = (): DataTableT.Column<TData>[] => {
    const userColumns = resolveMaybeAccessor(options.columns)
    const exp = resolveExpandable()
    const sel = selectCol()
    const prefix: DataTableT.Column<TData>[] = []
    if (sel && !userColumns.some((col) => col.id === 'select')) {
      prefix.push(sel)
    }
    if (exp && !userColumns.some((col) => col.id === 'expand')) {
      prefix.push(expandCol)
    }
    return prefix.length > 0 ? [...prefix, ...userColumns] : [...userColumns]
  }

  const stateObject: Record<string, unknown> = {}
  if (options.state) {
    for (const key of STATE_SLICE_KEYS) {
      if (key in options.state) {
        Object.defineProperty(stateObject, key, {
          enumerable: true,
          configurable: true,
          get() {
            return resolveMaybeAccessor(options.state?.[key])
          },
        })
      }
    }
  }
  if (options.tableOptions?.state) {
    for (const key of Object.keys(options.tableOptions.state)) {
      if (!(key in stateObject)) {
        Object.defineProperty(stateObject, key, {
          enumerable: true,
          configurable: true,
          get() {
            const externalState = options.tableOptions?.state
            return externalState?.[key as keyof TableState<DataTableFeatures>]
          },
        })
      }
    }
  }

  function makeChangeHandler<K extends StateSliceKey>(
    key: K,
    getCallback: () => ((next: DataTableT.State[K]) => void) | undefined,
  ) {
    return (updater: Updater<DataTableT.State[K]>) => {
      const controlled = options.state !== undefined && key in options.state
      let nextValue!: DataTableT.State[K]
      const writeAtom = (table.options.atoms?.[key] ?? table.baseAtoms[key]) as
        | { set: (fn: (prev: DataTableT.State[K]) => DataTableT.State[K]) => void }
        | undefined
      if (controlled || !writeAtom) {
        const current = (table.atoms[key]?.get() ?? resolveMaybeAccessor(options.state?.[key])) as
          | DataTableT.State[K]
          | undefined
        nextValue = functionalUpdate(updater, current as DataTableT.State[K])
      } else {
        writeAtom.set((prev) => {
          nextValue = functionalUpdate(updater, prev)
          return nextValue
        })
      }
      getCallback()?.(nextValue)
    }
  }

  const resolvedTableOptions: TableOptions<DataTableFeatures, TData> = {
    features: getDataTableFeatures({ pagination: paginated }),
    get data() {
      return resolveMaybeAccessor(options.data) as TData[]
    },
    get columns() {
      return resolveColumns()
    },
    getRowId: options.getRowId
      ? (originalRow: TData, index: number, parent?: Row<DataTableFeatures, TData>): string => {
          const leafId = options.getRowId!(originalRow, index, parent)
          return parent ? `${parent.id}.${leafId}` : leafId
        }
      : undefined,
    get enableSorting() {
      const sorting = resolveMaybeAccessor(options.sorting)
      return sorting ?? true
    },
    get enableMultiRowSelection() {
      const sel = resolveMaybeAccessor(options.selection)
      return sel !== 'single'
    },
    get enableRowSelection() {
      if (options.canSelectRow) {
        return options.canSelectRow
      }
      const sel = resolveMaybeAccessor(options.selection)
      return sel !== undefined ? true : undefined
    },
    get enableColumnResizing() {
      return resolveMaybeAccessor(options.resizable) ?? false
    },
    get manualSorting() {
      return resolveMaybeAccessor(options.manual) ? true : undefined
    },
    get manualFiltering() {
      return resolveMaybeAccessor(options.manual) ? true : undefined
    },
    get manualPagination() {
      return resolveMaybeAccessor(options.manual) ? true : undefined
    },
    get rowCount() {
      return resolveMaybeAccessor(options.rowCount)
    },
    get autoResetPageIndex() {
      if (resolveMaybeAccessor(options.manual)) {
        return false
      }
      return undefined
    },
    getRowCanExpand: (row: Row<DataTableFeatures, TData>) => {
      const exp = resolveExpandable()
      return typeof exp === 'function' ? exp(row) : Boolean(exp)
    },
    initialState,
    ...(Object.keys(stateObject).length > 0 ? { state: stateObject } : {}),
    onSortingChange: makeChangeHandler('sorting', () => options.onSortingChange),
    onPaginationChange: makeChangeHandler('pagination', () => options.onPaginationChange),
    onRowSelectionChange: makeChangeHandler('rowSelection', () => options.onRowSelectionChange),
    onExpandedChange: makeChangeHandler('expanded', () => options.onExpandedChange),
    onColumnOrderChange: makeChangeHandler('columnOrder', () => options.onColumnOrderChange),
    onColumnPinningChange: makeChangeHandler('columnPinning', () => options.onColumnPinningChange),
    onColumnVisibilityChange: makeChangeHandler(
      'columnVisibility',
      () => options.onColumnVisibilityChange,
    ),
    onColumnSizingChange: makeChangeHandler('columnSizing', () => options.onColumnSizingChange),
    onColumnFiltersChange: makeChangeHandler('columnFilters', () => options.onColumnFiltersChange),
    onGlobalFilterChange: makeChangeHandler('globalFilter', () => options.onGlobalFilterChange),
  }

  if (options.tableOptions) {
    const descriptors = Object.getOwnPropertyDescriptors(options.tableOptions)
    for (const [key, desc] of Object.entries(descriptors)) {
      if (key === 'state' || key === 'features') {
        continue
      }
      Object.defineProperty(resolvedTableOptions, key, desc)
    }
  }

  table = createTable(resolvedTableOptions)

  const config: DataTableInternalConfig = {
    get paginated() {
      return paginated
    },
    get pageSizes() {
      return pageSizesOpt === false ? false : (pageSizesOpt ?? DEFAULT_DATA_TABLE_PAGE_SIZES)
    },
    get hasSelection() {
      return Boolean(resolveMaybeAccessor(options.selection))
    },
  }
  _tableConfigMap.set(table, config)

  return table
}
