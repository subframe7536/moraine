import { DataTable, createDataTable } from '@src/data-table'
import type { DataTableT } from '@src/data-table'
import { createSignal } from 'solid-js'

interface FileNode {
  path: string
  name: string
  kind: 'folder' | 'file'
  size: number
  modified: string
  children?: FileNode[]
}

const FILES: FileNode[] = [
  {
    path: 'src',
    name: 'src',
    kind: 'folder',
    size: 0,
    modified: '2026-10-28',
    children: [
      {
        path: 'src/components',
        name: 'components',
        kind: 'folder',
        size: 0,
        modified: '2026-10-28',
        children: [
          {
            path: 'src/components/button.tsx',
            name: 'button.tsx',
            kind: 'file',
            size: 4_812,
            modified: '2026-10-27',
          },
          {
            path: 'src/components/table.tsx',
            name: 'table.tsx',
            kind: 'file',
            size: 9_340,
            modified: '2026-10-28',
          },
          {
            path: 'src/components/tree.tsx',
            name: 'tree.tsx',
            kind: 'file',
            size: 7_115,
            modified: '2026-10-21',
          },
        ],
      },
      {
        path: 'src/theme',
        name: 'theme',
        kind: 'folder',
        size: 0,
        modified: '2026-10-19',
        children: [
          {
            path: 'src/theme/tokens.ts',
            name: 'tokens.ts',
            kind: 'file',
            size: 12_480,
            modified: '2026-10-19',
          },
        ],
      },
      { path: 'src/index.ts', name: 'index.ts', kind: 'file', size: 1_204, modified: '2026-10-28' },
    ],
  },
  { path: 'package.json', name: 'package.json', kind: 'file', size: 2_310, modified: '2026-10-26' },
  { path: 'README.md', name: 'README.md', kind: 'file', size: 5_902, modified: '2026-10-12' },
]

/** Folders report the total size of their files. */
function totalSize(node: FileNode): number {
  return node.children ? node.children.reduce((sum, child) => sum + totalSize(child), 0) : node.size
}

const formatSize = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`

const COLUMNS: DataTableT.Column<FileNode>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    size: 260,
    cell: (props) => (
      <span class="inline-flex gap-2 items-center">
        <span
          aria-hidden="true"
          class={
            props.row.original.kind === 'folder'
              ? 'i-lucide:folder text-muted-foreground'
              : 'i-lucide:file text-muted-foreground'
          }
        />
        <span class={props.row.original.kind === 'folder' ? 'font-medium' : undefined}>
          {props.row.original.name}
        </span>
      </span>
    ),
  },
  {
    id: 'size',
    header: 'Size',
    size: 120,
    accessorFn: totalSize,
    meta: { align: 'right' },
    cell: (props) => (
      <span class="text-muted-foreground tabular-nums">
        {formatSize(props.getValue() as number)}
      </span>
    ),
  },
  {
    accessorKey: 'modified',
    header: 'Modified',
    size: 140,
    cell: (props) => (
      <span class="text-muted-foreground tabular-nums">{props.row.original.modified}</span>
    ),
  },
]

export default function TreeDataExample() {
  const [rowSelection, setRowSelection] = createSignal<DataTableT.State['rowSelection']>({})

  const table = createDataTable({
    data: FILES,
    columns: COLUMNS,
    // Sub-row ids get their parent's id as a prefix, so `src` > `components` becomes
    // `src.components`. Stable ids keep the selection across sorting and collapsing.
    getRowId: (node) => node.name,
    selection: 'multiple',
    // Show the chevron only on folders.
    expandable: (row) => row.subRows.length > 0,
    initialState: { expanded: { src: true, 'src.components': true } },
    state: {
      get rowSelection() {
        return rowSelection()
      },
    },
    onRowSelectionChange: setRowSelection,
    tableOptions: { getSubRows: (node) => node.children },
  })

  const selectedFiles = () =>
    table
      .getSelectedRowModel()
      .flatRows.filter((row) => row.original.kind === 'file')
      .map((row) => row.original.path)

  return (
    <div class="flex flex-col gap-3 w-full">
      <DataTable
        table={table}
        aria-label="Project files"
        hoverEffect
        classes={{ container: 'border border-border rounded-lg' }}
      />
      <p class="text-sm text-muted-foreground" aria-live="polite">
        {selectedFiles().length > 0
          ? `Selected files: ${selectedFiles().join(', ')}`
          : 'Select a folder to select every file in it.'}
      </p>
    </div>
  )
}
