import { Button, Input, Select } from '@src'
import { DataTable, createDataTable } from '@src/data-table'
import type { DataTableT } from '@src/data-table'
import { createSignal } from 'solid-js'

interface Employee {
  id: string
  name: string
  role: string
  department: string
}

const ROLES = ['Engineer', 'Designer', 'Manager', 'Analyst'] as const
const DEPARTMENTS = ['Platform', 'Product', 'Security', 'Growth', 'Finance'] as const
const NAMES = ['Alice', 'Bob', 'Carmen', 'Dmitri', 'Elena', 'Farah', 'Gus', 'Hana', 'Ivan']

const DATA: Employee[] = Array.from({ length: 36 }, (_, index) => ({
  id: String(index + 1),
  name: `${NAMES[index % NAMES.length]} ${String.fromCodePoint(65 + (index % 26))}.`,
  role: ROLES[index % ROLES.length]!,
  department: DEPARTMENTS[index % DEPARTMENTS.length]!,
}))

const COLUMNS: DataTableT.Column<Employee>[] = [
  { accessorKey: 'name', header: 'Name' },
  // `equals` matches the role exactly, so "Engineer" does not also match "Engineering".
  { accessorKey: 'role', header: 'Role', filterFn: 'equals' },
  { accessorKey: 'department', header: 'Department' },
]

export default function FilteringExample() {
  const [globalFilter, setGlobalFilter] = createSignal('')

  const table = createDataTable({
    data: DATA,
    columns: COLUMNS,
    getRowId: (row) => row.id,
    pagination: { pageSize: 5 },
    state: {
      get globalFilter() {
        return globalFilter()
      },
    },
    onGlobalFilterChange: (value) => setGlobalFilter(typeof value === 'string' ? value : ''),
  })

  const roleFilter = () =>
    table.getColumn('role')?.getFilterValue() as (typeof ROLES)[number] | undefined

  return (
    <div class="flex flex-col gap-3 w-full">
      <div class="flex flex-wrap gap-2 items-center">
        <Input
          aria-label="Search employees"
          placeholder="Search name, role, or department..."
          value={globalFilter()}
          onValueChange={(value) => table.setGlobalFilter(value)}
          class="max-w-xs"
        />
        <Select
          aria-label="Filter by role"
          placeholder="All roles"
          items={[...ROLES]}
          value={roleFilter()}
          onValueChange={(value) => table.getColumn('role')?.setFilterValue(value)}
          allowClear
          class="w-40"
        />
        <Button
          variant="ghost"
          size="sm"
          disabled={!globalFilter() && !roleFilter()}
          onClick={() => {
            table.setGlobalFilter('')
            table.resetColumnFilters()
          }}
        >
          Reset
        </Button>
      </div>
      <DataTable
        table={table}
        aria-label="Employees"
        emptyRender={<span>No employees match the filters.</span>}
      />
    </div>
  )
}
