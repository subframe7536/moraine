import { FlexRender } from '@tanstack/solid-table'
import type { Column, RowData } from '@tanstack/solid-table'
import type { JSX } from 'solid-js'
import { DEV, For, Show, createEffect, createMemo, createSignal, on, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { pickSlotOverrides, useRecipe } from '../../provider'
import { useMessages } from '../../provider/locale/locale-context'
import { renderWithProps } from '../../shared/render-with-props'
import { callRef } from '../../shared/utils'
import { Button } from '../button'
import { DropdownMenu } from '../dropdown-menu'
import { Icon } from '../icon'
import type { ListT } from '../list'
import { Pagination } from '../pagination'

import { getDataTableConfig } from './create-data-table'
import { DataTableInternalProvider } from './data-table-columns'
import { DataTableExpandedRow, createDataTableRowDisclosure } from './data-table-expanded'
import type { DataTableFeatures } from './data-table-features'
import { defaultDataTableMessages } from './data-table.messages'
import {
  DATA_TABLE_HEAD_INNER_CLASS,
  DATA_TABLE_HEAD_LABEL_CLASS,
  DATA_TABLE_PAGINATION_CONTROLS_CLASS,
  DATA_TABLE_PAGINATION_INFO_CLASS,
  DATA_TABLE_RESIZABLE_CELL_CLASS,
  DATA_TABLE_SCROLL_CLASS,
  DATA_TABLE_STICKY_FOOTER_CELL_CLASS,
  DATA_TABLE_TEXT_ALIGN_CLASS,
  dataTableDataAttributes,
  dataTableRecipe,
} from './data-table.recipe'
import type { DataTableT } from './data-table.types'

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
  const slotOverrides = pickSlotOverrides(local)
  const messages = useMessages('dataTable', defaultDataTableMessages, () => local.translations)
  const [scrollContainer, setScrollContainer] = createSignal<HTMLDivElement>()

  const activeTable = () => local.table
  const tableConfig = () => getDataTableConfig(activeTable())
  const tableOptions = () => activeTable().options

  const isResizable = () => tableOptions().enableColumnResizing === true
  const isStickyHeader = () => local.sticky === true || local.sticky === 'header'
  const isStickyFooter = () => local.sticky === true || local.sticky === 'footer'
  const hasPagination = () => !local.virtualRender && tableConfig().paginated

  if (DEV) {
    let warnedVirtualPagination = false
    createEffect(
      on(
        () => [Boolean(local.virtualRender), tableConfig().paginated] as const,
        ([isVirtual, isPaginated]) => {
          if (isVirtual && isPaginated && !warnedVirtualPagination) {
            warnedVirtualPagination = true
            console.warn(
              '[moraine] DataTable received both virtualRender and pagination. Pagination is disabled when virtualRender is active.',
            )
          }
        },
      ),
    )
  }

  const hasPinning = createMemo(() =>
    activeTable()
      .getAllLeafColumns()
      .some((column) => Boolean(column.getIsPinned())),
  )

  const activeRows = (): DataTableT.Row<TData>[] => activeTable().getRowModel().rows

  const leafColCount = (): number => {
    const cols = activeTable().getVisibleLeafColumns()
    return cols.length > 0 ? cols.length : 1
  }

  const pinnedEdge = (col: Column<DataTableFeatures, TData>): 'start' | 'end' | undefined => {
    const pin = col.getIsPinned()
    if (pin === 'start') {
      const startCols = activeTable().getPinnedLeafColumns('start')
      return startCols[startCols.length - 1]?.id === col.id ? 'start' : undefined
    }
    if (pin === 'end') {
      const endCols = activeTable().getPinnedLeafColumns('end')
      return endCols[0]?.id === col.id ? 'end' : undefined
    }
    return undefined
  }

  const paginationState = () => activeTable().atoms.pagination?.get()
  const currentPageIndex = () => paginationState()?.pageIndex ?? 0
  const currentPageSize = () => paginationState()?.pageSize ?? 10

  const pageSizeChoices = createMemo((): readonly number[] | false => {
    const raw = tableConfig().pageSizes
    if (raw === false) {
      return false
    }
    const current = currentPageSize()
    if (!raw.includes(current)) {
      return [...raw, current].sort((a, b) => a - b)
    }
    return raw
  })

  const handlePageSizeChange = (size: number) => {
    activeTable().setPagination((prev) => ({ ...prev, pageSize: size, pageIndex: 0 }))
  }

  const handlePageChange = (page: number) => {
    activeTable().setPageIndex(page - 1)
  }

  const totalRowCount = () => activeTable().getRowCount()
  const hasSelectionSummary = () => tableConfig().hasSelection

  function buildCellPresentation(
    col: Column<DataTableFeatures, TData>,
    getWidth: () => number,
    options?: { isHeader?: boolean; isFooter?: boolean; isResizableCell?: boolean },
  ): { class: unknown[]; style: JSX.CSSProperties } {
    const meta = col.columnDef.meta
    const align = meta?.align ?? 'left'
    const pin = col.getIsPinned()
    const isStart = pin === 'start'
    const isEnd = pin === 'end'
    const isHeader = options?.isHeader === true
    const isFooter = options?.isFooter === true
    const sticksToEdge = (isHeader && isStickyHeader()) || (isFooter && isStickyFooter())
    const isSticky = Boolean(sticksToEdge || pin)
    const shouldSetWidth = isResizable() || hasPinning() || col.columnDef.size !== undefined

    return {
      class: [
        DATA_TABLE_TEXT_ALIGN_CLASS[align],
        meta?.truncated && 'truncate',
        options?.isResizableCell && isResizable() && DATA_TABLE_RESIZABLE_CELL_CLASS,
        isFooter && isStickyFooter() && DATA_TABLE_STICKY_FOOTER_CELL_CLASS,
        meta?.class,
      ],
      style: {
        ...(shouldSetWidth ? { width: `${getWidth()}px` } : {}),
        ...(isSticky ? { position: 'sticky' } : {}),
        ...(isHeader && isStickyHeader() ? { top: 0 } : {}),
        ...(isFooter && isStickyFooter() ? { bottom: 0 } : {}),
        ...(isStart ? { left: `${col.getStart('start')}px` } : {}),
        ...(isEnd ? { right: `${col.getAfter('end')}px` } : {}),
        ...(isSticky
          ? {
              'z-index': isHeader || isFooter ? (pin && sticksToEdge ? 30 : 20) : 10,
            }
          : {}),
      },
    }
  }

  function RenderEmpty(): JSX.Element {
    return (
      <Show when={!local.loading}>
        <Show when={local.emptyRender !== undefined} fallback={messages().empty}>
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
    row: DataTableT.Row<TData>
    index: number
    rowProps?: ListT.RowProps<HTMLTableRowElement>
  }): JSX.Element {
    const isSelected = () => rowContext.row.getIsSelected()
    const isExpanded = () => rowContext.row.getIsExpanded()
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
          onClick={(e) => local.onRowClick?.(rowContext.row, e)}
          onDblClick={(e) => local.onRowDoubleClick?.(rowContext.row, e)}
          {...slotWith('row', () => ({
            class: [
              typeof local.rowClass === 'function'
                ? local.rowClass(rowContext.row)
                : local.rowClass,
              Boolean(local.onRowClick || local.onRowDoubleClick) && 'cursor-pointer',
            ],
          }))}
        >
          <For each={rowContext.row.getVisibleCells()}>
            {(cell) => (
              <td
                data-slot="data-table-cell"
                {...dataTableDataAttributes.cell({
                  pinned: () => cell.column.getIsPinned(),
                  pinnedEdge: () => pinnedEdge(cell.column),
                })}
                {...slotWith('cell', () =>
                  buildCellPresentation(cell.column, () => cell.column.getSize(), {
                    isResizableCell: true,
                  }),
                )}
              >
                <FlexRender cell={cell} />
              </td>
            )}
          </For>
        </tr>
        <Show when={local.expandedRowRender}>
          {(expandedRowRender) => (
            <DataTableExpandedRow
              disclosure={disclosure}
              initiallyExpanded={initiallyExpanded}
              colSpan={leafColCount()}
              row={rowContext.row}
              render={expandedRowRender()}
              slotOverrides={slotOverrides}
            />
          )}
        </Show>
      </>
    )
  }

  const scrollStyle = (): JSX.CSSProperties => {
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
    <DataTableInternalProvider value={{ expandButton: slots.expandButton, messages }}>
      <div
        ref={(el) => callRef(local.containerRef, el)}
        data-slot="data-table-container"
        {...slots.container}
      >
        <Show when={local.loading}>
          <div data-slot="data-table-loading" {...slots.loading}>
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
                        const sortConfig = createMemo(() => {
                          switch (header.column.getIsSorted()) {
                            case 'asc':
                              return {
                                icon: 'icon-arrow-up',
                                label: messages().sortedAscending,
                                sort: 'ascending' as const,
                              }
                            case 'desc':
                              return {
                                icon: 'icon-arrow-down',
                                label: messages().sortedDescending,
                                sort: 'descending' as const,
                              }
                            default:
                              return {
                                icon: 'icon-arrow-up-down',
                                label: messages().sort,
                                sort: header.column.getCanSort() ? ('none' as const) : undefined,
                              }
                          }
                        })

                        return (
                          <th
                            data-slot="data-table-head"
                            colSpan={header.colSpan}
                            aria-sort={sortConfig().sort}
                            {...dataTableDataAttributes.head({
                              pinned: () => header.column.getIsPinned(),
                              pinnedEdge: () => pinnedEdge(header.column),
                            })}
                            {...slotWith('head', () =>
                              buildCellPresentation(header.column, () => header.getSize(), {
                                isHeader: true,
                              }),
                            )}
                          >
                            <Show when={!header.isPlaceholder}>
                              <div class={DATA_TABLE_HEAD_INNER_CLASS}>
                                <span
                                  class={`${DATA_TABLE_HEAD_LABEL_CLASS}  ${DATA_TABLE_TEXT_ALIGN_CLASS[header.column.columnDef.meta?.align ?? 'left']}`}
                                >
                                  <FlexRender header={header} />
                                </span>
                                <Show when={header.column.getCanSort()}>
                                  <button
                                    type="button"
                                    data-slot="data-table-sort-button"
                                    aria-label={sortConfig().label}
                                    {...slots.sortButton}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      header.column.getToggleSortingHandler()?.(e)
                                    }}
                                  >
                                    <Icon
                                      name={sortConfig().icon}
                                      slotName="data-table-sort-icon"
                                      {...dataTableDataAttributes.sortIcon({
                                        sorted: header.column.getIsSorted(),
                                      })}
                                      {...slots.sortIcon}
                                      aria-hidden="true"
                                    />
                                  </button>
                                </Show>
                              </div>
                              <Show when={isResizable() && header.column.getCanResize()}>
                                <div
                                  data-slot="data-table-resizer"
                                  {...dataTableDataAttributes.resizer({
                                    resizing: () => header.column.getIsResizing(),
                                  })}
                                  onMouseDown={header.getResizeHandler()}
                                  onTouchStart={header.getResizeHandler()}
                                  {...slotWith('resizer', () => ({
                                    style:
                                      tableOptions().columnResizeMode === 'onEnd' &&
                                      header.column.getIsResizing()
                                        ? {
                                            transform: `translateX(${(tableOptions().columnResizeDirection === 'rtl' ? -1 : 1) * (activeTable().atoms.columnResizing?.get()?.deltaOffset ?? 0)}px)`,
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
                      render={(
                        row: DataTableT.Row<TData>,
                        index: number,
                        rowProps?: ListT.RowProps<HTMLTableRowElement>,
                      ) => <RenderRow row={row} index={index} rowProps={rowProps} />}
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
                        {(header) => (
                          <td
                            data-slot="data-table-cell"
                            colSpan={header.colSpan}
                            {...dataTableDataAttributes.cell({
                              pinned: () => header.column.getIsPinned(),
                              pinnedEdge: () => pinnedEdge(header.column),
                            })}
                            {...slotWith('cell', () =>
                              buildCellPresentation(header.column, () => header.getSize(), {
                                isFooter: true,
                              }),
                            )}
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
          </table>
        </div>

        <Show when={hasPagination()}>
          <div data-slot="data-table-pagination" {...slots.pagination}>
            <div class={DATA_TABLE_PAGINATION_INFO_CLASS}>
              <Show when={hasSelectionSummary()}>
                {messages().selectedCount({
                  selected: activeTable().getFilteredSelectedRowModel().rows.length,
                  total: totalRowCount(),
                })}
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
              <Show when={pageSizeChoices()}>
                {(choices) => (
                  <DropdownMenu>
                    <DropdownMenu.Trigger
                      as={Button}
                      variant="outline"
                      size={local.size}
                      trailing="icon-chevron-down"
                    >
                      {messages().pageSize({ size: currentPageSize() })}
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content
                      items={choices().map((size) => ({
                        label: messages().pageSize({ size }),
                        onSelect: () => handlePageSizeChange(size),
                      }))}
                    />
                  </DropdownMenu>
                )}
              </Show>
            </div>
          </div>
        </Show>
      </div>
    </DataTableInternalProvider>
  )
}
