import { Button, DropdownMenu, Icon } from '@src'
import type { DropdownMenuT } from '@src'
import { DataTable, createDataTable } from '@src/data-table'
import type { DataTableT } from '@src/data-table'
import { createListSortable } from '@src/dnd'
import { For, createMemo, createSignal } from 'solid-js'

// The chip under the pointer draws a line on the side the dragged chip lands on.
const CHIP_CLASS =
  "py-1 pe-2 ps-0.5 border border-border rounded-md bg-muted/40 flex gap-1 items-center relative data-[dnd-dragging]:opacity-60 data-[drop-position=after]:after:rounded-full data-[drop-position=before]:before:rounded-full data-[drop-position=after]:after:bg-primary data-[drop-position=before]:before:bg-primary data-[drop-position=after]:after:w-0.5 data-[drop-position=before]:before:w-0.5 data-[drop-position=after]:after:content-[''] data-[drop-position=before]:before:content-[''] data-[drop-position=after]:after:inset-y-0 data-[drop-position=before]:before:inset-y-0 data-[drop-position=after]:after:absolute data-[drop-position=before]:before:absolute data-[drop-position=after]:after:-end-1.5 data-[drop-position=before]:before:-start-1.5"

interface Employee {
  id: string
  name: string
  email: string
  role: string
  department: string
  location: string
}

const DATA: Employee[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice@acme.dev',
    role: 'Engineer',
    department: 'Platform',
    location: 'Austin',
  },
  {
    id: '2',
    name: 'Bob Smith',
    email: 'bob@acme.dev',
    role: 'Designer',
    department: 'Product',
    location: 'Berlin',
  },
  {
    id: '3',
    name: 'Laura Croft',
    email: 'laura@acme.dev',
    role: 'Engineer',
    department: 'Security',
    location: 'London',
  },
  {
    id: '4',
    name: 'Evan Wright',
    email: 'evan@acme.dev',
    role: 'Developer',
    department: 'Mobile',
    location: 'Tokyo',
  },
]

const COLUMNS: DataTableT.Column<Employee>[] = [
  // The name identifies each row, so it can move but not hide.
  { accessorKey: 'name', header: 'Name', enableHiding: false },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role' },
  { accessorKey: 'department', header: 'Department' },
  { accessorKey: 'location', header: 'Location' },
]

const DEFAULT_ORDER = ['name', 'email', 'role', 'department', 'location']
const DEFAULT_VISIBILITY: Record<string, boolean> = { email: false }

export default function ColumnSettingsExample() {
  const [columnOrder, setColumnOrder] = createSignal<string[]>(DEFAULT_ORDER)
  const [columnVisibility, setColumnVisibility] =
    createSignal<Record<string, boolean>>(DEFAULT_VISIBILITY)

  // Both slices are controlled, so the toolbar and the table share one source of truth.
  const table = createDataTable({
    data: DATA,
    columns: COLUMNS,
    getRowId: (row) => row.id,
    state: {
      get columnOrder() {
        return columnOrder()
      },
      get columnVisibility() {
        return columnVisibility()
      },
    },
    onColumnOrderChange: setColumnOrder,
    onColumnVisibilityChange: setColumnVisibility,
  })

  const label = (id: string) => String(table.getColumn(id)?.columnDef.header ?? id)

  const visibilityItems = createMemo<DropdownMenuT.Item[]>(() =>
    table
      .getAllLeafColumns()
      .filter((column) => column.getCanHide())
      .map((column) => ({
        type: 'checkbox',
        label: label(column.id),
        checked: column.getIsVisible(),
        onCheckedChange: (checked: boolean) => column.toggleVisibility(checked),
      })),
  )

  const visibleOrder = () => columnOrder().filter((id) => columnVisibility()[id] !== false)

  // Hidden columns keep their slots in the order; the dragged visible columns fill the rest.
  const sortable = createListSortable({
    items: visibleOrder,
    getId: (id) => id,
    orientation: 'horizontal',
    onReorder: (event) => {
      const visible = [...event.items]
      table.setColumnOrder(
        columnOrder().map((id) => (columnVisibility()[id] === false ? id : visible.shift()!)),
      )
    },
  })

  const isDefault = () =>
    columnOrder().every((id, index) => id === DEFAULT_ORDER[index]) &&
    JSON.stringify(columnVisibility()) === JSON.stringify(DEFAULT_VISIBILITY)

  return (
    <div class="flex flex-col gap-3 w-full">
      <div class="flex flex-wrap gap-2 items-center">
        <DropdownMenu>
          <DropdownMenu.Trigger
            as={Button}
            variant="outline"
            size="sm"
            leading="i-lucide:columns-3"
            trailing="icon-chevron-down"
          >
            Columns
          </DropdownMenu.Trigger>
          <DropdownMenu.Content items={visibilityItems()} />
        </DropdownMenu>
        {/* Hidden columns keep their place in the order and reappear there. */}
        <sortable.Provider>
          <div role="list" aria-label="Column order" class="flex flex-wrap gap-3 items-center">
            <For each={visibleOrder()}>
              {(id, index) => {
                const chip = sortable.useRow({
                  get index() {
                    return index()
                  },
                })
                return (
                  <div {...chip.props} role="listitem" class={CHIP_CLASS}>
                    <button
                      ref={chip.handleRef}
                      type="button"
                      aria-label={`Reorder ${label(id)}`}
                      class="text-muted-foreground rounded-sm flex size-5 cursor-grab items-center justify-center hover:bg-accent"
                    >
                      <Icon name="i-lucide:grip-vertical" />
                    </button>
                    <span class="text-xs font-medium">{label(id)}</span>
                  </div>
                )
              }}
            </For>
          </div>
        </sortable.Provider>
        <Button
          size="sm"
          variant="ghost"
          disabled={isDefault()}
          onClick={() => {
            table.setColumnOrder(DEFAULT_ORDER)
            table.setColumnVisibility(DEFAULT_VISIBILITY)
          }}
        >
          Reset
        </Button>
      </div>
      <DataTable table={table} aria-label="Employees" />
    </div>
  )
}
