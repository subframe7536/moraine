import {
  columnFilteringFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_arrIncludes,
  filterFn_equals,
  filterFn_inDateRange,
  filterFn_inNumberRange,
  filterFn_includesString,
  filterFn_weakEquals,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
} from '@tanstack/solid-table'
import type { ColumnDef, RowData, TableFeatures } from '@tanstack/solid-table'
import type { JSX } from 'solid-js'

import { Checkbox } from '../checkbox'

function createDefaultDataTableFeatures(options: { pagination?: boolean } = {}) {
  const { pagination = true } = options

  if (!pagination) {
    return tableFeatures({
      rowSortingFeature,
      sortedRowModel: createSortedRowModel(),
      sortFns: {
        alphanumeric: sortFn_alphanumeric,
        text: sortFn_text,
        datetime: sortFn_datetime,
      },
      columnFilteringFeature,
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
      rowSelectionFeature,
    })
  }

  return tableFeatures({
    rowSortingFeature,
    sortedRowModel: createSortedRowModel(),
    sortFns: {
      alphanumeric: sortFn_alphanumeric,
      text: sortFn_text,
      datetime: sortFn_datetime,
    },
    columnFilteringFeature,
    filteredRowModel: createFilteredRowModel(),
    filterFns: {
      includesString: filterFn_includesString,
      inNumberRange: filterFn_inNumberRange,
      equals: filterFn_equals,
      arrIncludes: filterFn_arrIncludes,
      inDateRange: filterFn_inDateRange,
      weakEquals: filterFn_weakEquals,
    },
    rowPaginationFeature,
    paginatedRowModel: createPaginatedRowModel(),
    columnVisibilityFeature,
    columnSizingFeature,
    rowSelectionFeature,
  })
}

let _defaultFeatures: ReturnType<typeof createDefaultDataTableFeatures> | undefined
let _unpaginatedFeatures: ReturnType<typeof createDefaultDataTableFeatures> | undefined

/** Returns the lazily-initialized standard table features for convenience mode. */
export function getDefaultDataTableFeatures(options?: {
  pagination?: boolean
}): ReturnType<typeof createDefaultDataTableFeatures> {
  if (options?.pagination === false) {
    return (_unpaginatedFeatures ??= createDefaultDataTableFeatures({ pagination: false }))
  }
  return (_defaultFeatures ??= createDefaultDataTableFeatures({ pagination: true }))
}

export type DefaultDataTableFeatures = ReturnType<typeof getDefaultDataTableFeatures>

/**
 * Creates a column definition for row selection checkboxes with indeterminate select-all header.
 */
export function createSelectColumn<
  TFeatures extends TableFeatures = TableFeatures,
  TData extends RowData = RowData,
>(): ColumnDef<TFeatures, TData> {
  return {
    id: 'select',
    header: (props: any): JSX.Element => (
      <Checkbox
        checked={
          props.table.getIsAllPageRowsSelected?.()
            ? true
            : props.table.getIsSomePageRowsSelected?.()
              ? 'indeterminate'
              : false
        }
        onCheckedChange={(val) => props.table.toggleAllPageRowsSelected?.(val === true)}
        aria-label="Select all rows"
      />
    ),
    cell: (props: any): JSX.Element => (
      <Checkbox
        checked={props.row.getIsSelected?.() ?? false}
        onCheckedChange={(val) => props.row.toggleSelected?.(val === true)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    meta: {
      align: 'center',
      class: 'w-10 px-2',
    },
  } as unknown as ColumnDef<TFeatures, TData>
}
