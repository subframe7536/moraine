import type { Accessor, JSX } from 'solid-js'
import { For, Show, createMemo } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createContextProvider } from '../../shared/create-context-provider'
import type { TableVirtualColumnWindow } from '../../shared/virtual'

import { useTablePart } from './table-part'
import { TABLE_COLUMN_SPACER_CLASS } from './table.recipe'
import type { TableT } from './table.types'

interface TableVirtualRowsContext {
  readonly columns: Accessor<readonly unknown[]>
  readonly columnWindow: Accessor<TableVirtualColumnWindow | undefined>
  readonly columnIndexStart: Accessor<number>
}

const [TableVirtualRowsProvider, useTableVirtualRowsContext] =
  /* @__PURE__ */ createContextProvider<TableVirtualRowsContext>('TableVirtualRows')

/**
 * Renders the visible rows of `items` inside `Table.Body`. It replaces the body's rows: the
 * virtualizer pads the body with two hidden spacer rows, so the body holds nothing else.
 */
export function TableVirtualRows<TItem, TColumn = unknown>(
  props: TableT.VirtualRowsProps<TItem, TColumn>,
): JSX.Element {
  return (
    <TableVirtualRowsProvider
      value={{
        columns: () => props.columns ?? [],
        columnWindow: () => props.virtualizer.columnWindow(),
        columnIndexStart: () => props.columnIndexStart ?? 1,
      }}
    >
      <Dynamic
        component={props.virtualizer.virtualRender}
        entries={props.items}
        scrollElement={props.scrollElement}
        columns={props.columns}
        columnSize={props.columnSize}
        columnLayout={props.columnLayout}
        render={(item, index, rowProps) => (
          <Dynamic component={props.itemRender} item={item} index={index} props={rowProps} />
        )}
      />
    </TableVirtualRowsProvider>
  )
}

/**
 * Renders the cells of one virtual row for the `columns` of `Table.VirtualRows`. With column
 * virtualization, only the visible columns render, between placeholder cells for the skipped
 * ones; otherwise every column renders.
 */
export function TableVirtualCells<TColumn = unknown>(
  props: TableT.VirtualCellsProps<TColumn>,
): JSX.Element {
  const context = useTableVirtualRowsContext()
  const columns = () => context.columns() as readonly TColumn[]
  // Indexes are primitives, so `For` keeps the mounted cells while the window slides.
  const indexes = createMemo(() => {
    const window = context.columnWindow()
    return window ? window.items.map((item) => item.index) : columns().map((_, index) => index)
  })

  function Cell(cellProps: { index: number }): JSX.Element {
    return (
      <Show when={columns()[cellProps.index]}>
        {(column) => (
          <Dynamic
            component={props.itemRender}
            column={column()}
            index={cellProps.index}
            props={{ 'aria-colindex': cellProps.index + context.columnIndexStart() }}
          />
        )}
      </Show>
    )
  }

  return (
    <>
      <TableVirtualSpacer span={context.columnWindow()?.skippedBefore ?? 0} />
      <For each={indexes()}>{(index) => <Cell index={index} />}</For>
      <TableVirtualSpacer span={context.columnWindow()?.skippedAfter ?? 0} />
    </>
  )
}

/** Placeholder cell spanning skipped columns; it keeps the row's borders and background. */
function TableVirtualSpacer(props: { span: number }): JSX.Element {
  const slots = useTablePart('cell', { class: TABLE_COLUMN_SPACER_CLASS })
  return (
    <Show when={props.span > 0}>
      <td aria-hidden="true" data-slot="table-cell-spacer" colSpan={props.span} {...slots.cell} />
    </Show>
  )
}
