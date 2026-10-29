import { Button, Input, Select } from '@src'
import { DataTable, createDataTable } from '@src/data-table'
import type { DataTableT } from '@src/data-table'
import { createResource, createSignal } from 'solid-js'

const ALL_EMPLOYEES = [
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
  { id: '13', name: 'Michael Scott', role: 'Director', department: 'Management' },
  { id: '14', name: 'Nora Valkyrie', role: 'DevOps', department: 'Infrastructure' },
  { id: '15', name: 'Oscar Martinez', role: 'Analyst', department: 'Finance' },
  { id: '16', name: 'Pam Beesly', role: 'Designer', department: 'Product' },
  { id: '17', name: 'Quentin Coldwater', role: 'Developer', department: 'Platform' },
  { id: '18', name: 'Rachel Green', role: 'Product Manager', department: 'Product' },
  { id: '19', name: 'Steve Rogers', role: 'Director', department: 'Security' },
  { id: '20', name: 'Tony Stark', role: 'Engineer', department: 'Platform' },
  { id: '21', name: 'Ursula Corbero', role: 'Developer', department: 'Mobile' },
  { id: '22', name: 'Victor Stone', role: 'Engineer', department: 'Infrastructure' },
  { id: '23', name: 'Wanda Maximoff', role: 'Developer', department: 'Platform' },
  { id: '24', name: 'Xavier Charles', role: 'Director', department: 'Research' },
  { id: '25', name: 'Yvonne Strahovski', role: 'DevOps', department: 'Security' },
]

type Employee = (typeof ALL_EMPLOYEES)[number]

const ROLE_OPTIONS = [
  { label: 'All Roles', value: '' },
  { label: 'Engineer', value: 'Engineer' },
  { label: 'Designer', value: 'Designer' },
  { label: 'Developer', value: 'Developer' },
  { label: 'Intern', value: 'Intern' },
  { label: 'Product Manager', value: 'Product Manager' },
  { label: 'DevOps', value: 'DevOps' },
  { label: 'Analyst', value: 'Analyst' },
  { label: 'Director', value: 'Director' },
]

const COLUMNS: DataTableT.Column<Employee>[] = [
  { accessorKey: 'name', header: 'Name', footer: 'Total' },
  { accessorKey: 'role', header: 'Role' },
  { accessorKey: 'department', header: 'Department', footer: '25 members' },
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
  remote?: boolean
}

interface RemoteQuery {
  query: string
  role?: string
  sorting: DataTableT.State['sorting']
  pagination?: { pageIndex: number; pageSize: number }
}

export default function DataTablePlayground(props: PlaygroundProps) {
  const [nameQuery, setNameQuery] = createSignal('')
  const [roleFilter, setRoleFilter] = createSignal<string | undefined>(undefined)
  const [sorting, setSorting] = createSignal<DataTableT.State['sorting']>([])
  const [pagination, setPagination] = createSignal({ pageIndex: 0, pageSize: 5 })

  const filteredLocalData = () => {
    const q = nameQuery().trim().toLowerCase()
    const role = roleFilter()
    return ALL_EMPLOYEES.filter(
      (emp) => (!q || emp.name.toLowerCase().includes(q)) && (!role || emp.role === role),
    )
  }

  const [remote] = createResource(
    (): RemoteQuery | false =>
      props.remote === true && {
        query: nameQuery().trim().toLowerCase(),
        role: roleFilter(),
        sorting: sorting(),
        pagination: props.pagination !== false ? pagination() : undefined,
      },
    async (params) => {
      await new Promise((resolve) => setTimeout(resolve, 300))
      let rows = ALL_EMPLOYEES.filter(
        (emp) =>
          (!params.query || emp.name.toLowerCase().includes(params.query)) &&
          (!params.role || emp.role === params.role),
      )
      const [sort] = params.sorting
      if (sort) {
        const key = sort.id as keyof Employee
        rows = [...rows].sort(
          (a, b) => `${a[key] ?? ''}`.localeCompare(`${b[key] ?? ''}`) * (sort.desc ? -1 : 1),
        )
      }
      const total = rows.length
      if (params.pagination) {
        const { pageIndex, pageSize } = params.pagination
        rows = rows.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize)
      }
      return { rows, total }
    },
    { initialValue: { rows: [], total: 0 } },
  )

  const table = createDataTable<Employee>({
    get data() {
      return props.remote ? remote.latest.rows : filteredLocalData()
    },
    columns: COLUMNS,
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
      return props.pagination !== false ? { pageSizes: [5, 10, 20] } : false
    },
    get resizable() {
      return props.resizable === true
    },
    get manual() {
      return props.remote === true
    },
    get rowCount() {
      return props.remote ? remote.latest.total : undefined
    },
    state: {
      get sorting() {
        return sorting()
      },
      get pagination() {
        return pagination()
      },
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
  })

  const resetPage = () => setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  const hasFilter = () => Boolean(nameQuery()) || Boolean(roleFilter())

  const handleReset = () => {
    setNameQuery('')
    setRoleFilter(undefined)
    resetPage()
  }

  return (
    <div class="flex flex-col gap-3 w-full">
      <div class="flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Filter by name..."
          value={nameQuery()}
          onValueChange={(val) => {
            setNameQuery(val ?? '')
            if (props.remote) {
              resetPage()
            }
          }}
          class="max-w-xs"
        />
        <Select
          placeholder="Filter role"
          items={ROLE_OPTIONS}
          value={roleFilter()}
          onValueChange={(val) => {
            setRoleFilter(val)
            if (props.remote) {
              resetPage()
            }
          }}
          allowClear
          class="w-44"
        />
        <Button variant="outline" onClick={handleReset} disabled={!hasFilter()}>
          Reset
        </Button>
      </div>
      <DataTable
        table={table}
        size={props.size}
        striped={props.striped}
        hoverEffect={props.hoverEffect}
        showBorder={props.showBorder}
        sticky={props.sticky}
        maxHeight={props.sticky ? 280 : undefined}
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
        onRowClick={(row) => {
          if (props.expandable && row.getCanExpand()) {
            row.toggleExpanded()
          }
        }}
        loading={props.loading || (props.remote && remote.loading)}
        classes={{ container: 'border border-border rounded-lg' }}
      />
    </div>
  )
}
