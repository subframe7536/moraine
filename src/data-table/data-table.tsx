import type { JSX } from '@solidjs/web'
import { isServer } from '@solidjs/web'
import type { Column, RowData } from '@tanstack/table-core'
import {
  DEV,
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  dynamicComponent,
  onSettled,
  omit,
} from 'solid-js'

import { Icon } from '../components/icon'
import { pickSlotOverrides, useRecipe } from '../provider'
import { useMessages } from '../provider/locale/locale-context'
import { createLazyMemo } from '../shared/create-lazy-memo'
import { renderWithProps } from '../shared/render-with-props'
import { callRef } from '../shared/utils'
import { VISUALLY_HIDDEN_CLASS } from '../theme/recipe-common.recipe'
import type {
  TableVirtualColumnLayout,
  TableVirtualColumnWindow,
  TableVirtualRowProps,
} from '../virtualizer/virtualizer.types'

import { EXPAND_COLUMN_ID, SELECT_COLUMN_ID } from './data-table-columns'
import { DataTableProvider } from './data-table-context'
import type { DataTableFeatures } from './data-table-features'
import { DataTableFooter } from './data-table-footer'
import { DataTableHeader } from './data-table-header'
import { createDataTableLayout } from './data-table-layout'
import { DEFAULT_DATA_TABLE_PAGE_SIZES, DataTablePagination } from './data-table-pagination'
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
 * Data-driven table that renders a `createDataTable` instance; behavior (sorting,
 * row selection, pagination, expansion, column pinning and resizing, server-driven data) lives on
 * the instance and `DataTable` props configure presentation. Prefer the instance's bound
 * `<table.DataTable />` presenter over passing `table` yourself. Use `Table` for a static table
 * you compose by hand, or compose `Table` parts with `FlexRender` for a fully custom grid. Create
 * the instance inside a component and pass a getter for `data` that changes; native `table`
 * attributes such as `aria-label` are forwarded to the `table` element.
 *
 * @example
 * ```tsx
 * import { createDataTable } from 'moraine/data-table'
 * import type { DataTableT } from 'moraine/data-table'
 *
 * interface User {
 *   id: string
 *   name: string
 *   role: string
 * }
 *
 * const users: User[] = [
 *   { id: '1', name: 'Alice', role: 'Engineer' },
 *   { id: '2', name: 'Bob', role: 'Designer' },
 * ]
 *
 * const columns: DataTableT.Column<User>[] = [
 *   { accessorKey: 'name', header: 'Name' },
 *   { accessorKey: 'role', header: 'Role' },
 * ]
 *
 * const table = createDataTable({
 *   data: users,
 *   columns,
 *   getRowId: (user) => user.id,
 *   selectionMode: 'multiple',
 * })
 *
 * <table.DataTable aria-label="Users" />
 * ```
 */
export function DataTable<TData extends RowData = RowData>(
  props: DataTableT.Props<TData>,
): JSX.Element {
  const rest = omit(
    props,
    'table',
    'translations',
    'containerRef',
    'ref',
    'rowProps',
    'headProps',
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
    'highlightOnHover',
    'border',
    'classes',
    'styles',
    'class',
    'style',
  )

  const {
    slots,
    slots: { container: containerSlot, loading: loadingSlot, body: bodySlot, empty: emptySlot },
    slotWith,
  } = useRecipe(dataTableRecipe, props)
  const messages = useMessages('dataTable', defaultDataTableMessages, () => props.translations)
  const [scrollContainer, setScrollContainer] = createSignal<HTMLDivElement>()
  const selectionName = `data-table-selection-${createUniqueId()}`

  const table = () => props.table as DataTableT.Instance<TData>
  const virtual = () => Boolean(props.virtualizer)
  const pagination = () =>
    'paginationSettings' in table() ? table().paginationSettings : undefined
  const paginated = () => !virtual() && pagination()?.paginated === true
  // The virtualizer has a column window only when created with the `columns` option. It is read
  // after mount: the server renders every column, so hydration must start from the same markup.
  const [mounted, setMounted] = createSignal(false)
  onSettled(() => {
    setMounted(true)
  })
  const columnWindow = (): TableVirtualColumnWindow | undefined =>
    mounted() ? props.virtualizer?.columnWindow() : undefined
  const columnVirtual = createMemo(() => columnWindow() !== undefined)
  const layout = createDataTableLayout(
    table,
    () => props.sticky,
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
  const rows = (): Array<DataTableT.Row<TData>> =>
    virtual() ? table().getPrePaginatedRowModel().rows : table().getRowModel().rows

  // A detail row is a second `<tr>` per entry that the virtualizer cannot measure or index,
  // so virtual tables do not render detail rows.
  const expandedRowRender = () => (virtual() ? undefined : props.expandedRowRender)

  if (DEV && !isServer) {
    const warned = new Set<VirtualConflict>()
    // Client-only and transparent so this dev-only owner never occupies a hydration id slot:
    // the server build may or may not be a dev build, and server effects never run anyway.
    createEffect(
      (): Array<VirtualConflict> => {
        if (!virtual()) {
          return []
        }
        const conflicts: Array<VirtualConflict> = []
        if (pagination()?.paginated) {
          conflicts.push('pagination')
        }
        if (props.expandedRowRender) {
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
      { transparent: true },
    )
  }

  const scrollStyle = (): JSX.CSSProperties => {
    if (!props.maxHeight) {
      return {}
    }
    const maxHeight = typeof props.maxHeight === 'number' ? `${props.maxHeight}px` : props.maxHeight
    return { 'max-height': maxHeight, 'overflow-y': 'auto' }
  }

  function RenderEmpty(): JSX.Element {
    const emptyRender = createLazyMemo(() => props.emptyRender)
    return (
      <Show when={!props.loading}>
        <Show when={emptyRender() !== undefined} fallback={messages().empty}>
          {renderWithProps(emptyRender(), {
            get colSpan() {
              return colSpan()
            },
          })}
        </Show>
      </Show>
    )
  }

  function RenderLoading(): JSX.Element {
    const loadingRender = createLazyMemo(() => props.loadingRender)
    return (
      <Show
        when={loadingRender() !== undefined}
        fallback={
          <Icon name="icon-loading" class={DATA_TABLE_LOADING_ICON_CLASS} aria-hidden="true" />
        }
      >
        {renderWithProps(loadingRender(), {
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
        slotOverrides: pickSlotOverrides(props),
        messages,
        virtual,
        paginated,
        columnWindow,
        columnVirtual,
        columnIndex: (columnId) => columnIndexes().get(columnId),
        resizable: layout.resizable,
        colSpan,
        treeColumnId,
        selectionName,
        createColumnPin: layout.createColumnPin,
        createCellSlot: (slot, column, pin, size, section, options) =>
          slotWith(slot, {
            own: () => layout.cellClass(column(), section),
            enforced: () => layout.cellStyle(column(), pin, size),
            data: options?.data,
          }),
        sectionSlot: (section) =>
          slotWith(section, { enforced: () => ({ style: layout.sectionStyle(section) }) }),
      }}
    >
      <div
        ref={(el) => callRef(() => props.containerRef, el)}
        data-slot="data-table-container"
        {...containerSlot}
      >
        {/* Screen readers announce changes inside a live region that already exists, so the
            status stays mounted and only its text follows `loading`. */}
        <span data-slot="data-table-status" role="status" class={VISUALLY_HIDDEN_CLASS}>
          {props.loading ? messages().loading : ''}
        </span>
        <Show when={props.loading}>
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
            aria-busy={props.loading ? 'true' : undefined}
            // Every visible column, including the pinned ones the virtualizer does not count.
            aria-colcount={columnVirtual() ? leafColumns().length : undefined}
            {...rootSlot}
            {...rest}
            ref={props.ref}
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
            <DataTableHeader table={table()} headProps={props.headProps} />

            <tbody data-slot="data-table-body" {...bodySlot}>
              <Show
                when={rows().length > 0}
                fallback={
                  <tr data-slot="data-table-row" {...emptyRowSlot}>
                    <td data-slot="data-table-empty" colspan={colSpan()} {...emptySlot}>
                      <RenderEmpty />
                    </td>
                  </tr>
                }
              >
                <Show
                  when={props.virtualizer}
                  fallback={
                    <For each={rows()}>
                      {(row, index) => (
                        <DataTableRow
                          row={row}
                          index={index()}
                          rowProps={props.rowProps}
                          onRowClick={props.onRowClick}
                          onRowDoubleClick={props.onRowDoubleClick}
                          expandedRowRender={expandedRowRender()}
                        />
                      )}
                    </For>
                  }
                >
                  {(virtualizer) => {
                    const VirtualRows = dynamicComponent(() => virtualizer().virtualRender)
                    return (
                      <VirtualRows
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
                            virtualRowProps={rowProps}
                            rowProps={props.rowProps}
                            onRowClick={props.onRowClick}
                            onRowDoubleClick={props.onRowDoubleClick}
                            expandedRowRender={expandedRowRender()}
                          />
                        )}
                      />
                    )
                  }}
                </Show>
              </Show>
            </tbody>

            <DataTableFooter table={table()} />
          </table>
        </div>

        <DataTablePagination
          table={table()}
          when={paginated()}
          pageSizes={pagination()?.pageSizes ?? DEFAULT_DATA_TABLE_PAGE_SIZES}
          size={props.size}
        />
      </div>
    </DataTableProvider>
  )
}
