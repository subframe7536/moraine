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

import {
  DATA_TABLE_EXPAND_BUTTON_CLASS,
  DATA_TABLE_EXPAND_PLACEHOLDER_CLASS,
  DATA_TABLE_RADIO_CLASS,
  DATA_TABLE_RADIO_INDICATOR_CLASS,
  DATA_TABLE_RADIO_WRAPPER_CLASS,
  dataTableDataAttributes,
} from './data-table.recipe'

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
      columnOrderingFeature,
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
    columnOrderingFeature,
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
          <div class={DATA_TABLE_RADIO_WRAPPER_CLASS}>
            <div
              role="radio"
              aria-checked={isSelected()}
              aria-disabled={!canSelect()}
              aria-label="Select row"
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
              class={DATA_TABLE_RADIO_CLASS}
            >
              <span class={DATA_TABLE_RADIO_INDICATOR_CLASS} />
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
>(options?: {
  expandButton?: { readonly class?: string; readonly style?: JSX.CSSProperties }
}): ColumnDef<TFeatures, TData> {
  return {
    id: 'expand',
    header: (): JSX.Element => null,
    cell: (props: any): JSX.Element => {
      const canExpand = () => props.row.getCanExpand?.() ?? true
      const isExpanded = () => props.row.getIsExpanded?.() ?? false

      return (
        <Show when={canExpand()} fallback={<div class={DATA_TABLE_EXPAND_PLACEHOLDER_CLASS} />}>
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
            {...(options?.expandButton ?? { class: DATA_TABLE_EXPAND_BUTTON_CLASS })}
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
