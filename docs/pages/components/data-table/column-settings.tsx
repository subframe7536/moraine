import { Button, DropdownMenu } from '@src'
import type { DropdownMenuT } from '@src'
import { DataTable, createDataTable } from '@src/data-table'
import type { DataTableT } from '@src/data-table'
import { For, createMemo, createSignal } from 'solid-js'

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

  // Swap with the next visible column, so a move never lands behind a hidden one.
  const move = (id: string, direction: -1 | 1) => {
    const visible = visibleOrder()
    const neighbor = visible[visible.indexOf(id) + direction]
    if (!neighbor) {
      return
    }
    table.setColumnOrder(
      columnOrder().map((current) =>
        current === id ? neighbor : current === neighbor ? id : current,
      ),
    )
  }

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
        <For each={visibleOrder()}>
          {(id, index) => (
            <div class="px-1.5 py-1 border border-border rounded-md bg-muted/40 flex gap-1 items-center">
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label={`Move ${label(id)} left`}
                disabled={index() === 0}
                leading="i-lucide:chevron-left"
                onClick={() => move(id, -1)}
              />
              <span class="text-xs font-medium">{label(id)}</span>
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label={`Move ${label(id)} right`}
                disabled={index() === visibleOrder().length - 1}
                leading="i-lucide:chevron-right"
                onClick={() => move(id, 1)}
              />
            </div>
          )}
        </For>
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
