import { DataTable, createDataTable } from '@src/data-table'
import type { DataTableT } from '@src/data-table'
import { createListSortable } from '@src/dnd'
import { createSignal } from 'solid-js'

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
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role' },
  { accessorKey: 'department', header: 'Department' },
  { accessorKey: 'location', header: 'Location' },
]

const DEFAULT_ORDER = ['name', 'email', 'role', 'department', 'location']

export default function ColumnSettingsExample() {
  const [columnOrder, setColumnOrder] = createSignal(DEFAULT_ORDER)

  const table = createDataTable({
    data: DATA,
    columns: COLUMNS,
    getRowId: (row) => row.id,
    state: {
      get columnOrder() {
        return columnOrder()
      },
    },
    onColumnOrderChange: setColumnOrder,
  })

  // The header cells are the visible leaf columns in display order.
  const sortable = createListSortable({
    items: () => table.getVisibleLeafColumns(),
    getId: (column) => column.id,
    orientation: 'horizontal',
    onReorder: (event) => table.setColumnOrder(event.items.map((column) => column.id)),
  })

  return (
    <sortable.Provider>
      <DataTable
        table={table}
        aria-label="Employees"
        headProps={(context) => sortable.useRow(context).props}
      />
    </sortable.Provider>
  )
}
