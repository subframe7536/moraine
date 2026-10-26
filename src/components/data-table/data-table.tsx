import { FlexRender, createTable } from '@tanstack/solid-table'
import type { Row, RowData, SolidTable, TableFeatures } from '@tanstack/solid-table'
import type { JSX } from 'solid-js'
import { For, Show, createMemo, createSignal, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { pickSlotOverrides, useRecipe } from '../../provider'
import { renderWithProps } from '../../shared/render-with-props'
import { callRef } from '../../shared/utils'
import { Button } from '../button'
import { DropdownMenu } from '../dropdown-menu'
import { Icon } from '../icon'
import { Pagination } from '../pagination'

import { DataTableExpandedRow, createDataTableRowDisclosure } from './data-table-expanded'
import { DataTableSlotsProvider, getDefaultDataTableFeatures } from './data-table-helpers'
import {
  DATA_TABLE_HEAD_INNER_CLASS,
  DATA_TABLE_HEAD_LABEL_CLASS,
  DATA_TABLE_PAGINATION_CONTROLS_CLASS,
  DATA_TABLE_PAGINATION_INFO_CLASS,
  DATA_TABLE_RESIZABLE_CELL_CLASS,
  DATA_TABLE_TEXT_ALIGN_CLASS,
  dataTableDataAttributes,
  dataTableRecipe,
} from './data-table.recipe'
import type { DataTableT } from './data-table.types'

type AnyTable = SolidTable<any, any>

/**
 * Data-driven table presenter powered by TanStack Table v9.
 *
 * Table behavior lives on a `createTable()` instance passed via `table`.
 * When `table` is omitted, an empty table with default features is used.
 * DataTable props are presentation, slots, and render parts only.
 */
export function DataTable<
  TData extends RowData = RowData,
  TFeatures extends TableFeatures = TableFeatures,
>(props: DataTableT.Props<TData, TFeatures>): JSX.Element {
  const [local, rest] = splitProps(props, [
    'containerRef',
    'ref',
    'rowClass',
    'loading',
    'loadingRender',
    'emptyRender',
    'stickyHeader',
    'maxHeight',
    'expandedRowRender',
    'onRowClick',
    'onRowDoubleClick',
    'table',
    'virtualRender',
    'pageSizeOptions',
    'showPageSize',
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
  const slotOverrides = pickSlotOverrides(local)
  const [scrollContainer, setScrollContainer] = createSignal<HTMLDivElement>()

  const fallbackTable = createTable({
    features: getDefaultDataTableFeatures(),
    columns: [],
    data: [],
  })

  const activeTable = (): AnyTable => (local.table as unknown as AnyTable) ?? fallbackTable

  const isVirtualized = () => local.virtualRender !== undefined

  const tableOptions = () =>
    activeTable().options as {
      enableColumnResizing?: boolean
      columnResizeMode?: 'onChange' | 'onEnd'
      columnResizeDirection?: 'ltr' | 'rtl'
    }

  const isResizable = () => tableOptions().enableColumnResizing === true

  const hasPagination = () => !isVirtualized() && typeof activeTable().setPageIndex === 'function'

  const hasPinning = createMemo(() =>
    activeTable()
      .getAllLeafColumns()
      .some((column) => Boolean(column.getIsPinned?.())),
  )

  const activeRows = (): Row<any, TData>[] => activeTable().getRowModel().rows as Row<any, TData>[]

  const leafColCount = (): number => {
    const cols = activeTable().getVisibleLeafColumns()
    return cols.length > 0 ? cols.length : 1
  }

  const pinnedEdge = (col: any): 'start' | 'end' | undefined => {
    const pin = col.getIsPinned?.()
    if (pin === 'start') {
      const startCols = activeTable().getPinnedLeafColumns?.('start') ?? []
      return startCols[startCols.length - 1]?.id === col.id ? 'start' : undefined
    }
    if (pin === 'end') {
      const endCols = activeTable().getPinnedLeafColumns?.('end') ?? []
      return endCols[0]?.id === col.id ? 'end' : undefined
    }
    return undefined
  }

  const paginationState = () => {
    const table = activeTable() as any
    return table.atoms?.pagination?.get?.() ?? table.getState?.()?.pagination
  }

  const currentPageIndex = () => (paginationState()?.pageIndex as number | undefined) ?? 0
  const currentPageSize = () => (paginationState()?.pageSize as number | undefined) ?? 10

  const pageSizeOptions = createMemo((): readonly number[] => {
    const raw = local.pageSizeOptions ?? [5, 10, 20, 50]
    const current = currentPageSize()
    if (!raw.includes(current)) {
      return [...raw, current].sort((a, b) => a - b)
    }
    return raw
  })

  const handlePageSizeChange = (size: number) => {
    activeTable().setPagination?.((prev) => ({ ...prev, pageSize: size, pageIndex: 0 }))
  }

  const handlePageChange = (page: number) => {
    activeTable().setPageIndex?.(page - 1)
  }

  const totalRowCount = () =>
    activeTable().getRowCount?.() ?? activeTable().getRowModel().rows.length

  const hasSelectionColumn = () =>
    activeTable()
      .getAllColumns()
      .some((column) => column.id === 'select')

  function RenderEmpty(): JSX.Element {
    return (
      <Show when={!local.loading}>
        <Show when={local.emptyRender !== undefined} fallback="No results.">
          {renderWithProps(local.emptyRender, {
            get colSpan() {
              return leafColCount()
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
        fallback={<Icon name="icon-loading" class="text-2xl animate-spin" />}
      >
        {renderWithProps(local.loadingRender, {
          get colSpan() {
            return leafColCount()
          },
        })}
      </Show>
    )
  }

  const tableStyle = (): JSX.CSSProperties => {
    if (isResizable() || hasPinning()) {
      return {
        'table-layout': 'fixed',
        width: `${activeTable().getTotalSize()}px`,
        'min-width': '100%',
        ...(hasPinning()
          ? {
              'border-collapse': 'separate',
              'border-spacing': '0',
            }
          : {}),
      }
    }
    return {}
  }

  function RenderRow(rowContext: {
    row: Row<any, TData>
    index: number
    rowProps?: Record<string, any>
  }): JSX.Element {
    const isSelected = () => (rowContext.row as any).getIsSelected?.() ?? false
    const isExpanded = () => (rowContext.row as any).getIsExpanded?.() ?? false
    const initiallyExpanded = isExpanded()
    const disclosure = createDataTableRowDisclosure(
      () => Boolean(local.expandedRowRender) && isExpanded(),
    )
    const showsDetail = () => Boolean(local.expandedRowRender) && disclosure.shouldMount()

    return (
      <>
        <tr
          {...rowContext.rowProps}
          data-slot="data-table-row"
          aria-selected={isSelected()}
          {...dataTableDataAttributes.row({
            selected: isSelected,
            expanded: showsDetail,
            even: () => rowContext.index % 2 === 1,
            empty: false,
          })}
          onClick={(e) => local.onRowClick?.(rowContext.row as any, e)}
          onDblClick={(e) => local.onRowDoubleClick?.(rowContext.row as any, e)}
          {...slotWith('row', () => ({
            class: [
              typeof local.rowClass === 'function'
                ? local.rowClass(rowContext.row as any)
                : local.rowClass,
              Boolean(local.onRowClick || local.onRowDoubleClick) && 'cursor-pointer',
            ],
          }))}
        >
          <For each={(rowContext.row as any).getVisibleCells()}>
            {(cell) => {
              const meta = () => cell.column.columnDef.meta as DataTableT.ColumnMeta | undefined
              const align = (): 'left' | 'center' | 'right' => meta()?.align ?? 'left'
              const truncated = () => meta()?.truncated ?? false
              const pin = () => cell.column.getIsPinned?.()
              const isStart = () => pin() === 'start'
              const isEnd = () => pin() === 'end'
              const shouldSetWidth = () =>
                isResizable() || hasPinning() || cell.column.columnDef.size !== undefined

              return (
                <td
                  data-slot="data-table-cell"
                  {...dataTableDataAttributes.cell({
                    pinned: pin,
                    pinnedEdge: () => pinnedEdge(cell.column),
                  })}
                  {...slotWith('cell', () => ({
                    class: [
                      DATA_TABLE_TEXT_ALIGN_CLASS[align()],
                      truncated() && 'truncate',
                      isResizable() && DATA_TABLE_RESIZABLE_CELL_CLASS,
                      meta()?.class,
                    ],
                    style: {
                      ...(shouldSetWidth() ? { width: `${cell.column.getSize()}px` } : {}),
                      ...(pin()
                        ? {
                            position: 'sticky',
                            left: isStart()
                              ? `${cell.column.getStart?.('start') ?? 0}px`
                              : undefined,
                            right: isEnd() ? `${cell.column.getAfter?.('end') ?? 0}px` : undefined,
                            'z-index': 10,
                          }
                        : {}),
                    },
                  }))}
                >
                  <FlexRender cell={cell} />
                </td>
              )
            }}
          </For>
        </tr>
        <Show when={Boolean(local.expandedRowRender)}>
          <DataTableExpandedRow
            disclosure={disclosure}
            initiallyExpanded={initiallyExpanded}
            colSpan={leafColCount()}
            row={rowContext.row}
            render={(row) => local.expandedRowRender!(row as any)}
            slotOverrides={slotOverrides}
          />
        </Show>
      </>
    )
  }

  const containerStyle = (): JSX.CSSProperties => {
    if (!local.maxHeight) {
      return {}
    }
    const heightVal = typeof local.maxHeight === 'number' ? `${local.maxHeight}px` : local.maxHeight
    return {
      'max-height': heightVal,
      'overflow-y': 'auto',
    }
  }

  return (
    <DataTableSlotsProvider value={{ expandButton: slots.expandButton }}>
      <div
        ref={(el) => {
          setScrollContainer(() => el)
          callRef(local.containerRef, el)
        }}
        data-slot="data-table-container"
        {...slotWith('container', () => ({ style: containerStyle() }))}
      >
        <Show when={local.loading}>
          <div data-slot="data-table-loading" {...slots.loading}>
            <RenderLoading />
          </div>
        </Show>

        <table
          data-slot="data-table"
          {...rest}
          {...slotWith('root', () => ({ style: tableStyle() }))}
          ref={local.ref}
        >
          <thead data-slot="data-table-header" {...slots.header}>
            <For each={activeTable().getHeaderGroups()}>
              {(headerGroup) => (
                <tr data-slot="data-table-row" {...slots.row}>
                  <For each={headerGroup.headers}>
                    {(header) => {
                      const meta = () =>
                        header.column.columnDef.meta as DataTableT.ColumnMeta | undefined
                      const align = (): 'left' | 'center' | 'right' => meta()?.align ?? 'left'
                      const truncated = () => meta()?.truncated ?? false
                      const canSort = () => header.column.getCanSort?.() ?? false
                      const isSorted = () => header.column.getIsSorted?.()
                      const sortIcon = () =>
                        isSorted() === 'asc'
                          ? 'icon-arrow-up'
                          : isSorted() === 'desc'
                            ? 'icon-arrow-down'
                            : 'i-lucide:arrow-up-down'

                      const pin = () => header.column.getIsPinned?.()
                      const isStart = () => pin() === 'start'
                      const isEnd = () => pin() === 'end'
                      const isSticky = () => Boolean(local.stickyHeader || pin())
                      const shouldSetWidth = () =>
                        isResizable() || hasPinning() || header.column.columnDef.size !== undefined

                      return (
                        <th
                          data-slot="data-table-head"
                          colSpan={header.colSpan}
                          aria-sort={
                            isSorted() === 'asc'
                              ? 'ascending'
                              : isSorted() === 'desc'
                                ? 'descending'
                                : canSort()
                                  ? 'none'
                                  : undefined
                          }
                          {...dataTableDataAttributes.head({
                            pinned: pin,
                            pinnedEdge: () => pinnedEdge(header.column),
                          })}
                          {...slotWith('head', () => ({
                            class: [
                              DATA_TABLE_TEXT_ALIGN_CLASS[align()],
                              truncated() && 'truncate',
                              meta()?.class,
                            ],
                            style: {
                              ...(shouldSetWidth() && typeof header.getSize === 'function'
                                ? { width: `${header.getSize()}px` }
                                : {}),
                              ...(isSticky() ? { position: 'sticky' } : {}),
                              ...(local.stickyHeader ? { top: 0 } : {}),
                              ...(isStart()
                                ? { left: `${header.column.getStart?.('start') ?? 0}px` }
                                : {}),
                              ...(isEnd()
                                ? { right: `${header.column.getAfter?.('end') ?? 0}px` }
                                : {}),
                              ...(isSticky()
                                ? { 'z-index': pin() && local.stickyHeader ? 30 : 20 }
                                : {}),
                            },
                          }))}
                        >
                          <Show when={!header.isPlaceholder}>
                            <div class={DATA_TABLE_HEAD_INNER_CLASS}>
                              <span
                                class={`${DATA_TABLE_HEAD_LABEL_CLASS}  ${DATA_TABLE_TEXT_ALIGN_CLASS[align()]}`}
                              >
                                <FlexRender header={header} />
                              </span>
                              <Show when={canSort()}>
                                <button
                                  type="button"
                                  data-slot="data-table-sort-button"
                                  aria-label={
                                    isSorted() === 'asc'
                                      ? 'Sorted ascending'
                                      : isSorted() === 'desc'
                                        ? 'Sorted descending'
                                        : 'Sort'
                                  }
                                  {...slots.sortButton}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    header.column.getToggleSortingHandler?.()?.(e)
                                  }}
                                >
                                  <span
                                    data-slot="data-table-sort-icon"
                                    {...dataTableDataAttributes.sortIcon({ sorted: isSorted })}
                                    {...slots.sortIcon}
                                    aria-hidden="true"
                                  >
                                    <Icon name={sortIcon()} />
                                  </span>
                                </button>
                              </Show>
                            </div>
                            <Show when={isResizable() && (header.column.getCanResize?.() ?? false)}>
                              <div
                                data-slot="data-table-resizer"
                                {...dataTableDataAttributes.resizer({
                                  resizing: () => header.column.getIsResizing?.(),
                                })}
                                onMouseDown={(e) => header.getResizeHandler?.()?.(e)}
                                onTouchStart={(e) => header.getResizeHandler?.()?.(e)}
                                {...slotWith('resizer', () => ({
                                  style:
                                    tableOptions().columnResizeMode === 'onEnd' &&
                                    header.column.getIsResizing?.()
                                      ? {
                                          transform: `translateX(${(tableOptions().columnResizeDirection === 'rtl' ? -1 : 1) * ((activeTable() as any).getState?.().columnResizing?.deltaOffset ?? 0)}px)`,
                                        }
                                      : undefined,
                                }))}
                              />
                            </Show>
                          </Show>
                        </th>
                      )
                    }}
                  </For>
                </tr>
              )}
            </For>
          </thead>

          <tbody data-slot="data-table-body" {...slots.body}>
            <Show
              when={activeRows().length > 0}
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
                  <td data-slot="data-table-empty" colSpan={leafColCount()} {...slots.empty}>
                    <RenderEmpty />
                  </td>
                </tr>
              }
            >
              <Show
                when={local.virtualRender}
                fallback={
                  <For each={activeRows()}>
                    {(row, index) => <RenderRow row={row} index={index()} />}
                  </For>
                }
              >
                {(virtualRender) => (
                  <Dynamic
                    component={virtualRender()}
                    entries={activeRows()}
                    scrollElement={scrollContainer()}
                    render={(row: Row<any, TData>, index: number, rowProps?: any) => (
                      <RenderRow row={row} index={index} rowProps={rowProps} />
                    )}
                  />
                )}
              </Show>
            </Show>
          </tbody>

          <Show
            when={activeTable()
              .getFooterGroups()
              .some((g) => g.headers.some((h) => !h.isPlaceholder && h.column.columnDef.footer))}
          >
            <tfoot data-slot="data-table-footer" {...slots.footer}>
              <For each={activeTable().getFooterGroups()}>
                {(footerGroup) => (
                  <tr data-slot="data-table-row" {...slots.row}>
                    <For each={footerGroup.headers}>
                      {(header) => {
                        const meta = () =>
                          header.column.columnDef.meta as DataTableT.ColumnMeta | undefined
                        const align = (): 'left' | 'center' | 'right' => meta()?.align ?? 'left'
                        const truncated = () => meta()?.truncated ?? false
                        const pin = () => header.column.getIsPinned?.()
                        const isStart = () => pin() === 'start'
                        const isEnd = () => pin() === 'end'
                        const shouldSetWidth = () =>
                          isResizable() ||
                          hasPinning() ||
                          header.column.columnDef.size !== undefined

                        return (
                          <td
                            data-slot="data-table-cell"
                            colSpan={header.colSpan}
                            {...dataTableDataAttributes.cell({
                              pinned: pin,
                              pinnedEdge: () => pinnedEdge(header.column),
                            })}
                            {...slotWith('cell', () => ({
                              class: [
                                DATA_TABLE_TEXT_ALIGN_CLASS[align()],
                                truncated() && 'truncate',
                                meta()?.class,
                              ],
                              style: {
                                ...(shouldSetWidth() && typeof header.getSize === 'function'
                                  ? { width: `${header.getSize()}px` }
                                  : {}),
                                ...(pin()
                                  ? {
                                      position: 'sticky',
                                      left: isStart()
                                        ? `${header.column.getStart?.('start') ?? 0}px`
                                        : undefined,
                                      right: isEnd()
                                        ? `${header.column.getAfter?.('end') ?? 0}px`
                                        : undefined,
                                      'z-index': 10,
                                    }
                                  : {}),
                              },
                            }))}
                          >
                            <Show when={!header.isPlaceholder}>
                              <FlexRender footer={header} />
                            </Show>
                          </td>
                        )
                      }}
                    </For>
                  </tr>
                )}
              </For>
            </tfoot>
          </Show>
        </table>

        <Show when={hasPagination()}>
          <div data-slot="data-table-pagination" {...slots.pagination}>
            <div class={DATA_TABLE_PAGINATION_INFO_CLASS}>
              <Show when={hasSelectionColumn()}>
                {activeTable().getFilteredSelectedRowModel().rows.length} of {totalRowCount()}{' '}
                row(s) selected.
              </Show>
            </div>
            <div class={DATA_TABLE_PAGINATION_CONTROLS_CLASS}>
              <Pagination
                size={local.size}
                page={currentPageIndex() + 1}
                total={totalRowCount()}
                itemsPerPage={currentPageSize()}
                onPageChange={(page) => handlePageChange(page)}
              />
              <Show when={local.showPageSize !== false}>
                <DropdownMenu>
                  <DropdownMenu.Trigger
                    as={Button}
                    variant="outline"
                    size={local.size}
                    trailing="icon-chevron-down"
                  >
                    {currentPageSize()} / page
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content
                    items={pageSizeOptions().map((size) => ({
                      label: `${size} / page`,
                      onSelect: () => handlePageSizeChange(size),
                    }))}
                  />
                </DropdownMenu>
              </Show>
            </div>
          </div>
        </Show>
      </div>
    </DataTableSlotsProvider>
  )
}
