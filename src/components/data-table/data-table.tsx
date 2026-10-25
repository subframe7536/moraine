import { FlexRender, createTable } from '@tanstack/solid-table'
import type {
  ColumnDef,
  PaginationState,
  Row,
  RowData,
  RowSelectionState,
  SolidTable,
  SortingState,
  TableFeatures,
} from '@tanstack/solid-table'
import type { JSX } from 'solid-js'
import { For, Show, createMemo, createSignal, splitProps } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import { createControllableValue } from '../../shared/controllable-value'
import { renderWithProps } from '../../shared/render-with-props'
import { callRef } from '../../shared/utils'
import { Button } from '../button'
import { DropdownMenu } from '../dropdown-menu'
import { Icon } from '../icon'
import { Pagination } from '../pagination'

import {
  createExpandColumn,
  createSelectColumn,
  getDefaultDataTableFeatures,
} from './data-table-helpers'
import {
  DATA_TABLE_PAGINATION_CONTROLS_CLASS,
  DATA_TABLE_PAGINATION_INFO_CLASS,
  DATA_TABLE_RESIZABLE_CELL_CLASS,
  DATA_TABLE_SORT_BUTTON_ALIGN_CLASS,
  DATA_TABLE_TEXT_ALIGN_CLASS,
  dataTableDataAttributes,
  dataTableRecipe,
} from './data-table.recipe'
import type { DataTableT } from './data-table.types'

/**
 * Data-driven table component powered by TanStack Table v9.
 *
 * Supports both convenience mode (`data` + `columns`) and power-user mode (`table`).
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
    'resizable',
    'columnResizeMode',
    'defaultColumnPinning',
    'currentColumnPinning',
    'onColumnPinningChange',
    'isRowSelectable',
    'expandable',
    'expandedRowRender',
    'expandColumn',
    'defaultExpanded',
    'currentExpanded',
    'onExpandedChange',
    'onRowClick',
    'onRowDoubleClick',
    'table',
    'data',
    'columns',
    'sorting',
    'defaultSorting',
    'currentSorting',
    'onSortingChange',
    'selectable',
    'defaultRowSelection',
    'currentRowSelection',
    'onRowSelectionChange',
    'pagination',
    'defaultPagination',
    'currentPagination',
    'onPaginationChange',
    'pageSizeOptions',
    'showPageSize',
    'rowCount',
    'manualPagination',
    'manualSorting',
    'manualFiltering',
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
  const [scrollContainer, setScrollContainer] = createSignal<HTMLDivElement>()

  const [sorting, setSorting] = createControllableValue<SortingState>({
    value: () => local.currentSorting,
    defaultValue: () => local.defaultSorting ?? [],
    onChange: (val) => local.onSortingChange?.(val),
  })

  const [rowSelection, setRowSelection] = createControllableValue<RowSelectionState>({
    value: () => local.currentRowSelection,
    defaultValue: () => local.defaultRowSelection ?? {},
    onChange: (val) => local.onRowSelectionChange?.(val),
  })

  const [pagination, setPagination] = createControllableValue<PaginationState>({
    value: () => local.currentPagination,
    defaultValue: () => local.defaultPagination ?? { pageIndex: 0, pageSize: 10 },
    onChange: (val) => local.onPaginationChange?.(val),
  })

  const [expanded, setExpanded] = createControllableValue<Record<string, boolean> | boolean>({
    value: () => local.currentExpanded,
    defaultValue: () => local.defaultExpanded ?? {},
    onChange: (val) => local.onExpandedChange?.(val),
  })

  const resolvedColumns = createMemo((): ColumnDef<TableFeatures, TData>[] => {
    let cols = [...(local.columns ?? [])] as ColumnDef<TableFeatures, TData>[]
    const hasLeftPinning =
      (local.currentColumnPinning?.left?.length ?? 0) > 0 ||
      (local.defaultColumnPinning?.left?.length ?? 0) > 0 ||
      cols.some((c) => (c as { meta?: DataTableT.ColumnMeta }).meta?.pinned === 'left')

    if (
      (local.expandable || local.expandedRowRender) &&
      local.expandColumn !== false &&
      !cols.some((c) => c.id === 'expand')
    ) {
      const expandCol = createExpandColumn<TableFeatures, TData>({
        expandButton: slots.expandButton,
      })
      if (hasLeftPinning) {
        expandCol.meta = { ...(expandCol.meta as any), pinned: 'left' }
      }
      cols = [expandCol, ...cols]
    }
    if (local.selectable && !cols.some((c) => c.id === 'select')) {
      const selectCol = createSelectColumn<TableFeatures, TData>({
        mode: local.selectable === 'single' ? 'single' : 'multiple',
      })
      if (hasLeftPinning) {
        selectCol.meta = { ...(selectCol.meta as any), pinned: 'left' }
      }
      cols = [selectCol, ...cols]
    }
    return cols
  })

  const metaPinning = createMemo((): DataTableT.ColumnPinningState => {
    const left: string[] = []
    const right: string[] = []
    for (const col of resolvedColumns()) {
      const meta = (col as { meta?: DataTableT.ColumnMeta }).meta
      if (meta?.pinned === 'left') {
        left.push((col.id ?? (col as any).accessorKey) as string)
      } else if (meta?.pinned === 'right') {
        right.push((col.id ?? (col as any).accessorKey) as string)
      }
    }
    return { left, right }
  })

  const [columnPinning, setColumnPinning] = createControllableValue<DataTableT.ColumnPinningState>({
    value: () => local.currentColumnPinning,
    defaultValue: () => local.defaultColumnPinning ?? metaPinning(),
    onChange: (val) => local.onColumnPinningChange?.(val),
  })

  const toTanstackPinning = (p?: DataTableT.ColumnPinningState) => ({
    start: p?.left ?? [],
    end: p?.right ?? [],
  })

  const tanstackPinning = createMemo(() => {
    const pin = columnPinning()
    const leftList = [...(pin?.left ?? [])]
    const rightList = [...(pin?.right ?? [])]

    if (leftList.length > 0) {
      if (
        (local.expandable || local.expandedRowRender) &&
        local.expandColumn !== false &&
        !leftList.includes('expand')
      ) {
        leftList.unshift('expand')
      }
      if (local.selectable && !leftList.includes('select')) {
        const expandIdx = leftList.indexOf('expand')
        if (expandIdx !== -1) {
          leftList.splice(expandIdx + 1, 0, 'select')
        } else {
          leftList.unshift('select')
        }
      }
    }

    if (!leftList.length && !rightList.length) {
      return undefined
    }
    return {
      start: leftList,
      end: rightList,
    }
  })

  const toMorainePinning = (p?: {
    start?: string[]
    end?: string[]
  }): DataTableT.ColumnPinningState => ({
    left: p?.start ?? [],
    right: p?.end ?? [],
  })

  const resolvedData = (): readonly TData[] => {
    const raw = local.data
    if (typeof raw === 'function') {
      return (raw as () => readonly TData[])()
    }
    return raw ?? []
  }

  const isVirtualized = () => local.virtualRender !== undefined

  const rowSelectableFn = createMemo(() => {
    const fn = local.isRowSelectable
    return fn ? (row: any) => fn(row) : undefined
  })

  const internalTable = createTable({
    features: getDefaultDataTableFeatures({ pagination: !isVirtualized() }),
    get columns() {
      return resolvedColumns()
    },
    get data() {
      return resolvedData()
    },
    get rowCount() {
      return local.rowCount
    },
    get manualPagination() {
      return isVirtualized() ? undefined : local.manualPagination
    },
    get manualSorting() {
      return local.manualSorting
    },
    get manualFiltering() {
      return local.manualFiltering
    },
    autoResetPageIndex: false,
    get enableMultiRowSelection() {
      return local.selectable !== 'single'
    },
    get enableRowSelection() {
      return rowSelectableFn()
    },
    get enableColumnResizing() {
      return Boolean(local.resizable)
    },
    get columnResizeMode() {
      return local.columnResizeMode ?? 'onChange'
    },
    getRowCanExpand: () => Boolean(local.expandable || local.expandedRowRender),
    state: {
      get sorting() {
        return local.sorting ? sorting() : undefined
      },
      get rowSelection() {
        return local.selectable ? rowSelection() : undefined
      },
      get pagination() {
        return !isVirtualized() && local.pagination ? pagination() : undefined
      },
      get columnPinning() {
        return tanstackPinning()
      },
      get expanded() {
        return local.expandable || local.expandedRowRender ? (expanded() as any) : undefined
      },
    },
    onSortingChange: (updater) => {
      const current = sorting()
      const next = typeof updater === 'function' ? updater(current) : updater
      if (
        next.length === current.length &&
        next.every((s, i) => s.id === current[i]?.id && s.desc === current[i]?.desc)
      ) {
        return
      }
      setSorting(next)
    },
    onRowSelectionChange: (updater) => {
      const next = typeof updater === 'function' ? updater(rowSelection()) : updater
      setRowSelection(next)
    },
    onPaginationChange: (updater) => {
      if (isVirtualized()) {
        return
      }
      const current = pagination()
      const next = typeof updater === 'function' ? updater(current) : updater
      if (next.pageIndex === current.pageIndex && next.pageSize === current.pageSize) {
        return
      }
      setPagination(next)
    },
    onColumnPinningChange: (updater) => {
      const current = toTanstackPinning(columnPinning())
      const next = typeof updater === 'function' ? updater(current) : updater
      setColumnPinning(toMorainePinning(next))
    },
    onExpandedChange: (updater) => {
      const current = expanded()
      const next = typeof updater === 'function' ? updater(current as any) : updater
      setExpanded(next)
    },
  })

  const activeTable = (): SolidTable<any, TData> =>
    (local.table as unknown as SolidTable<any, TData>) ?? internalTable

  const activeRows = (): Row<any, TData>[] => {
    const table = activeTable()
    const shouldBypassPagination = local.table ? local.pagination === false : !local.pagination
    if (
      !isVirtualized() &&
      shouldBypassPagination &&
      typeof table.getPrePaginatedRowModel === 'function'
    ) {
      return table.getPrePaginatedRowModel().rows
    }
    return table.getRowModel().rows
  }

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

  const currentPageIndex = () =>
    local.table
      ? (((activeTable() as any).atoms?.pagination?.get()?.pageIndex as number | undefined) ?? 0)
      : pagination().pageIndex

  const currentPageSize = () =>
    local.table
      ? (((activeTable() as any).atoms?.pagination?.get()?.pageSize as number | undefined) ?? 10)
      : pagination().pageSize

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
    local.rowCount ?? activeTable().getRowCount?.() ?? activeTable().getRowModel().rows.length

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

  const hasPinning = createMemo(() => {
    const pin = tanstackPinning()
    return Boolean(pin?.start?.length || pin?.end?.length)
  })

  const tableStyle = (): JSX.CSSProperties => {
    if (local.resizable || hasPinning()) {
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
    const showsDetail = () => Boolean(local.expandedRowRender) && isExpanded()

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
                local.resizable || hasPinning() || cell.column.columnDef.size !== undefined

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
                      local.resizable && DATA_TABLE_RESIZABLE_CELL_CLASS,
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
        <Show when={showsDetail()}>
          <tr data-slot="data-table-expanded-row" {...slots.expandedRow}>
            <td
              data-slot="data-table-expanded-cell"
              colSpan={leafColCount()}
              {...slots.expandedCell}
            >
              {local.expandedRowRender!(rowContext.row as any)}
            </td>
          </tr>
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
                    const canSort = () =>
                      local.table
                        ? (header.column.getCanSort?.() ?? false)
                        : Boolean(local.sorting) && (header.column.getCanSort?.() ?? false)
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
                      local.resizable || hasPinning() || header.column.columnDef.size !== undefined

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
                          <Show when={canSort()} fallback={<FlexRender header={header} />}>
                            <button
                              type="button"
                              data-slot="data-table-sort-button"
                              {...slotWith('sortButton', () => ({
                                class: DATA_TABLE_SORT_BUTTON_ALIGN_CLASS[align()],
                              }))}
                              onClick={(e) => header.column.getToggleSortingHandler?.()?.(e)}
                            >
                              <FlexRender header={header} />
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
                          <Show when={local.resizable && (header.column.getCanResize?.() ?? false)}>
                            <div
                              data-slot="data-table-resizer"
                              {...dataTableDataAttributes.resizer({
                                resizing: () => header.column.getIsResizing?.(),
                              })}
                              onMouseDown={(e) => header.getResizeHandler?.()?.(e)}
                              onTouchStart={(e) => header.getResizeHandler?.()?.(e)}
                              {...slotWith('resizer', () => ({
                                style:
                                  local.columnResizeMode === 'onEnd' &&
                                  header.column.getIsResizing?.()
                                    ? {
                                        transform: `translateX(${((activeTable().options as any).columnResizeDirection === 'rtl' ? -1 : 1) * ((activeTable() as any).getState?.().columnResizing?.deltaOffset ?? 0)}px)`,
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
                        local.resizable ||
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

      <Show when={!isVirtualized() && local.pagination}>
        <div data-slot="data-table-pagination" {...slots.pagination}>
          <div class={DATA_TABLE_PAGINATION_INFO_CLASS}>
            <Show when={local.selectable}>
              {activeTable().getFilteredSelectedRowModel().rows.length} of {totalRowCount()} row(s)
              selected.
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
  )
}
