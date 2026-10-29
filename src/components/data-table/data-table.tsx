import type { RowData } from '@tanstack/solid-table'
import type { JSX } from 'solid-js'
import {
  DEV,
  For,
  Show,
  createEffect,
  createSignal,
  createUniqueId,
  on,
  splitProps,
} from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { pickSlotOverrides, useRecipe } from '../../provider'
import { useMessages } from '../../provider/locale/locale-context'
import { renderWithProps } from '../../shared/render-with-props'
import { callRef } from '../../shared/utils'
import { VISUALLY_HIDDEN_CLASS } from '../../theme/recipe-common.recipe'
import { Icon } from '../icon'
import type { ListT } from '../list'

import { getDataTableConfig } from './create-data-table'
import { DataTableProvider } from './data-table-context'
import { DataTableFooter } from './data-table-footer'
import { DataTableHeader } from './data-table-header'
import { createDataTableLayout } from './data-table-layout'
import { DataTablePagination } from './data-table-pagination'
import { DataTableRow } from './data-table-row'
import { defaultDataTableMessages } from './data-table.messages'
import {
  DATA_TABLE_SCROLL_CLASS,
  dataTableDataAttributes,
  dataTableRecipe,
} from './data-table.recipe'
import type { DataTableT } from './data-table.types'

const VIRTUAL_CONFLICT_WARNINGS = {
  pagination:
    '[moraine] DataTable received both virtualRender and pagination. Pagination is disabled when virtualRender is active.',
  expandedRowRender:
    '[moraine] DataTable received both virtualRender and expandedRowRender. Detail rows are not rendered when virtualRender is active.',
} as const

type VirtualConflict = keyof typeof VIRTUAL_CONFLICT_WARNINGS

/**
 * Data-driven table presenter powered by `createDataTable`.
 *
 * Table behavior and state live on a `createDataTable()` instance passed via `table`.
 * `DataTable` props configure presentation, slots, and render parts.
 */
export function DataTable<TData extends RowData = RowData>(
  props: DataTableT.Props<TData>,
): JSX.Element {
  const [local, rest] = splitProps(props, [
    'table',
    'translations',
    'containerRef',
    'ref',
    'rowClass',
    'loading',
    'loadingRender',
    'emptyRender',
    'sticky',
    'maxHeight',
    'expandedRowRender',
    'onRowClick',
    'onRowDoubleClick',
    'virtualRender',
    'size',
    'striped',
    'hoverEffect',
    'showBorder',
    'classes',
    'styles',
    'class',
    'style',
  ])

  const { slots, slotWith } = useRecipe(dataTableRecipe, local)
  const messages = useMessages('dataTable', defaultDataTableMessages, () => local.translations)
  const [scrollContainer, setScrollContainer] = createSignal<HTMLDivElement>()
  const selectionName = `data-table-selection-${createUniqueId()}`

  const table = () => local.table
  const virtual = () => Boolean(local.virtualRender)
  const layout = createDataTableLayout(table, () => local.sticky)
  const colSpan = () => Math.max(table().getVisibleLeafColumns().length, 1)
  // Virtual tables show every row in one scroll, so they read the rows before pagination.
  // Otherwise `pagination` would still slice the rows while its toolbar is hidden.
  const rows = (): DataTableT.Row<TData>[] =>
    virtual() ? table().getPrePaginatedRowModel().rows : table().getRowModel().rows

  // A detail row is a second `<tr>` per entry that the virtualizer cannot measure or index,
  // so virtual tables do not render detail rows.
  const expandedRowRender = () => (virtual() ? undefined : local.expandedRowRender)

  if (DEV) {
    const warned = new Set<VirtualConflict>()
    createEffect(
      on(
        (): VirtualConflict[] => {
          if (!virtual()) {
            return []
          }
          const conflicts: VirtualConflict[] = []
          if (getDataTableConfig(table()).paginated) {
            conflicts.push('pagination')
          }
          if (local.expandedRowRender) {
            conflicts.push('expandedRowRender')
          }
          return conflicts
        },
        (conflicts) => {
          for (const conflict of conflicts) {
            if (!warned.has(conflict)) {
              warned.add(conflict)
              console.warn(VIRTUAL_CONFLICT_WARNINGS[conflict])
            }
          }
        },
      ),
    )
  }

  const scrollStyle = (): JSX.CSSProperties => {
    if (!local.maxHeight) {
      return {}
    }
    const maxHeight = typeof local.maxHeight === 'number' ? `${local.maxHeight}px` : local.maxHeight
    return { 'max-height': maxHeight, 'overflow-y': 'auto' }
  }

  function RenderEmpty(): JSX.Element {
    return (
      <Show when={!local.loading}>
        <Show when={local.emptyRender !== undefined} fallback={messages().empty}>
          {renderWithProps(local.emptyRender, {
            get colSpan() {
              return colSpan()
            },
          })}
        </Show>
      </Show>
    )
  }

  function RenderLoading(): JSX.Element {
    return (
      <Show
        when={local.loadingRender !== undefined}
        fallback={
          <>
            <Icon name="icon-loading" class="text-2xl animate-spin" aria-hidden="true" />
            <span class={VISUALLY_HIDDEN_CLASS}>{messages().loading}</span>
          </>
        }
      >
        {renderWithProps(local.loadingRender, {
          get colSpan() {
            return colSpan()
          },
        })}
      </Show>
    )
  }

  return (
    <DataTableProvider
      value={{
        slots,
        slotWith,
        slotOverrides: pickSlotOverrides(local),
        messages,
        virtual,
        resizable: layout.resizable,
        colSpan,
        selectionName,
        columnPin: layout.columnPin,
        cellSlot: (slot, column, pin, size, section) =>
          slotWith(
            slot,
            () => layout.cellClass(column, section),
            () => layout.cellStyle(column, pin, size, section),
          ),
      }}
    >
      <div
        ref={(el) => callRef(local.containerRef, el)}
        data-slot="data-table-container"
        {...slots.container}
      >
        <Show when={local.loading}>
          <div data-slot="data-table-loading" role="status" {...slots.loading}>
            <RenderLoading />
          </div>
        </Show>

        <div
          ref={(el) => setScrollContainer(() => el)}
          data-slot="data-table-scroll"
          class={DATA_TABLE_SCROLL_CLASS}
          style={scrollStyle()}
        >
          <table
            data-slot="data-table"
            aria-busy={local.loading || undefined}
            {...rest}
            {...slotWith('root', () => ({ style: layout.tableStyle() }))}
            ref={local.ref}
          >
            <DataTableHeader table={table()} />

            <tbody data-slot="data-table-body" {...slots.body}>
              <Show
                when={rows().length > 0}
                fallback={
                  <tr
                    data-slot="data-table-row"
                    {...dataTableDataAttributes.row({
                      selected: false,
                      expanded: false,
                      even: false,
                      empty: true,
                    })}
                    {...slots.row}
                  >
                    <td data-slot="data-table-empty" colSpan={colSpan()} {...slots.empty}>
                      <RenderEmpty />
                    </td>
                  </tr>
                }
              >
                <Show
                  when={local.virtualRender}
                  fallback={
                    <For each={rows()}>
                      {(row, index) => (
                        <DataTableRow
                          row={row}
                          index={index()}
                          rowClass={local.rowClass}
                          onRowClick={local.onRowClick}
                          onRowDoubleClick={local.onRowDoubleClick}
                          expandedRowRender={expandedRowRender()}
                        />
                      )}
                    </For>
                  }
                >
                  {(virtualRender) => (
                    <Dynamic
                      component={virtualRender()}
                      entries={rows()}
                      scrollElement={scrollContainer()}
                      render={(
                        row: DataTableT.Row<TData>,
                        index: number,
                        rowProps?: ListT.RowProps<HTMLTableRowElement>,
                      ) => (
                        <DataTableRow
                          row={row}
                          index={index}
                          rowProps={rowProps}
                          rowClass={local.rowClass}
                          onRowClick={local.onRowClick}
                          onRowDoubleClick={local.onRowDoubleClick}
                          expandedRowRender={expandedRowRender()}
                        />
                      )}
                    />
                  )}
                </Show>
              </Show>
            </tbody>

            <DataTableFooter table={table()} />
          </table>
        </div>

        <DataTablePagination
          table={table()}
          when={!virtual() && getDataTableConfig(table()).paginated}
          size={local.size}
        />
      </div>
    </DataTableProvider>
  )
}
