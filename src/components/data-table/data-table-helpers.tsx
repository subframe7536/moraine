import {
  columnFilteringFeature,
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
  rowExpandingFeature,
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
import { Show } from 'solid-js'

import { Checkbox } from '../checkbox'
import { Icon } from '../icon'

import { dataTableDataAttributes } from './data-table.recipe'

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
      columnPinningFeature,
      columnResizingFeature,
      rowExpandingFeature,
      expandedRowModel: createExpandedRowModel(),
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
    columnPinningFeature,
    columnResizingFeature,
    rowExpandingFeature,
    expandedRowModel: createExpandedRowModel(),
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
 * Creates a column definition for row selection checkboxes or radio buttons with select-all header.
 */
export function createSelectColumn<
  TFeatures extends TableFeatures = TableFeatures,
  TData extends RowData = RowData,
>(options?: { mode?: 'single' | 'multiple' }): ColumnDef<TFeatures, TData> {
  const isSingle = options?.mode === 'single'

  return {
    id: 'select',
    header: (props: any): JSX.Element => (
      <Show when={!isSingle}>
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
      </Show>
    ),
    cell: (props: any): JSX.Element => {
      const canSelect = () => props.row.getCanSelect?.() ?? true
      const isSelected = () => props.row.getIsSelected?.() ?? false

      return (
        <Show
          when={isSingle}
          fallback={
            <Checkbox
              checked={isSelected()}
              disabled={!canSelect()}
              onCheckedChange={(val) => props.row.toggleSelected?.(val === true)}
              aria-label="Select row"
            />
          }
        >
          <div class="flex items-center justify-center">
            <div
              role="radio"
              aria-checked={isSelected()}
              aria-disabled={!canSelect()}
              tabIndex={canSelect() ? 0 : -1}
              onClick={(e) => {
                e.stopPropagation()
                if (canSelect()) {
                  props.row.toggleSelected?.(true)
                }
              }}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault()
                  e.stopPropagation()
                  if (canSelect()) {
                    props.row.toggleSelected?.(true)
                  }
                }
              }}
              class="outline-none border border-input rounded-full bg-control inline-flex size-4 cursor-pointer transition-colors items-center justify-center aria-checked:text-primary-foreground aria-checked:border-primary aria-checked:bg-primary aria-disabled:opacity-50 aria-disabled:cursor-not-allowed"
              aria-label="Select row"
            >
              <span
                class={`rounded-full bg-primary-foreground size-1.5 transition-transform ${isSelected() ? 'scale-100' : 'scale-0'}`}
              />
            </div>
          </div>
        </Show>
      )
    },
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    size: 40,
    meta: {
      align: 'center',
      class: 'w-10 px-2',
    },
  } as unknown as ColumnDef<TFeatures, TData>
}

/**
 * Creates a column definition for row expansion chevron toggle buttons.
 */
export function createExpandColumn<
  TFeatures extends TableFeatures = TableFeatures,
  TData extends RowData = RowData,
>(): ColumnDef<TFeatures, TData> {
  return {
    id: 'expand',
    header: (): JSX.Element => null,
    cell: (props: any): JSX.Element => {
      const canExpand = () => props.row.getCanExpand?.() ?? true
      const isExpanded = () => props.row.getIsExpanded?.() ?? false

      return (
        <Show when={canExpand()} fallback={<div class="w-6" />}>
          <button
            type="button"
            data-slot="data-table-expand-button"
            aria-label={isExpanded() ? 'Collapse row' : 'Expand row'}
            aria-expanded={isExpanded()}
            {...dataTableDataAttributes.expandButton({ expanded: isExpanded })}
            onClick={(e) => {
              e.stopPropagation()
              props.row.toggleExpanded?.()
            }}
            class="text-muted-foreground p-0 rounded inline-flex size-6 cursor-pointer transition-transform items-center justify-center hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring data-expanded:rotate-90"
          >
            <Icon name="icon-chevron-right" class="size-4" />
          </button>
        </Show>
      )
    },
    enableSorting: false,
    enableHiding: false,
    enableResizing: false,
    size: 40,
    meta: {
      align: 'center',
      class: 'w-10 px-2',
    },
  } as unknown as ColumnDef<TFeatures, TData>
}
