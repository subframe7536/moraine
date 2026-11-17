import type { Cell, CellData, Header, RowData, TableFeatures } from '@tanstack/table-core'
import type { JSX } from 'solid-js'
import { Match, Show, Switch, createComponent } from 'solid-js'

/**
 * Renders a table template value (component, render function, or static JSX element)
 * with the provided props.
 */
export function flexRender<TProps>(
  comp: ((props: TProps) => JSX.Element) | JSX.Element | undefined,
  props: TProps,
): JSX.Element {
  if (comp === null || comp === undefined) {
    return null
  }
  if (typeof comp === 'function') {
    return createComponent(comp, props as any)
  }
  return comp
}

export type FlexRenderProps<
  TFeatures extends TableFeatures,
  TData extends RowData,
  TValue extends CellData = CellData,
> =
  | {
      cell: Cell<TFeatures, TData, TValue>
      header?: never
      footer?: never
    }
  | {
      header: Header<TFeatures, TData, TValue>
      cell?: never
      footer?: never
    }
  | {
      footer: Header<TFeatures, TData, TValue>
      cell?: never
      header?: never
    }

/**
 * Component wrapper of `flexRender` that renders a column's `header`, `cell`, or `footer` template
 * (component, render function, or static JSX) with the right context. Pass exactly one of `cell`,
 * `header`, or `footer`. Use it when composing your own table markup, such as `Table` parts, from
 * a table instance; `DataTable` already renders its headers, cells, and footers with it.
 *
 * @example
 * ```tsx
 * import { For } from 'solid-js'
 * import { Table } from 'moraine'
 * import { FlexRender, createDataTable } from 'moraine/data-table'
 *
 * const table = createDataTable({
 *   data: [{ name: 'Alice' }, { name: 'Bob' }],
 *   columns: [{ accessorKey: 'name', header: 'Name' }],
 * })
 *
 * <Table>
 *   <Table.Header>
 *     <For each={table.getHeaderGroups()}>
 *       {(headerGroup) => (
 *         <Table.Row>
 *           <For each={headerGroup.headers}>
 *             {(header) => (
 *               <Table.Head>
 *                 <FlexRender header={header} />
 *               </Table.Head>
 *             )}
 *           </For>
 *         </Table.Row>
 *       )}
 *     </For>
 *   </Table.Header>
 *   <Table.Body>
 *     <For each={table.getRowModel().rows}>
 *       {(row) => (
 *         <Table.Row>
 *           <For each={row.getVisibleCells()}>
 *             {(cell) => (
 *               <Table.Cell>
 *                 <FlexRender cell={cell} />
 *               </Table.Cell>
 *             )}
 *           </For>
 *         </Table.Row>
 *       )}
 *     </For>
 *   </Table.Body>
 * </Table>
 * ```
 */
export function FlexRender<
  TFeatures extends TableFeatures,
  TData extends RowData,
  TValue extends CellData = CellData,
>(props: FlexRenderProps<TFeatures, TData, TValue>): JSX.Element {
  return (
    <Switch>
      <Match keyed when={'cell' in props && props.cell}>
        {(cell) => {
          const def = cell.column.columnDef
          // The grouping members only exist when the aggregation feature is registered.
          const groupingCell = cell as typeof cell & {
            getIsAggregated?: () => boolean
            getIsPlaceholder?: () => boolean
          }
          const groupingDef = def as typeof def & {
            aggregatedCell?: typeof def.cell
          }
          return (
            <Show
              when={groupingCell.getIsAggregated?.()}
              fallback={
                <Show when={!groupingCell.getIsPlaceholder?.()}>
                  {flexRender(def.cell, cell.getContext())}
                </Show>
              }
            >
              {flexRender(groupingDef.aggregatedCell ?? def.cell, cell.getContext())}
            </Show>
          )
        }}
      </Match>
      <Match keyed when={'header' in props && props.header}>
        {(header) =>
          header.isPlaceholder
            ? null
            : flexRender(header.column.columnDef.header, header.getContext())
        }
      </Match>
      <Match keyed when={'footer' in props && props.footer}>
        {(footer) =>
          footer.isPlaceholder
            ? null
            : flexRender(footer.column.columnDef.footer, footer.getContext())
        }
      </Match>
    </Switch>
  )
}
