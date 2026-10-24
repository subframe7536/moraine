import { FlexRender, createTable } from '@tanstack/solid-table'
import type {
  ColumnDef,
  PaginationState,
  RowData,
  RowSelectionState,
  SolidTable,
  SortingState,
  TableFeatures,
} from '@tanstack/solid-table'
import type { JSX } from 'solid-js'
import { For, Show, createMemo, splitProps } from 'solid-js'

import { useRecipe } from '../../provider'
import { createControllableValue } from '../../shared/controllable-value'
import { renderWithProps } from '../../shared/render-with-props'
import { Button } from '../button'
import { DropdownMenu } from '../dropdown-menu'
import { Icon } from '../icon'
import { Pagination } from '../pagination'

import { createSelectColumn, getDefaultDataTableFeatures } from './data-table-helpers'
import {
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

  const resolvedColumns = createMemo((): ColumnDef<TableFeatures, TData>[] => {
    const cols = [...(local.columns ?? [])] as ColumnDef<TableFeatures, TData>[]
    if (local.selectable && !cols.some((c) => c.id === 'select')) {
      const selectCol = createSelectColumn<TableFeatures, TData>()
      return [selectCol, ...cols]
    }
    return cols
  })

  const resolvedData = (): readonly TData[] => {
    const raw = local.data
    if (typeof raw === 'function') {
      return (raw as () => readonly TData[])()
    }
    return raw ?? []
  }

  const internalTable = createTable({
    features: getDefaultDataTableFeatures(),
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
      return local.manualPagination
    },
    get manualSorting() {
      return local.manualSorting
    },
    get manualFiltering() {
      return local.manualFiltering
    },
    autoResetPageIndex: false,
    state: {
      get sorting() {
        return local.sorting ? sorting() : undefined
      },
      get rowSelection() {
        return local.selectable ? rowSelection() : undefined
      },
      get pagination() {
        return local.pagination ? pagination() : undefined
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
      const current = pagination()
      const next = typeof updater === 'function' ? updater(current) : updater
      if (next.pageIndex === current.pageIndex && next.pageSize === current.pageSize) {
        return
      }
      setPagination(next)
    },
  })

  const activeTable = (): SolidTable<any, TData> =>
    (local.table as unknown as SolidTable<any, TData>) ?? internalTable

  const leafColCount = (): number => {
    const cols = activeTable().getVisibleLeafColumns()
    return cols.length > 0 ? cols.length : 1
  }

  const currentPageIndex = () =>
    local.table
      ? (((local.table as any).atoms?.pagination?.get()?.pageIndex as number | undefined) ?? 0)
      : pagination().pageIndex

  const currentPageSize = () =>
    local.table
      ? (((local.table as any).atoms?.pagination?.get()?.pageSize as number | undefined) ?? 10)
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
    activeTable().setPagination((prev) => ({ ...prev, pageSize: size, pageIndex: 0 }))
  }

  const handlePageChange = (page: number) => {
    activeTable().setPageIndex(page - 1)
  }

  const totalRowCount = () => local.rowCount ?? activeTable().getRowCount()

  function RenderEmpty(): JSX.Element {
    return (
      <Show when={local.emptyRender !== undefined} fallback="No results.">
        {renderWithProps(local.emptyRender, {
          get colSpan() {
            return leafColCount()
          },
        })}
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

  return (
    <div ref={local.containerRef} data-slot="data-table-container" {...slots.container}>
      <Show when={local.loading}>
        <div data-slot="data-table-loading" {...slots.loading}>
          <RenderLoading />
        </div>
      </Show>

      <table data-slot="data-table" {...rest} {...slots.root} ref={local.ref}>
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

                    return (
                      <th
                        data-slot="data-table-head"
                        colSpan={header.colSpan}
                        {...slotWith('head', () => ({
                          class: [
                            DATA_TABLE_TEXT_ALIGN_CLASS[align()],
                            truncated() && 'truncate',
                            meta()?.class,
                          ],
                          style:
                            typeof header.getSize === 'function' && header.getSize() !== 150
                              ? { width: `${header.getSize()}px` }
                              : undefined,
                        }))}
                      >
                        <Show when={!header.isPlaceholder}>
                          <Show when={canSort()} fallback={<FlexRender header={header} />}>
                            <button
                              type="button"
                              data-slot="data-table-sort-button"
                              {...slots.sortButton}
                              onClick={(e) => header.column.getToggleSortingHandler?.()?.(e)}
                            >
                              <FlexRender header={header} />
                              <span
                                data-slot="data-table-sort-icon"
                                {...slots.sortIcon}
                                aria-hidden="true"
                              >
                                <Icon name={sortIcon()} />
                              </span>
                            </button>
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
            when={activeTable().getRowModel().rows.length > 0}
            fallback={
              <tr data-slot="data-table-row" {...slots.row}>
                <td data-slot="data-table-empty" colSpan={leafColCount()} {...slots.empty}>
                  <RenderEmpty />
                </td>
              </tr>
            }
          >
            <For each={activeTable().getRowModel().rows}>
              {(row) => {
                const isSelected = () => row.getIsSelected?.() ?? false

                return (
                  <tr
                    data-slot="data-table-row"
                    aria-selected={isSelected()}
                    {...dataTableDataAttributes.row({ selected: isSelected })}
                    {...slotWith('row', () => ({
                      class:
                        typeof local.rowClass === 'function'
                          ? local.rowClass(row as any)
                          : local.rowClass,
                    }))}
                  >
                    <For each={row.getVisibleCells()}>
                      {(cell) => {
                        const meta = () =>
                          cell.column.columnDef.meta as DataTableT.ColumnMeta | undefined
                        const align = (): 'left' | 'center' | 'right' => meta()?.align ?? 'left'
                        const truncated = () => meta()?.truncated ?? false

                        return (
                          <td
                            data-slot="data-table-cell"
                            {...slotWith('cell', () => ({
                              class: [
                                DATA_TABLE_TEXT_ALIGN_CLASS[align()],
                                truncated() && 'truncate',
                                meta()?.class,
                              ],
                            }))}
                          >
                            <FlexRender cell={cell} />
                          </td>
                        )
                      }}
                    </For>
                  </tr>
                )
              }}
            </For>
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

                      return (
                        <td
                          data-slot="data-table-cell"
                          colSpan={header.colSpan}
                          {...slotWith('cell', () => ({
                            class: [
                              DATA_TABLE_TEXT_ALIGN_CLASS[align()],
                              truncated() && 'truncate',
                              meta()?.class,
                            ],
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

      <Show when={local.pagination}>
        <div data-slot="data-table-pagination" {...slots.pagination}>
          <div class="text-sm text-muted-foreground">
            <Show when={local.selectable}>
              {activeTable().getFilteredSelectedRowModel().rows.length} of {totalRowCount()} row(s)
              selected.
            </Show>
          </div>
          <div class="flex gap-2 items-center">
            <Pagination
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
