import type { CellContext, ColumnDef, HeaderContext, RowData } from '@tanstack/solid-table'
import type { Accessor, JSX } from 'solid-js'
import { Show } from 'solid-js'

import { createContextProvider } from '../../shared/create-context-provider'
import { Checkbox } from '../checkbox'
import { Icon } from '../icon'

import type { DataTableFeatures } from './data-table-features'
import { defaultDataTableMessages } from './data-table.messages'
import {
  DATA_TABLE_EXPAND_BUTTON_CLASS,
  DATA_TABLE_EXPAND_PLACEHOLDER_CLASS,
  DATA_TABLE_RADIO_CLASS,
  DATA_TABLE_RADIO_INDICATOR_CLASS,
  DATA_TABLE_RADIO_WRAPPER_CLASS,
  dataTableDataAttributes,
} from './data-table.recipe'
import type { DataTableT } from './data-table.types'

export interface DataTableInternalContextValue {
  expandButton?: { readonly class?: string; readonly style?: JSX.CSSProperties }
  messages: Accessor<DataTableT.Messages>
}

export const [DataTableInternalProvider, useDataTableInternal] =
  createContextProvider<DataTableInternalContextValue>('DataTableInternal', {
    messages: () => defaultDataTableMessages,
  })

export function buildSelectColumn<TData extends RowData = RowData>(
  mode: 'single' | 'multiple',
): ColumnDef<DataTableFeatures, TData> {
  const isSingle = mode === 'single'

  return {
    id: 'select',
    header: (props: HeaderContext<DataTableFeatures, TData>): JSX.Element => {
      const ctx = useDataTableInternal()
      return (
        <Show when={!isSingle}>
          <Checkbox
            checked={
              props.table.getIsAllPageRowsSelected()
                ? true
                : props.table.getIsSomePageRowsSelected()
                  ? 'indeterminate'
                  : false
            }
            onCheckedChange={(val) => props.table.toggleAllPageRowsSelected(val === true)}
            aria-label={ctx.messages().selectAll}
          />
        </Show>
      )
    },
    cell: (props: CellContext<DataTableFeatures, TData>): JSX.Element => {
      const ctx = useDataTableInternal()
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
          <div class={DATA_TABLE_RADIO_WRAPPER_CLASS}>
            <div
              role="radio"
              aria-checked={isSelected()}
              aria-disabled={!canSelect()}
              aria-label={ctx.messages().selectRow}
              tabIndex={canSelect() ? 0 : -1}
              onClick={(e) => {
                e.stopPropagation()
                if (canSelect()) {
                  props.row.toggleSelected(true)
                }
              }}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault()
                  e.stopPropagation()
                  if (canSelect()) {
                    props.row.toggleSelected(true)
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
  }
}

export function buildExpandColumn<TData extends RowData = RowData>(): ColumnDef<
  DataTableFeatures,
  TData
> {
  return {
    id: 'expand',
    header: (): JSX.Element => null,
    cell: (props: CellContext<DataTableFeatures, TData>): JSX.Element => {
      const ctx = useDataTableInternal()
      const canExpand = () => props.row.getCanExpand()
      const isExpanded = () => props.row.getIsExpanded()
      const expandButton = ctx.expandButton ?? { class: DATA_TABLE_EXPAND_BUTTON_CLASS }

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
            {...expandButton}
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
