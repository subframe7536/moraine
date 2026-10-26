import { Button, DataTable, Input, Select, createDataTable } from '@src'
import type { DataTableT } from '@src'
import { Show, createEffect, createSignal, on, onCleanup } from 'solid-js'

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

interface PlaygroundTableProps extends PlaygroundProps {
  remoteSorting: () => DataTableT.State['sorting']
  setRemoteSorting: (value: DataTableT.State['sorting']) => void
  remotePagination: () => DataTableT.State['pagination']
  setRemotePagination: (value: DataTableT.State['pagination']) => void
  remoteLoading: () => boolean
  serverRows: () => Employee[]
  serverTotal: () => number
  filteredLocalData: () => Employee[]
}

function PlaygroundTable(props: PlaygroundTableProps) {
  // oxlint-disable-next-line subf/solid-reactivity -- Instance remounts when pagination changes.
  const paginated = props.pagination !== false
  const table = createDataTable({
    data: () => (props.remote ? props.serverRows() : props.filteredLocalData()),
    columns: COLUMNS,
    sorting: () => props.sorting !== false,
    selection: () => (props.selectable !== false ? 'multiple' : undefined),
    expandable: () => Boolean(props.expandable),
    pagination: paginated ? { pageSizes: [5, 10, 20] } : false,
    resizable: () => props.resizable === true,
    manual: () => props.remote === true,
    rowCount: () => (props.remote ? props.serverTotal() : undefined),
    state: {
      sorting: () => (props.remote ? props.remoteSorting() : undefined),
      pagination: () => (props.remote ? props.remotePagination() : undefined),
    },
    onSortingChange: (next) => props.remote && props.setRemoteSorting(next),
    onPaginationChange: (next) => props.remote && props.setRemotePagination(next),
  })

  return (
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
      loading={props.loading || (props.remote && props.remoteLoading())}
      classes={{ container: 'border border-border rounded-lg' }}
    />
  )
}

export default function DataTablePlayground(props: PlaygroundProps) {
  const [nameQuery, setNameQuery] = createSignal('')
  const [roleFilter, setRoleFilter] = createSignal<string | undefined>(undefined)
  const [remoteSorting, setRemoteSorting] = createSignal<DataTableT.State['sorting']>([], {
    equals: (a, b) =>
      a.length === b.length && a.every((s, i) => s.id === b[i]?.id && s.desc === b[i]?.desc),
  })
  const [remotePagination, setRemotePagination] = createSignal<DataTableT.State['pagination']>(
    { pageIndex: 0, pageSize: 5 },
    {
      equals: (a, b) => a.pageIndex === b.pageIndex && a.pageSize === b.pageSize,
    },
  )
  const [remoteLoading, setRemoteLoading] = createSignal(false)

  const fetchRemoteRows = (): { rows: Employee[]; total: number } => {
    const q = nameQuery().trim().toLowerCase()
    const role = roleFilter()
    let rows = ALL_EMPLOYEES.filter(
      (emp) => (!q || emp.name.toLowerCase().includes(q)) && (!role || emp.role === role),
    )

    const [sort] = remoteSorting()
    if (sort) {
      const key = sort.id as keyof Employee
      rows = [...rows].sort(
        (a, b) => `${a[key] ?? ''}`.localeCompare(`${b[key] ?? ''}`) * (sort.desc ? -1 : 1),
      )
    }

    const total = rows.length
    if (props.pagination !== false) {
      const { pageIndex, pageSize } = remotePagination()
      rows = rows.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize)
    }
    return { rows, total }
  }

  const [serverRows, setServerRows] = createSignal(fetchRemoteRows().rows)
  const [serverTotal, setServerTotal] = createSignal(fetchRemoteRows().total)

  const filteredLocalData = () => {
    const q = nameQuery().trim().toLowerCase()
    const role = roleFilter()
    return ALL_EMPLOYEES.filter(
      (emp) => (!q || emp.name.toLowerCase().includes(q)) && (!role || emp.role === role),
    )
  }

  createEffect(
    on(
      () => [props.remote, nameQuery(), roleFilter(), remoteSorting(), remotePagination()] as const,
      () => {
        if (!props.remote) {
          setRemoteLoading(false)
          return
        }
        setRemoteLoading(true)
        const timer = setTimeout(() => {
          const { rows, total } = fetchRemoteRows()
          setServerTotal(total)
          setServerRows(rows)
          setRemoteLoading(false)
        }, 300)

        onCleanup(() => clearTimeout(timer))
      },
    ),
  )

  const hasFilter = () => Boolean(nameQuery()) || Boolean(roleFilter())

  const handleRemoteSorting = (next: DataTableT.State['sorting']) => {
    setRemoteSorting(next)
    setRemotePagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  const handleReset = () => {
    setNameQuery('')
    setRoleFilter(undefined)
    if (props.remote) {
      setRemoteSorting([])
      setRemotePagination((prev) => ({ ...prev, pageIndex: 0 }))
    }
  }

  const instanceKey = () =>
    `${props.pagination}-${props.selectable}-${props.expandable}-${props.sorting}-${props.resizable}`

  return (
    <div class="flex flex-col gap-3 w-full">
      <div class="flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Filter by name..."
          value={nameQuery()}
          onValueChange={(val) => {
            setNameQuery(val ?? '')
            if (props.remote) {
              setRemotePagination((prev) => ({ ...prev, pageIndex: 0 }))
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
              setRemotePagination((prev) => ({ ...prev, pageIndex: 0 }))
            }
          }}
          allowClear
          class="w-44"
        />
        <Button variant="outline" onClick={handleReset} disabled={!hasFilter()}>
          Reset
        </Button>
      </div>

      <Show keyed when={instanceKey()}>
        <PlaygroundTable
          size={props.size}
          striped={props.striped}
          hoverEffect={props.hoverEffect}
          showBorder={props.showBorder}
          sorting={props.sorting}
          selectable={props.selectable}
          pagination={props.pagination}
          sticky={props.sticky}
          resizable={props.resizable}
          expandable={props.expandable}
          loading={props.loading}
          remote={props.remote}
          remoteSorting={remoteSorting}
          setRemoteSorting={handleRemoteSorting}
          remotePagination={remotePagination}
          setRemotePagination={setRemotePagination}
          remoteLoading={remoteLoading}
          serverRows={serverRows}
          serverTotal={serverTotal}
          filteredLocalData={filteredLocalData}
        />
      </Show>
    </div>
  )
}
