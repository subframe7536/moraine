import {
  columnFilteringFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createExpandedRowModel,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_arrIncludes,
  filterFn_equals,
  filterFn_inDateRange,
  filterFn_inNumberRange,
  filterFn_includesString,
  filterFn_weakEquals,
  globalFilteringFeature,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
} from '@tanstack/solid-table'

import type { DataTableT } from './data-table.types'

function createDataTableFeatureSet(options: { pagination?: boolean } = {}) {
  const { pagination = false } = options
  const shared = {
    columnMeta: {} as DataTableT.ColumnMeta,
    rowSortingFeature,
    sortedRowModel: createSortedRowModel(),
    sortFns: {
      alphanumeric: sortFn_alphanumeric,
      text: sortFn_text,
      datetime: sortFn_datetime,
    },
    columnFilteringFeature,
    globalFilteringFeature,
    filteredRowModel: createFilteredRowModel(),
    filterFns: {
      includesString: filterFn_includesString,
      inNumberRange: filterFn_inNumberRange,
      equals: filterFn_equals,
      arrIncludes: filterFn_arrIncludes,
      inDateRange: filterFn_inDateRange,
      weakEquals: filterFn_weakEquals,
    },
    columnVisibilityFeature,
    columnSizingFeature,
    columnOrderingFeature,
    columnPinningFeature,
    columnResizingFeature,
    rowExpandingFeature,
    expandedRowModel: createExpandedRowModel(),
    rowSelectionFeature,
  } as const

  if (!pagination) {
    return tableFeatures({
      ...shared,
      rowPaginationFeature,
    })
  }

  return tableFeatures({
    ...shared,
    rowPaginationFeature,
    paginatedRowModel: createPaginatedRowModel(),
  })
}

let _paginatedFeatures: ReturnType<typeof createDataTableFeatureSet> | undefined
let _unpaginatedFeatures: ReturnType<typeof createDataTableFeatureSet> | undefined

export function getDataTableFeatures(options?: {
  pagination?: boolean
}): ReturnType<typeof createDataTableFeatureSet> {
  if (options?.pagination) {
    return (_paginatedFeatures ??= createDataTableFeatureSet({ pagination: true }))
  }
  return (_unpaginatedFeatures ??= createDataTableFeatureSet({ pagination: false }))
}

export type DataTableFeatures = ReturnType<typeof getDataTableFeatures>
