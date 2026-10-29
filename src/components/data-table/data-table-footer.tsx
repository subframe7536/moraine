import { FlexRender } from '@tanstack/solid-table'
import type { RowData } from '@tanstack/solid-table'
import type { JSX } from 'solid-js'
import { For, Show } from 'solid-js'

import { useDataTableContext } from './data-table-context'
import { dataTableDataAttributes } from './data-table.recipe'
import type { DataTableT } from './data-table.types'

/** Footer rows, rendered only when at least one column defines a footer. */
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

  return (
    <Show when={hasFooter()}>
      <tfoot data-slot="data-table-footer" {...ctx.slots.footer}>
        <For each={props.table.getFooterGroups()}>
          {(footerGroup) => (
            <tr data-slot="data-table-row" {...ctx.slots.row}>
              <For each={footerGroup.headers}>
                {(header) => (
                  <td
                    data-slot="data-table-cell"
                    colSpan={header.colSpan}
                    {...dataTableDataAttributes.cell({
                      pinned: () => header.column.getIsPinned(),
                      pinnedEdge: () => ctx.pinnedEdge(header.column),
                    })}
                    {...ctx.cellSlot('cell', header.column, () => header.getSize(), 'footer')}
                  >
                    <Show when={!header.isPlaceholder}>
                      <FlexRender footer={header} />
                    </Show>
                  </td>
                )}
              </For>
            </tr>
          )}
        </For>
      </tfoot>
    </Show>
  )
}
