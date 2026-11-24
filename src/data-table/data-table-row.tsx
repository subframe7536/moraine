import type { JSX } from '@solidjs/web'
import type { Cell, RowData } from '@tanstack/table-core'
import { For, Show, createMemo, merge, untrack, omit } from 'solid-js'

import { callHandler, callRef } from '../shared/utils'
import type { TableVirtualRowProps } from '../virtualizer/virtualizer.types'

import { useDataTableContext } from './data-table-context'
import { DataTableExpandedRow, createDataTableRowDisclosure } from './data-table-expanded'
import type { DataTableFeatures } from './data-table-features'
import {
  DATA_TABLE_CLICKABLE_ROW_CLASS,
  DATA_TABLE_COLUMN_SPACER_CLASS,
  DATA_TABLE_TREE_ROW_STYLE,
  dataTableDataAttributes,
} from './data-table.recipe'
import type { DataTableT } from './data-table.types'
import { FlexRender } from './flex-render'
export type DataTableRowProps<TData extends RowData> = Pick<
  DataTableT.Base<TData>,
  'rowProps' | 'onRowClick' | 'onRowDoubleClick' | 'expandedRowRender'
> & {
  row: DataTableT.Row<TData>
  index: number
  /** Virtual row wiring (`data-index`, measurement ref, `aria-rowindex`). */
  virtualRowProps?: TableVirtualRowProps
}

/** Body row plus its optional expanded detail row. */
export function DataTableRow<TData extends RowData>(props: DataTableRowProps<TData>): JSX.Element {
  const ctx = useDataTableContext()
  const isSelected = () => props.row.getIsSelected()
  const isExpanded = () => props.row.getIsExpanded()
  // Rows mounted already expanded skip the opening animation.
  const initiallyExpanded = untrack(isExpanded)
  const disclosure = createDataTableRowDisclosure(
    () => Boolean(props.expandedRowRender) && isExpanded(),
  )
  const showsDetail = () => Boolean(props.expandedRowRender) && disclosure.shouldMount()
  const clickable = () => Boolean(props.onRowClick || props.onRowDoubleClick)
  // Sub-rows of tree data indent their tree cell; top-level rows keep the plain cell padding.
  const depth = () => props.row.depth

  // With column virtualization, only the center cells in the window render. TanStack caches a
  // row's cells, so the `For` below keeps mounted cells while the window slides.
  const windowCells = createMemo(() => {
    const window = ctx.columnWindow()
    if (!window) {
      return undefined
    }
    const center = props.row.getCenterVisibleCells()
    return {
      skippedBefore: window.skippedBefore,
      skippedAfter: window.skippedAfter,
      cells: window.items.flatMap((item) => center[item.index] ?? []),
    }
  })

  function BodyCell(cellProps: { cell: Cell<DataTableFeatures, TData> }): JSX.Element {
    const cell = () => cellProps.cell
    const pin = ctx.createColumnPin(() => cell().column)
    const cellSlot = ctx.createCellSlot(
      'cell',
      () => cell().column,
      pin,
      () => cell().column.getSize(),
      'body',
      {
        data: dataTableDataAttributes.cell({
          pinned: pin.side,
          pinnedEdge: () => pin.edge() && pin.side(),
          tree: () => depth() > 0 && cell().column.id === ctx.treeColumnId(),
        }),
      },
    )
    return (
      <td
        data-slot="data-table-cell"
        // Cells are missing from virtualized rows, so each one states its column.
        aria-colindex={ctx.columnVirtual() ? ctx.columnIndex(cell().column.id) : undefined}
        {...cellSlot}
      >
        <FlexRender cell={cell()} />
      </td>
    )
  }

  function Spacer(spacerProps: { span: number }): JSX.Element {
    const spacerSlot = ctx.slotWith('cell', {
      own: () => ({ class: DATA_TABLE_COLUMN_SPACER_CLASS }),
    })
    return (
      <Show when={spacerProps.span > 0}>
        <td
          aria-hidden="true"
          data-slot="data-table-cell-spacer"
          colspan={spacerProps.span}
          {...spacerSlot}
        />
      </Show>
    )
  }

  // `rowProps` runs once per row (and re-runs if `props.rowProps` changes), so it can call
  // row-level hooks without tracking `row` or `index`.
  const extraProps = createMemo(() =>
    props.rowProps?.({
      get row() {
        return props.row
      },
      get index() {
        return props.index
      },
    }),
  )
  const mergedExtra = merge(() => extraProps() ?? {})
  const extraRest = omit(mergedExtra, 'ref', 'onClick', 'onDblClick', 'class')

  const rowSlot = ctx.slotWith('row', {
    own: () => ({
      class: [extraProps()?.class, clickable() && DATA_TABLE_CLICKABLE_ROW_CLASS],
      style:
        depth() > 0
          ? { '--mo-data-table-depth': depth(), ...DATA_TABLE_TREE_ROW_STYLE }
          : undefined,
    }),
    data: dataTableDataAttributes.row({
      selected: isSelected,
      expanded: showsDetail,
      empty: false,
    }),
  })

  // Selection is presentation only: `aria-selected` is not valid on rows of a static table.
  return (
    <>
      <tr
        {...props.virtualRowProps}
        data-slot="data-table-row"
        {...rowSlot}
        {...extraRest}
        ref={(element) =>
          untrack(() => {
            callRef(() => props.virtualRowProps?.ref, element)
            callRef(() => extraProps()?.ref, element)
          })
        }
        onClick={(event) => {
          callHandler(event, extraProps()?.onClick)
          props.onRowClick?.(props.row, event)
        }}
        onDblClick={(event) => {
          callHandler(event, extraProps()?.onDblClick)
          props.onRowDoubleClick?.(props.row, event)
        }}
      >
        <Show
          when={windowCells()}
          fallback={
            <For each={props.row.getVisibleCells()}>{(cell) => <BodyCell cell={cell} />}</For>
          }
        >
          {(window) => (
            <>
              <For each={props.row.getStartVisibleCells()}>
                {(cell) => <BodyCell cell={cell} />}
              </For>
              <Spacer span={window().skippedBefore} />
              <For each={window().cells}>{(cell) => <BodyCell cell={cell} />}</For>
              <Spacer span={window().skippedAfter} />
              <For each={props.row.getEndVisibleCells()}>{(cell) => <BodyCell cell={cell} />}</For>
            </>
          )}
        </Show>
      </tr>
      <Show when={props.expandedRowRender}>
        {(expandedRowRender) => (
          <DataTableExpandedRow
            disclosure={disclosure}
            initiallyExpanded={initiallyExpanded}
            colSpan={ctx.colSpan()}
            row={props.row}
            render={expandedRowRender()}
            slotOverrides={ctx.slotOverrides}
          />
        )}
      </Show>
    </>
  )
}
