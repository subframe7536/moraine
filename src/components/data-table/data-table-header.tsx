import { FlexRender } from '@tanstack/solid-table'
import type { Header, RowData } from '@tanstack/solid-table'
import type { JSX } from 'solid-js'
import { For, Show, createMemo } from 'solid-js'

import { Icon } from '../icon'
import { TABLE_TEXT_ALIGN_CLASS } from '../table/table.recipe'

import { useDataTableContext } from './data-table-context'
import type { DataTableFeatures } from './data-table-features'
import { DATA_TABLE_PIN_SIDES, createHeaderPin, pinnedHeaderGroups } from './data-table-layout'
import type { DataTablePinSide } from './data-table-layout'
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

/** Width change in px per arrow key press on a resize handle; Shift multiplies it. */
const RESIZE_KEYBOARD_STEP = 10
const RESIZE_KEYBOARD_SHIFT_MULTIPLIER = 5
// TanStack's column size bounds when a column definition sets none.
const DEFAULT_MIN_COLUMN_SIZE = 20
const DEFAULT_MAX_COLUMN_SIZE = Number.MAX_SAFE_INTEGER

/**
 * Header rows: column labels, sort toggles, and resize handles. Each row renders the start,
 * center, and end pinned regions in turn, so a group header never spans two regions.
 */
export function DataTableHeader<TData extends RowData>(props: {
  table: DataTableT.Instance<TData>
}): JSX.Element {
  const ctx = useDataTableContext()

  return (
    <thead data-slot="data-table-header" {...ctx.slots.header}>
      <For each={props.table.getCenterHeaderGroups()}>
        {(_, depth) => (
          <tr data-slot="data-table-row" {...ctx.slots.row}>
            <For each={DATA_TABLE_PIN_SIDES}>
              {(side) => (
                <For each={pinnedHeaderGroups(props.table, 'header', side)[depth()]?.headers}>
                  {(header) => (
                    <DataTableHeadCell table={props.table} header={header} side={side} />
                  )}
                </For>
              )}
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
  side: DataTablePinSide
}): JSX.Element {
  const ctx = useDataTableContext()
  const column = () => props.header.column
  const pin = createHeaderPin(
    () => props.header,
    () => props.side,
  )
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
        pinned: pin.side,
        pinnedEdge: () => pin.edge() && pin.side(),
      })}
      {...ctx.cellSlot('head', column(), pin, () => props.header.getSize(), 'header')}
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
          <DataTableResizer table={props.table} header={props.header} />
        </Show>
      </Show>
    </th>
  )
}

/** Column resize handle: pointer drag through TanStack, arrow keys through column sizing. */
function DataTableResizer<TData extends RowData>(props: {
  table: DataTableT.Instance<TData>
  header: Header<DataTableFeatures, TData>
}): JSX.Element {
  const ctx = useDataTableContext()
  const column = () => props.header.column
  const minSize = () => column().columnDef.minSize ?? DEFAULT_MIN_COLUMN_SIZE
  const maxSize = () => column().columnDef.maxSize ?? DEFAULT_MAX_COLUMN_SIZE
  const boundedMax = () => (maxSize() < DEFAULT_MAX_COLUMN_SIZE ? maxSize() : undefined)

  const resizeTo = (size: number) => {
    const next = Math.min(Math.max(size, minSize()), maxSize())
    const id = column().id
    props.table.setColumnSizing((sizing) => ({ ...sizing, [id]: next }))
  }

  return (
    <div
      data-slot="data-table-resizer"
      role="separator"
      aria-orientation="vertical"
      aria-label={ctx.messages().resizeColumn}
      aria-valuenow={props.header.getSize()}
      aria-valuemin={minSize()}
      aria-valuemax={boundedMax()}
      tabIndex={0}
      {...dataTableDataAttributes.resizer({
        resizing: () => column().getIsResizing(),
      })}
      onMouseDown={(event) => props.header.getResizeHandler()(event)}
      onTouchStart={(event) => props.header.getResizeHandler()(event)}
      onKeyDown={(event) => {
        const target = resizeKeyTarget(event, {
          size: props.header.getSize(),
          min: minSize(),
          max: boundedMax(),
          rtl: props.table.options.columnResizeDirection === 'rtl',
        })
        if (target !== undefined) {
          event.preventDefault()
          event.stopPropagation()
          resizeTo(target)
        }
      }}
      onClick={(event) => event.stopPropagation()}
      {...ctx.slotWith('resizer', () => ({
        style: resizerOffset(props.table, props.header),
      }))}
    />
  )
}

/** Target width for a resize key, or `undefined` when the key does not resize. */
function resizeKeyTarget(
  event: KeyboardEvent,
  column: { size: number; min: number; max: number | undefined; rtl: boolean },
): number | undefined {
  if (event.key === 'Home') {
    return column.min
  }
  if (event.key === 'End') {
    return column.max
  }
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
    return undefined
  }
  const step = RESIZE_KEYBOARD_STEP * (event.shiftKey ? RESIZE_KEYBOARD_SHIFT_MULTIPLIER : 1)
  // In right-to-left resizing, the handle sits on the left edge, so arrows swap meaning.
  const direction = column.rtl ? -1 : 1
  return column.size + (event.key === 'ArrowRight' ? step : -step) * direction
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
