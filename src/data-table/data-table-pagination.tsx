import type { RowData } from '@tanstack/solid-table'
import type { JSX } from 'solid-js'
import { Show, createMemo } from 'solid-js'

import { Button } from '../components/button'
import { DropdownMenu } from '../components/dropdown-menu'
import { Pagination } from '../components/pagination'

import { getDataTableConfig } from './create-data-table'
import { useDataTableContext } from './data-table-context'
import {
  DATA_TABLE_PAGINATION_CONTROLS_CLASS,
  DATA_TABLE_PAGINATION_INFO_CLASS,
} from './data-table.recipe'
import type { DataTableT } from './data-table.types'

/** Pagination toolbar: row or selection summary, page navigation, and page-size menu. */
export function DataTablePagination<TData extends RowData>(props: {
  table: DataTableT.Instance<TData>
  /** Whether the toolbar is shown. Virtual tables never paginate. */
  when: boolean
  size: DataTableT.Props['size']
}): JSX.Element {
  const ctx = useDataTableContext()
  const config = () => getDataTableConfig(props.table)

  // Row-model reads stay in memos owned outside the toolbar's <Show>. The options that toggle
  // pagination also invalidate these row models; when the toolbar's own computations read them
  // directly, Solid can dispose the toolbar in the middle of that same update and throw from
  // `cleanNode`.
  const rowCount = createMemo(() => props.table.getRowCount())
  const selectedCount = createMemo(() => props.table.getFilteredSelectedRowModel().rows.length)
  const pagination = () => props.table.atoms.pagination?.get()
  const pageIndex = () => pagination()?.pageIndex ?? 0
  const pageSize = () => pagination()?.pageSize ?? 10

  const pageSizeChoices = createMemo((): readonly number[] | false => {
    const choices = config().pageSizes
    if (choices === false || choices.includes(pageSize())) {
      return choices
    }
    return [...choices, pageSize()].sort((a, b) => a - b)
  })

  return (
    <Show when={props.when}>
      <div data-slot="data-table-pagination" {...ctx.slots.pagination}>
        <div class={DATA_TABLE_PAGINATION_INFO_CLASS}>
          {selectedCount() > 0
            ? ctx.messages().selectedCount({ selected: selectedCount(), total: rowCount() })
            : ctx.messages().rowCount({ total: rowCount() })}
        </div>
        <div class={DATA_TABLE_PAGINATION_CONTROLS_CLASS}>
          <Pagination
            size={props.size}
            page={pageIndex() + 1}
            total={rowCount()}
            itemsPerPage={pageSize()}
            onPageChange={(page) => props.table.setPageIndex(page - 1)}
          />
          <Show when={pageSizeChoices()}>
            {(choices) => (
              <DropdownMenu>
                <DropdownMenu.Trigger
                  as={Button}
                  variant="outline"
                  size={props.size}
                  trailing="icon-chevron-down"
                >
                  {ctx.messages().pageSize({ size: pageSize() })}
                </DropdownMenu.Trigger>
                <DropdownMenu.Content
                  items={choices().map((size) => ({
                    label: ctx.messages().pageSize({ size }),
                    onSelect: () =>
                      props.table.setPagination((prev) => ({
                        ...prev,
                        pageSize: size,
                        pageIndex: 0,
                      })),
                  }))}
                />
              </DropdownMenu>
            )}
          </Show>
        </div>
      </div>
    </Show>
  )
}
