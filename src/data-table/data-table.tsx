import type { Column, RowData } from '@tanstack/solid-table'
import type { JSX } from 'solid-js'
import {
  DEV,
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  on,
  onMount,
  splitProps,
} from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Icon } from '../components/icon'
import { pickSlotOverrides, useRecipe } from '../provider'
import { useMessages } from '../provider/locale/locale-context'
import { renderWithProps } from '../shared/render-with-props'
import { callRef } from '../shared/utils'
import { VISUALLY_HIDDEN_CLASS } from '../theme/recipe-common.recipe'
import type {
  TableVirtualColumnLayout,
  TableVirtualColumnWindow,
  TableVirtualRowProps,
} from '../virtualizer/virtualizer.types'

import { getDataTableConfig } from './create-data-table'
import { EXPAND_COLUMN_ID, SELECT_COLUMN_ID } from './data-table-columns'
import { DataTableProvider } from './data-table-context'
import type { DataTableFeatures } from './data-table-features'
import { DataTableFooter } from './data-table-footer'
import { DataTableHeader } from './data-table-header'
import { createDataTableLayout } from './data-table-layout'
import { DataTablePagination } from './data-table-pagination'
import { DataTableRow } from './data-table-row'
import { defaultDataTableMessages } from './data-table.messages'
import {
  DATA_TABLE_LOADING_ICON_CLASS,
  DATA_TABLE_SCROLL_CLASS,
  dataTableDataAttributes,
  dataTableRecipe,
} from './data-table.recipe'
import type { DataTableT } from './data-table.types'

const VIRTUAL_CONFLICT_WARNINGS = {
  pagination:
    '[moraine] DataTable received both virtualizer and pagination. Pagination is disabled when virtualizer is set.',
  expandedRowRender:
    '[moraine] DataTable received both virtualizer and expandedRowRender. Detail rows are not rendered when virtualizer is set.',
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
    'virtualizer',
    'size',
    'hoverEffect',
    'showBorder',
    'classes',
    'styles',
    'class',
    'style',
  ])

  const {
    slots,
    slots: { container: containerSlot, loading: loadingSlot, body: bodySlot, empty: emptySlot },
    slotWith,
  } = useRecipe(dataTableRecipe, local)
  const messages = useMessages('dataTable', defaultDataTableMessages, () => local.translations)
  const [scrollContainer, setScrollContainer] = createSignal<HTMLDivElement>()
  const selectionName = `data-table-selection-${createUniqueId()}`

  const table = () => local.table
  const virtual = () => Boolean(local.virtualizer)
  // The virtualizer has a column window only when created with the `columns` option. It is read
  // after mount: the server renders every column, so hydration must start from the same markup.
  const [mounted, setMounted] = createSignal(false)
  onMount(() => setMounted(true))
  const columnWindow = (): TableVirtualColumnWindow | undefined =>
    mounted() ? local.virtualizer?.columnWindow() : undefined
  const columnVirtual = createMemo(() => columnWindow() !== undefined)
  const layout = createDataTableLayout(
    table,
    () => local.sticky,
    () => columnVirtual(),
  )
  const colSpan = () => Math.max(table().getVisibleLeafColumns().length, 1)
  // Visible leaf columns in visual order: start-pinned, center, then end-pinned.
  const leafColumns = createMemo(() => {
    const instance = table()
    return [
      ...instance.getStartVisibleLeafColumns(),
      ...instance.getCenterVisibleLeafColumns(),
      ...instance.getEndVisibleLeafColumns(),
    ]
  })
  const treeColumnId = createMemo(
    () =>
      leafColumns().find(
        (column) => column.id !== SELECT_COLUMN_ID && column.id !== EXPAND_COLUMN_ID,
      )?.id,
  )
  const columnIndexes = createMemo(
    () => new Map(leafColumns().map((column, index) => [column.id, index + 1])),
  )
  // Pinned columns stay rendered around the virtualized center columns.
  const columnLayout = createMemo((): TableVirtualColumnLayout => {
    const start = table().getStartTotalSize()
    return {
      scrollMargin: start,
      scrollPaddingStart: start,
      scrollPaddingEnd: table().getEndTotalSize(),
    }
  })
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
          <Icon name="icon-loading" class={DATA_TABLE_LOADING_ICON_CLASS} aria-hidden="true" />
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

  const rootSlot = slotWith('root', { own: () => ({ style: layout.tableStyle() }) })
  const emptyRowSlot = slotWith('row', {
    data: dataTableDataAttributes.row({ selected: false, expanded: false, empty: true }),
  })

  return (
    <DataTableProvider
      value={{
        slots,
        slotWith,
        slotOverrides: pickSlotOverrides(local),
        messages,
        virtual,
        paginated: () => !virtual() && getDataTableConfig(table()).paginated,
        columnWindow,
        columnVirtual,
        columnIndex: (columnId) => columnIndexes().get(columnId),
        resizable: layout.resizable,
        colSpan,
        treeColumnId,
        selectionName,
        createColumnPin: layout.createColumnPin,
        cellSlot: (slot, column, pin, size, section, options) =>
          slotWith(slot, {
            own: () => layout.cellClass(column, section),
            enforced: () => layout.cellStyle(column, pin, size),
            data: options?.data,
          }),
        sectionSlot: (section) =>
          slotWith(section, { enforced: () => ({ style: layout.sectionStyle(section) }) }),
      }}
    >
      <div
        ref={(el) => callRef(local.containerRef, el)}
        data-slot="data-table-container"
        {...containerSlot}
      >
        {/* Screen readers announce changes inside a live region that already exists, so the
            status stays mounted and only its text follows `loading`. */}
        <span data-slot="data-table-status" role="status" class={VISUALLY_HIDDEN_CLASS}>
          {local.loading ? messages().loading : ''}
        </span>
        <Show when={local.loading}>
          <div data-slot="data-table-loading" {...loadingSlot}>
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
            // Every visible column, including the pinned ones the virtualizer does not count.
            aria-colcount={columnVirtual() ? leafColumns().length : undefined}
            {...rootSlot}
            {...rest}
            ref={local.ref}
          >
            {/* A fixed layout takes widths from the first row, which is a group header when
                columns are grouped, and virtualized body rows skip cells. Leaf widths come from
                here instead. */}
            <Show when={layout.fixedLayout()}>
              <colgroup>
                <For each={leafColumns()}>
                  {(column) => <col style={{ width: `${column.getSize()}px` }} />}
                </For>
              </colgroup>
            </Show>
            <DataTableHeader table={table()} />

            <tbody data-slot="data-table-body" {...bodySlot}>
              <Show
                when={rows().length > 0}
                fallback={
                  <tr data-slot="data-table-row" {...emptyRowSlot}>
                    <td data-slot="data-table-empty" colSpan={colSpan()} {...emptySlot}>
                      <RenderEmpty />
                    </td>
                  </tr>
                }
              >
                <Show
                  when={local.virtualizer}
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
                  {(virtualizer) => (
                    <Dynamic
                      component={virtualizer().virtualRender}
                      entries={rows()}
                      scrollElement={scrollContainer()}
                      columns={table().getCenterVisibleLeafColumns()}
                      // These are the `columns` passed above.
                      columnSize={(column: unknown) =>
                        (column as Column<DataTableFeatures, TData>).getSize()
                      }
                      columnLayout={columnLayout()}
                      render={(
                        row: DataTableT.Row<TData>,
                        index: number,
                        rowProps: TableVirtualRowProps,
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
