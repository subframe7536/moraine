import { FlexRender } from '@tanstack/solid-table'
import type { Header, RowData } from '@tanstack/solid-table'
import type { JSX } from 'solid-js'
import { For, Show, createMemo, createUniqueId } from 'solid-js'

import { Icon } from '../components/icon'
import { TABLE_TEXT_ALIGN_CLASS } from '../components/table/table.recipe'
import { VISUALLY_HIDDEN_CLASS } from '../theme/recipe-common.recipe'

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

const ARIA_SORT = { asc: 'ascending', desc: 'descending' } as const

/** Width change in px per arrow key press on a resize handle; Shift multiplies it. */
const RESIZE_KEYBOARD_STEP = 10
const RESIZE_KEYBOARD_SHIFT_MULTIPLIER = 5
// TanStack's column size bounds when neither the column nor `defaultColumn` sets one.
const DEFAULT_MIN_COLUMN_SIZE = 20
const UNBOUNDED_COLUMN_SIZE = Number.MAX_SAFE_INTEGER

/**
 * Header rows: column labels, sort toggles, and resize handles. Each row renders the start,
 * center, and end pinned regions in turn, so a group header never spans two regions.
 */
export function DataTableHeader<TData extends RowData>(props: {
  table: DataTableT.Instance<TData>
}): JSX.Element {
  const ctx = useDataTableContext()

  return (
    <thead data-slot="data-table-header" {...ctx.sectionSlot('header')}>
      {/* Row count comes from all columns, so it stays correct when one region is empty. */}
      <For each={props.table.getHeaderGroups()}>
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
  // The priority only matters once more than one column is sorted.
  const sortPriority = createMemo((): number | undefined => {
    if ((props.table.atoms.sorting?.get()?.length ?? 0) < 2 || sorted() === 'none') {
      return undefined
    }
    return column().getSortIndex() + 1
  })
  // Controls name their column: `aria-labelledby` joins the header label with the action text.
  const labelId = createUniqueId()
  const sortActionId = createUniqueId()
  const sortPriorityId = createUniqueId()
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
      // Only the sorted header carries `aria-sort`.
      aria-sort={sorted() === 'none' ? undefined : ARIA_SORT[sorted() as 'asc' | 'desc']}
      {...dataTableDataAttributes.head({
        pinned: pin.side,
        pinnedEdge: () => pin.edge() && pin.side(),
      })}
      {...ctx.cellSlot('head', column(), pin, () => props.header.getSize(), 'header')}
    >
      <Show when={!props.header.isPlaceholder}>
        <div class={DATA_TABLE_HEAD_INNER_CLASS}>
          <span
            id={labelId}
            data-slot="data-table-head-label"
            class={`${TABLE_TEXT_ALIGN_CLASS[column().columnDef.meta?.align ?? 'left']}  ${DATA_TABLE_HEAD_LABEL_CLASS}`}
          >
            <FlexRender header={props.header} />
          </span>
          <Show when={column().getCanSort()}>
            <button
              type="button"
              data-slot="data-table-sort-button"
              aria-labelledby={
                sortPriority() === undefined
                  ? `${labelId} ${sortActionId}`
                  : `${labelId} ${sortActionId} ${sortPriorityId}`
              }
              {...ctx.slots.sortButton}
              onClick={(event) => {
                event.stopPropagation()
                column().getToggleSortingHandler()?.(event)
              }}
            >
              <Icon
                name={SORT_ICONS[sorted()]}
                data-slot="data-table-sort-icon"
                {...dataTableDataAttributes.sortIcon({ sorted: column().getIsSorted() })}
                {...ctx.slots.sortIcon}
                aria-hidden="true"
              />
              <span id={sortActionId} class={VISUALLY_HIDDEN_CLASS}>
                {sortLabel()}
              </span>
              <Show when={sortPriority()}>
                {(priority) => (
                  <>
                    <span
                      data-slot="data-table-sort-index"
                      aria-hidden="true"
                      {...ctx.slots.sortIndex}
                    >
                      {priority()}
                    </span>
                    <span id={sortPriorityId} class={VISUALLY_HIDDEN_CLASS}>
                      {ctx.messages().sortPriority({ index: priority() })}
                    </span>
                  </>
                )}
              </Show>
            </button>
          </Show>
        </div>
        {/* A group's width is the sum of its leaves, so only leaf headers resize. */}
        <Show
          when={ctx.resizable() && props.header.subHeaders.length === 0 && column().getCanResize()}
        >
          <DataTableResizer table={props.table} header={props.header} labelId={labelId} />
        </Show>
      </Show>
    </th>
  )
}

/** Column resize handle: pointer drag through TanStack, arrow keys through column sizing. */
function DataTableResizer<TData extends RowData>(props: {
  table: DataTableT.Instance<TData>
  header: Header<DataTableFeatures, TData>
  /** Id of the header label that names the column. */
  labelId: string
}): JSX.Element {
  const ctx = useDataTableContext()
  const actionId = createUniqueId()
  const column = () => props.header.column
  const minSize = () => column().columnDef.minSize ?? DEFAULT_MIN_COLUMN_SIZE
  // `createDataTable` gives resizable columns a finite default `maxSize`, so the separator range
  // contains the current width. Only an explicit unbounded `maxSize` leaves End without a target.
  const maxSize = () => column().columnDef.maxSize ?? UNBOUNDED_COLUMN_SIZE
  const boundedMax = () => (maxSize() < UNBOUNDED_COLUMN_SIZE ? maxSize() : undefined)

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
      aria-labelledby={`${props.labelId} ${actionId}`}
      aria-valuenow={props.header.getSize()}
      aria-valuemin={minSize()}
      aria-valuemax={maxSize()}
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
    >
      <span id={actionId} class={VISUALLY_HIDDEN_CLASS}>
        {ctx.messages().resizeColumn}
      </span>
    </div>
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
