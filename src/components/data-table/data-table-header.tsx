import { FlexRender } from '@tanstack/solid-table'
import type { Header, RowData } from '@tanstack/solid-table'
import type { JSX } from 'solid-js'
import { For, Show, createMemo } from 'solid-js'

import { Icon } from '../icon'
import { TABLE_TEXT_ALIGN_CLASS } from '../table/table.recipe'

import { useDataTableContext } from './data-table-context'
import type { DataTableFeatures } from './data-table-features'
import {
  DATA_TABLE_HEAD_INNER_CLASS,
  DATA_TABLE_HEAD_LABEL_CLASS,
  dataTableDataAttributes,
} from './data-table.recipe'
import type { DataTableT } from './data-table.types'

const SORT_ICONS = {
  asc: 'icon-arrow-up',
  desc: 'icon-arrow-down',
  none: 'icon-arrow-up-down',
} as const

const ARIA_SORT = { asc: 'ascending', desc: 'descending', none: 'none' } as const

/** Header rows: column labels, sort toggles, and resize handles. */
export function DataTableHeader<TData extends RowData>(props: {
  table: DataTableT.Instance<TData>
}): JSX.Element {
  const ctx = useDataTableContext()

  return (
    <thead data-slot="data-table-header" {...ctx.slots.header}>
      <For each={props.table.getHeaderGroups()}>
        {(headerGroup) => (
          <tr data-slot="data-table-row" {...ctx.slots.row}>
            <For each={headerGroup.headers}>
              {(header) => <DataTableHeadCell table={props.table} header={header} />}
            </For>
          </tr>
        )}
      </For>
    </thead>
  )
}

function DataTableHeadCell<TData extends RowData>(props: {
  table: DataTableT.Instance<TData>
  header: Header<DataTableFeatures, TData>
}): JSX.Element {
  const ctx = useDataTableContext()
  const column = () => props.header.column
  const sorted = createMemo(() => column().getIsSorted() || 'none')
  const sortLabel = () => {
    const messages = ctx.messages()
    const direction = sorted()
    return direction === 'asc'
      ? messages.sortedAscending
      : direction === 'desc'
        ? messages.sortedDescending
        : messages.sort
  }

  return (
    <th
      data-slot="data-table-head"
      colSpan={props.header.colSpan}
      aria-sort={sorted() !== 'none' || column().getCanSort() ? ARIA_SORT[sorted()] : undefined}
      {...dataTableDataAttributes.head({
        pinned: () => column().getIsPinned(),
        pinnedEdge: () => ctx.pinnedEdge(column()),
      })}
      {...ctx.cellSlot('head', column(), () => props.header.getSize(), 'header')}
    >
      <Show when={!props.header.isPlaceholder}>
        <div class={DATA_TABLE_HEAD_INNER_CLASS}>
          <span
            class={`${TABLE_TEXT_ALIGN_CLASS[column().columnDef.meta?.align ?? 'left']}  ${DATA_TABLE_HEAD_LABEL_CLASS}`}
          >
            <FlexRender header={props.header} />
          </span>
          <Show when={column().getCanSort()}>
            <button
              type="button"
              data-slot="data-table-sort-button"
              aria-label={sortLabel()}
              {...ctx.slots.sortButton}
              onClick={(event) => {
                event.stopPropagation()
                column().getToggleSortingHandler()?.(event)
              }}
            >
              <Icon
                name={SORT_ICONS[sorted()]}
                slotName="data-table-sort-icon"
                {...dataTableDataAttributes.sortIcon({ sorted: column().getIsSorted() })}
                {...ctx.slots.sortIcon}
                aria-hidden="true"
              />
            </button>
          </Show>
        </div>
        <Show when={ctx.resizable() && column().getCanResize()}>
          <div
            data-slot="data-table-resizer"
            {...dataTableDataAttributes.resizer({
              resizing: () => column().getIsResizing(),
            })}
            onMouseDown={(event) => props.header.getResizeHandler()(event)}
            onTouchStart={(event) => props.header.getResizeHandler()(event)}
            {...ctx.slotWith('resizer', () => ({
              style: resizerOffset(props.table, props.header),
            }))}
          />
        </Show>
      </Show>
    </th>
  )
}

/** `onEnd` resizing previews the drag by translating the handle until the column commits. */
function resizerOffset<TData extends RowData>(
  table: DataTableT.Instance<TData>,
  header: Header<DataTableFeatures, TData>,
): JSX.CSSProperties | undefined {
  if (table.options.columnResizeMode !== 'onEnd' || !header.column.getIsResizing()) {
    return undefined
  }
  const direction = table.options.columnResizeDirection === 'rtl' ? -1 : 1
  const offset = table.atoms.columnResizing?.get()?.deltaOffset ?? 0
  return { transform: `translateX(${direction * offset}px)` }
}
