import type { CellContext, ColumnDef, HeaderContext, RowData } from '@tanstack/solid-table'
import type { JSX } from 'solid-js'
import { Show } from 'solid-js'

import { HiddenInput } from '../../shared/hidden-input'
import { PEER_CLASS } from '../../theme/recipe-common.recipe'
import { Checkbox } from '../checkbox'
import { Icon } from '../icon'

import { useDataTableContext } from './data-table-context'
import type { DataTableFeatures } from './data-table-features'
import {
  DATA_TABLE_EXPAND_PLACEHOLDER_CLASS,
  DATA_TABLE_RADIO_CLASS,
  DATA_TABLE_RADIO_INDICATOR_CLASS,
  DATA_TABLE_RADIO_WRAPPER_CLASS,
  dataTableDataAttributes,
} from './data-table.recipe'

/** Reserved id of the generated selection column. */
export const SELECT_COLUMN_ID = 'select'
/** Reserved id of the generated expand column. */
export const EXPAND_COLUMN_ID = 'expand'

export function buildSelectColumn<TData extends RowData = RowData>(
  mode: 'single' | 'multiple',
): ColumnDef<DataTableFeatures, TData> {
  const isSingle = mode === 'single'

  return {
    id: SELECT_COLUMN_ID,
    header: (props: HeaderContext<DataTableFeatures, TData>): JSX.Element => {
      const ctx = useDataTableContext()
      // Select-all covers the rows on screen: the current page, or every row when the table
      // is virtualized (virtual tables bypass the paginated row model).
      const allSelected = () =>
        ctx.virtual() ? props.table.getIsAllRowsSelected() : props.table.getIsAllPageRowsSelected()
      const someSelected = () =>
        ctx.virtual()
          ? props.table.getIsSomeRowsSelected()
          : props.table.getIsSomePageRowsSelected()
      const toggleAll = (value: boolean) =>
        ctx.virtual()
          ? props.table.toggleAllRowsSelected(value)
          : props.table.toggleAllPageRowsSelected(value)

      return (
        <Show when={!isSingle}>
          <Checkbox
            checked={allSelected() ? true : someSelected() ? 'indeterminate' : false}
            onCheckedChange={(val) => toggleAll(val === true)}
            aria-label={ctx.messages().selectAll}
          />
        </Show>
      )
    },
    cell: (props: CellContext<DataTableFeatures, TData>): JSX.Element => {
      const ctx = useDataTableContext()
      const canSelect = () => props.row.getCanSelect()
      const isSelected = () => props.row.getIsSelected()

      return (
        <Show
          when={isSingle}
          fallback={
            <div onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={isSelected()}
                disabled={!canSelect()}
                onCheckedChange={(val) => {
                  if (canSelect()) {
                    props.row.toggleSelected(val === true)
                  }
                }}
                aria-label={ctx.messages().selectRow}
              />
            </div>
          }
        >
          {/* Native same-name radios form one group: a single tab stop, arrow keys move and
              select, and disabled rows are skipped. */}
          <label class={DATA_TABLE_RADIO_WRAPPER_CLASS} onClick={(e) => e.stopPropagation()}>
            <HiddenInput
              type="radio"
              name={ctx.selectionName}
              data-slot="data-table-radio"
              checked={isSelected()}
              disabled={!canSelect()}
              aria-label={ctx.messages().selectRow}
              class={PEER_CLASS}
              onChange={(e) => {
                if (canSelect()) {
                  props.row.toggleSelected(true)
                }
                // Controlled state may reject the change; keep the input on the table state.
                e.currentTarget.checked = props.row.getIsSelected()
              }}
            />
            <span aria-hidden="true" class={DATA_TABLE_RADIO_CLASS}>
              <span class={DATA_TABLE_RADIO_INDICATOR_CLASS} />
            </span>
          </label>
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
  }
}

export function buildExpandColumn<TData extends RowData = RowData>(): ColumnDef<
  DataTableFeatures,
  TData
> {
  return {
    id: EXPAND_COLUMN_ID,
    header: (): JSX.Element => null,
    cell: (props: CellContext<DataTableFeatures, TData>): JSX.Element => {
      const ctx = useDataTableContext()
      const canExpand = () => props.row.getCanExpand()
      const isExpanded = () => props.row.getIsExpanded()

      return (
        <Show when={canExpand()} fallback={<div class={DATA_TABLE_EXPAND_PLACEHOLDER_CLASS} />}>
          <button
            type="button"
            data-slot="data-table-expand-button"
            aria-label={isExpanded() ? ctx.messages().collapseRow : ctx.messages().expandRow}
            aria-expanded={isExpanded()}
            {...dataTableDataAttributes.expandButton({ expanded: isExpanded })}
            onClick={(e) => {
              e.stopPropagation()
              props.row.toggleExpanded()
            }}
            {...ctx.slots.expandButton}
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
  }
}
