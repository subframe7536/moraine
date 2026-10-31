import { FlexRender } from '@tanstack/solid-table'
import type { RowData } from '@tanstack/solid-table'
import type { JSX } from 'solid-js'
import { For, Show } from 'solid-js'

import { useDataTableContext } from './data-table-context'
import { DATA_TABLE_PIN_SIDES, createHeaderPin, pinnedHeaderGroups } from './data-table-layout'
import { dataTableDataAttributes } from './data-table.recipe'
import type { DataTableT } from './data-table.types'

/**
 * Footer rows, rendered only when at least one column defines a footer. Like the header, each
 * row renders the start, center, and end pinned regions in turn.
 */
export function DataTableFooter<TData extends RowData>(props: {
  table: DataTableT.Instance<TData>
}): JSX.Element {
  const ctx = useDataTableContext()
  const hasFooter = () =>
    props.table
      .getFooterGroups()
      .some((group) =>
        group.headers.some((header) => !header.isPlaceholder && header.column.columnDef.footer),
      )

  const footerSlot = ctx.sectionSlot('footer')

  return (
    <Show when={hasFooter()}>
      <tfoot data-slot="data-table-footer" {...footerSlot}>
        {/* Row count comes from all columns, so it stays correct when one region is empty. */}
        <For each={props.table.getFooterGroups()}>
          {(_, depth) => (
            <tr data-slot="data-table-row" {...ctx.slots.row}>
              <For each={DATA_TABLE_PIN_SIDES}>
                {(side) => (
                  <For each={pinnedHeaderGroups(props.table, 'footer', side)[depth()]?.headers}>
                    {(header) => {
                      const pin = createHeaderPin(
                        () => header,
                        () => side,
                      )
                      const cellSlot = ctx.cellSlot(
                        'cell',
                        header.column,
                        pin,
                        () => header.getSize(),
                        'footer',
                        {
                          data: dataTableDataAttributes.cell({
                            pinned: pin.side,
                            pinnedEdge: () => pin.edge() && pin.side(),
                            tree: false,
                          }),
                        },
                      )
                      return (
                        <td data-slot="data-table-cell" colSpan={header.colSpan} {...cellSlot}>
                          <Show when={!header.isPlaceholder}>
                            <FlexRender footer={header} />
                          </Show>
                        </td>
                      )
                    }}
                  </For>
                )}
              </For>
            </tr>
          )}
        </For>
      </tfoot>
    </Show>
  )
}
