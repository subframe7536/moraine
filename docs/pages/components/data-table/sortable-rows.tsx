import { Icon } from '@src'
import { DataTable, createDataTable } from '@src/data-table'
import type { DataTableT } from '@src/data-table'
import { createListSortable } from '@src/dnd'
import { createSignal } from 'solid-js'

interface Release {
  id: string
  version: string
  owner: string
  status: string
}

const RELEASES: Release[] = [
  { id: 'r1', version: '2.4.0', owner: 'Elena', status: 'Ready' },
  { id: 'r2', version: '2.3.2', owner: 'Marcus', status: 'In review' },
  { id: 'r3', version: '2.3.1', owner: 'Priya', status: 'Blocked' },
  { id: 'r4', version: '2.3.0', owner: 'Jonas', status: 'Draft' },
  { id: 'r5', version: '2.2.9', owner: 'Aiko', status: 'Ready' },
]

export default function SortableRowsExample() {
  const [releases, setReleases] = createSignal(RELEASES)

  const table = createDataTable({
    get data() {
      return releases()
    },
    columns: [
      {
        id: 'drag',
        header: () => <span class="sr-only">Reorder</span>,
        size: 44,
        cell: (props) => (
          <button
            ref={sortable.handleRefFor(props.row.id)}
            type="button"
            aria-label={`Reorder ${props.row.original.version}`}
            class="text-muted-foreground rounded-sm flex size-6 cursor-grab items-center justify-center hover:bg-accent"
          >
            <Icon name="i-lucide:grip-vertical" />
          </button>
        ),
      },
      { accessorKey: 'version', header: 'Version' },
      { accessorKey: 'owner', header: 'Owner' },
      { accessorKey: 'status', header: 'Status' },
    ] satisfies DataTableT.Column<Release>[],
    getRowId: (row) => row.id,
    sorting: false,
  })

  // Rows render in data order here: no sorting, filtering, or pagination reorders them.
  const sortable = createListSortable({
    items: () => table.getRowModel().rows,
    getId: (row) => row.id,
    onReorder: (event) => setReleases(event.items.map((row) => row.original)),
  })

  return (
    <sortable.Provider>
      <DataTable
        table={table}
        aria-label="Release queue"
        rowClass="bg-background data-[dnd-dragging]:opacity-60 [&[data-drop-position=after]>td]:shadow-[inset_0_-2px_0_var(--primary)] [&[data-drop-position=before]>td]:shadow-[inset_0_2px_0_var(--primary)]"
        rowProps={(context) => sortable.useRow(context).props}
      />
    </sortable.Provider>
  )
}
