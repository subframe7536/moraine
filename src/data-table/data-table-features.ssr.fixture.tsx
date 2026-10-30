import type { SortingState } from '@tanstack/solid-table'
import { renderToString } from 'solid-js/web'

import { createTableVirtualizer } from '../virtualizer'

import { createDataTable } from './create-data-table'
import { DataTable } from './data-table'
import type { DataTableT } from './data-table.types'

interface FileNode {
  id: string
  name: string
  kind: string
  size: number
  children?: FileNode[]
}

const FILES: FileNode[] = [
  {
    id: 'src',
    name: 'src',
    kind: 'folder',
    size: 30,
    children: [
      {
        id: 'components',
        name: 'components',
        kind: 'folder',
        size: 20,
        children: [{ id: 'button', name: 'button.tsx', kind: 'file', size: 4 }],
      },
    ],
  },
  { id: 'readme', name: 'README.md', kind: 'file', size: 2 },
]

const FILE_COLUMNS: DataTableT.Column<FileNode>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'kind', header: 'Kind' },
  { accessorKey: 'size', header: 'Size' },
]

const MULTI_SORT: SortingState = [
  { id: 'kind', desc: false },
  { id: 'size', desc: true },
]

/** Tree indentation, sort priorities, and the pagination summary in one table. */
export function DataTableFeaturesFixture(props: { sorting?: SortingState }) {
  const table = createDataTable({
    data: FILES,
    columns: FILE_COLUMNS,
    getRowId: (row) => row.id,
    selection: 'multiple',
    pagination: true,
    initialState: { expanded: true },
    state: {
      get sorting() {
        return props.sorting ?? MULTI_SORT
      },
    },
    tableOptions: { getSubRows: (row) => row.children },
  })

  return <DataTable table={table} aria-label="Files" />
}

type WideRow = Record<string, string>

const WIDE_CENTER_COUNT = 12

const WIDE_COLUMNS: DataTableT.Column<WideRow>[] = [
  { accessorKey: 'id', header: 'ID', size: 60 },
  ...Array.from({ length: WIDE_CENTER_COUNT }, (_, index) => ({
    accessorKey: `c${index}`,
    header: `C${index}`,
    size: 100,
  })),
]

const WIDE_ROWS: WideRow[] = Array.from({ length: 20 }, (_, row) =>
  Object.fromEntries([
    ['id', `r${row}`],
    ...Array.from({ length: WIDE_CENTER_COUNT }, (_, index) => [`c${index}`, `r${row}c${index}`]),
  ]),
)

/** A row- and column-virtualized table with a start-pinned column. */
export function VirtualColumnsDataTableFixture() {
  const virtualizer = createTableVirtualizer<DataTableT.Row<WideRow>>({
    estimateSize: () => 30,
    // jsdom has no layout, so hydration tests use fixed row heights.
    measureElement: () => 30,
    observeElementRect: (_instance, callback) => {
      callback({ width: 360, height: 90 })
      return () => {}
    },
    overscan: 0,
    columns: {
      observeElementRect: (_instance, callback) => {
        callback({ width: 360, height: 90 })
        return () => {}
      },
      overscan: 0,
    },
  })
  const table = createDataTable({
    data: WIDE_ROWS,
    columns: WIDE_COLUMNS,
    initialState: { columnPinning: { start: ['id'], end: [] } },
  })

  return <DataTable table={table} virtualizer={virtualizer} maxHeight={120} aria-label="Wide" />
}

export function renderDataTableFeaturesFixture(): string {
  return renderToString(() => <DataTableFeaturesFixture />)
}

export function renderVirtualColumnsDataTableFixture(): string {
  return renderToString(() => <VirtualColumnsDataTableFixture />)
}

/** The same table with row virtualization only. */
export function VirtualRowsDataTableFixture() {
  const virtualizer = createTableVirtualizer<DataTableT.Row<WideRow>>({
    estimateSize: () => 30,
    // jsdom has no layout, so hydration tests use fixed row heights.
    measureElement: () => 30,
    observeElementRect: (_instance, callback) => {
      callback({ width: 360, height: 90 })
      return () => {}
    },
    overscan: 0,
  })
  const table = createDataTable({ data: WIDE_ROWS, columns: WIDE_COLUMNS })

  return <DataTable table={table} virtualizer={virtualizer} maxHeight={120} aria-label="Wide" />
}

export function renderVirtualRowsDataTableFixture(): string {
  return renderToString(() => <VirtualRowsDataTableFixture />)
}
