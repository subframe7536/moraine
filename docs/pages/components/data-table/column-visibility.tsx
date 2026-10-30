import { Button, DropdownMenu } from '@src'
import type { DropdownMenuT } from '@src'
import { DataTable, createDataTable } from '@src/data-table'
import type { DataTableT } from '@src/data-table'
import { createMemo, createSignal } from 'solid-js'

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
    email: 'alice@example.com',
    role: 'Engineer',
    department: 'Platform',
    location: 'Austin',
  },
  {
    id: '2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    role: 'Designer',
    department: 'Product',
    location: 'Berlin',
  },
  {
    id: '3',
    name: 'Laura Croft',
    email: 'laura@example.com',
    role: 'Engineer',
    department: 'Security',
    location: 'London',
  },
  {
    id: '4',
    name: 'Evan Wright',
    email: 'evan@example.com',
    role: 'Developer',
    department: 'Mobile',
    location: 'Tokyo',
  },
]

const COLUMNS: DataTableT.Column<Employee>[] = [
  // The name identifies each row, so it cannot be hidden.
  { accessorKey: 'name', header: 'Name', enableHiding: false },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role' },
  { accessorKey: 'department', header: 'Department' },
  { accessorKey: 'location', header: 'Location' },
]

export default function ColumnVisibilityExample() {
  const [columnVisibility, setColumnVisibility] = createSignal<Record<string, boolean>>({
    email: false,
  })

  const table = createDataTable({
    data: DATA,
    columns: COLUMNS,
    getRowId: (row) => row.id,
    state: {
      get columnVisibility() {
        return columnVisibility()
      },
    },
    onColumnVisibilityChange: setColumnVisibility,
  })

  const items = createMemo<DropdownMenuT.Item[]>(() =>
    table
      .getAllLeafColumns()
      .filter((column) => column.getCanHide())
      .map((column) => ({
        type: 'checkbox',
        label: String(column.columnDef.header),
        checked: column.getIsVisible(),
        onCheckedChange: (checked: boolean) => column.toggleVisibility(checked),
      })),
  )

  return (
    <div class="flex flex-col gap-3 w-full">
      <div class="flex justify-end">
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
          <DropdownMenu.Content items={items()} />
        </DropdownMenu>
      </div>
      <DataTable
        table={table}
        aria-label="Employees"
        classes={{ container: 'border border-border rounded-lg' }}
      />
    </div>
  )
}
