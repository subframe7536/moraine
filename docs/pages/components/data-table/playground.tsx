import { DataTable, createDataTable } from '@src/data-table'
import type { DataTableT } from '@src/data-table'

interface Employee {
  id: string
  name: string
  role: string
  department: string
}

// Stable references, so toggling `empty` swaps the array only when the switch changes.
const NO_EMPLOYEES: Employee[] = []

const EMPLOYEES: Employee[] = [
  { id: '1', name: 'Alice Johnson', role: 'Engineer', department: 'Platform' },
  { id: '2', name: 'Bob Smith', role: 'Designer', department: 'Product' },
  { id: '3', name: 'Charlie Brown', role: 'Intern', department: 'Platform' },
  { id: '4', name: 'Diana Prince', role: 'Director', department: 'Operations' },
  { id: '5', name: 'Evan Wright', role: 'Developer', department: 'Mobile' },
  { id: '6', name: 'Fiona Gallagher', role: 'Engineer', department: 'Infrastructure' },
  { id: '7', name: 'George Clark', role: 'Product Manager', department: 'Product' },
  { id: '8', name: 'Hannah Abbott', role: 'Designer', department: 'Design System' },
  { id: '9', name: 'Ian Malcolm', role: 'DevOps', department: 'Infrastructure' },
  { id: '10', name: 'Julia Roberts', role: 'Director', department: 'Mobile' },
  { id: '11', name: 'Kevin Bacon', role: 'Developer', department: 'Platform' },
  { id: '12', name: 'Laura Croft', role: 'Engineer', department: 'Security' },
]

const COLUMNS: DataTableT.Column<Employee>[] = [
  { accessorKey: 'name', header: 'Name', size: 200, footer: 'Total' },
  { accessorKey: 'role', header: 'Role', size: 180 },
  {
    accessorKey: 'department',
    header: 'Department',
    size: 180,
    footer: (props) => <span>{props.table.getCoreRowModel().rows.length} members</span>,
  },
]

interface PlaygroundProps {
  size?: 'sm' | 'md' | 'lg'
  striped?: boolean
  hoverEffect?: boolean
  showBorder?: 'row' | 'col' | 'both'
  sorting?: boolean
  selectable?: boolean
  pagination?: boolean
  sticky?: boolean
  resizable?: boolean
  expandable?: boolean
  loading?: boolean
  empty?: boolean
}

export default function DataTablePlayground(props: PlaygroundProps) {
  const table = createDataTable({
    get data() {
      return props.empty ? NO_EMPLOYEES : EMPLOYEES
    },
    columns: COLUMNS,
    getRowId: (row) => row.id,
    get sorting() {
      return props.sorting !== false
    },
    get selection() {
      return props.selectable !== false ? 'multiple' : undefined
    },
    get expandable() {
      return Boolean(props.expandable)
    },
    get pagination() {
      return props.pagination !== false ? { pageSize: 5, pageSizes: [5, 10, 20] } : false
    },
    get resizable() {
      return props.resizable === true
    },
  })

  return (
    <DataTable
      table={table}
      aria-label="Employees"
      size={props.size}
      striped={props.striped}
      hoverEffect={props.hoverEffect}
      showBorder={props.showBorder}
      sticky={props.sticky}
      maxHeight={props.sticky ? 280 : undefined}
      loading={props.loading}
      expandedRowRender={
        props.expandable
          ? (rowProps) => (
              <div class="text-muted-foreground">
                <span class="text-foreground font-medium">{rowProps.row.original.name}</span> is a{' '}
                {rowProps.row.original.role} in the {rowProps.row.original.department} department.
              </div>
            )
          : undefined
      }
    />
  )
}
