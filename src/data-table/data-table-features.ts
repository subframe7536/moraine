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

const columnMeta: DataTableT.ColumnMeta = {}

function createDataTableFeatureSet() {
  return tableFeatures({
    columnMeta,
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
    rowPaginationFeature,
    // Pagination stays registered; `manualPagination` gates row slicing.
    paginatedRowModel: createPaginatedRowModel(),
  })
}

let _features: ReturnType<typeof createDataTableFeatureSet> | undefined

export function getDataTableFeatures(): ReturnType<typeof createDataTableFeatureSet> {
  return (_features ??= createDataTableFeatureSet())
}

export type DataTableFeatures = ReturnType<typeof getDataTableFeatures>
