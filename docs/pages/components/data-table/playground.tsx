import {
  Button,
  DataTable,
  Input,
  Select,
  createExpandColumn,
  createSelectColumn,
  getDefaultDataTableFeatures,
} from '@src'
import { createTable } from '@tanstack/solid-table'
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/solid-table'
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

const COLUMNS: ColumnDef<any, Employee>[] = [
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
  stickyHeader?: boolean
  resizable?: boolean
  expandable?: boolean
  loading?: boolean
  remote?: boolean
}

interface PlaygroundTableProps extends PlaygroundProps {
  remoteSorting: () => SortingState
  setRemoteSorting: (value: SortingState) => void
  remotePagination: () => PaginationState
  setRemotePagination: (value: PaginationState) => void
  remoteLoading: () => boolean
  serverRows: () => Employee[]
  serverTotal: () => number
  filteredLocalData: () => Employee[]
}

function PlaygroundTable(props: PlaygroundTableProps) {
  // oxlint-disable-next-line subf/solid-reactivity -- Instance remounts when pagination changes.
  const paginated = props.pagination !== false
  const table = createTable({
    features: getDefaultDataTableFeatures({ pagination: paginated }),
    get columns() {
      let cols: ColumnDef<any, Employee>[] = [...COLUMNS]
      if (props.sorting === false) {
        cols = cols.map((column) => ({ ...column, enableSorting: false }))
      }
      if (props.expandable) {
        cols = [createExpandColumn(), ...cols]
      }
      if (props.selectable !== false) {
        cols = [createSelectColumn(), ...cols]
      }
      return cols
    },
    get data() {
      return props.remote ? props.serverRows() : props.filteredLocalData()
    },
    get rowCount() {
      return props.remote ? props.serverTotal() : undefined
    },
    get manualPagination() {
      return props.remote ? true : undefined
    },
    get manualSorting() {
      return props.remote ? true : undefined
    },
    get enableColumnResizing() {
      return props.resizable === true
    },
    getRowCanExpand: () => Boolean(props.expandable),
    autoResetPageIndex: false,
    state: {
      get sorting() {
        return props.remote ? props.remoteSorting() : undefined
      },
      get pagination() {
        return props.remote ? props.remotePagination() : undefined
      },
    },
    onSortingChange: (updater: SortingState | ((old: SortingState) => SortingState)) => {
      if (!props.remote) {
        return
      }
      const next = typeof updater === 'function' ? updater(props.remoteSorting()) : updater
      props.setRemoteSorting(next)
    },
    onPaginationChange: (
      updater: PaginationState | ((old: PaginationState) => PaginationState),
    ) => {
      if (!props.remote) {
        return
      }
      const next = typeof updater === 'function' ? updater(props.remotePagination()) : updater
      props.setRemotePagination(next)
    },
  })

  return (
    <DataTable
      table={table}
      size={props.size}
      striped={props.striped}
      hoverEffect={props.hoverEffect}
      showBorder={props.showBorder}
      stickyHeader={props.stickyHeader}
      maxHeight={props.stickyHeader ? 280 : undefined}
      expandedRowRender={
        props.expandable
          ? (row) => (
              <div class="text-muted-foreground">
                <span class="text-foreground font-medium">{row.original.name}</span> is a{' '}
                {row.original.role} in the {row.original.department} department.
              </div>
            )
          : undefined
      }
      loading={props.loading || (props.remote && props.remoteLoading())}
      pageSizeOptions={[5, 10, 20]}
      classes={{ container: 'border border-border rounded-lg' }}
    />
  )
}

export default function DataTablePlayground(props: PlaygroundProps) {
  const [nameQuery, setNameQuery] = createSignal('')
  const [roleFilter, setRoleFilter] = createSignal<string | undefined>(undefined)
  const [remoteSorting, setRemoteSorting] = createSignal<SortingState>([], {
    equals: (a, b) =>
      a.length === b.length && a.every((s, i) => s.id === b[i]?.id && s.desc === b[i]?.desc),
  })
  const [remotePagination, setRemotePagination] = createSignal<PaginationState>(
    { pageIndex: 0, pageSize: 5 },
    {
      equals: (a, b) => a.pageIndex === b.pageIndex && a.pageSize === b.pageSize,
    },
  )
  const [remoteLoading, setRemoteLoading] = createSignal(false)
  const [serverRows, setServerRows] = createSignal(ALL_EMPLOYEES.slice(0, 5))
  const [serverTotal, setServerTotal] = createSignal(ALL_EMPLOYEES.length)

  const filteredLocalData = () => {
    const q = nameQuery().trim().toLowerCase()
    const role = roleFilter()
    return ALL_EMPLOYEES.filter((emp) => {
      if (q && !emp.name.toLowerCase().includes(q)) {
        return false
      }
      if (role && role !== '' && emp.role !== role) {
        return false
      }
      return true
    })
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
          const q = nameQuery().trim().toLowerCase()
          const role = roleFilter()
          let filtered = ALL_EMPLOYEES.filter((emp) => {
            if (q && !emp.name.toLowerCase().includes(q)) {
              return false
            }
            if (role && role !== '' && emp.role !== role) {
              return false
            }
            return true
          })

          const sorting = remoteSorting()
          if (sorting.length > 0) {
            const sort = sorting[0]!
            const key = sort.id as keyof Employee
            filtered = [...filtered].sort((a, b) => {
              const va = `${a[key] ?? ''}`
              const vb = `${b[key] ?? ''}`
              const cmp = va.localeCompare(vb)
              return sort.desc ? -cmp : cmp
            })
          }

          const total = filtered.length
          setServerTotal(total)

          const { pageIndex, pageSize } = remotePagination()
          const start = pageIndex * pageSize
          const sliced = filtered.slice(start, start + pageSize)
          setServerRows(sliced)
          setRemoteLoading(false)
        }, 300)

        onCleanup(() => clearTimeout(timer))
      },
    ),
  )

  const hasFilter = () => Boolean(nameQuery()) || Boolean(roleFilter() && roleFilter() !== '')

  const handleReset = () => {
    setNameQuery('')
    setRoleFilter(undefined)
    if (props.remote) {
      setRemotePagination((prev) => ({ ...prev, pageIndex: 0 }))
    }
  }

  const instanceKey = () =>
    `${props.pagination}-${props.selectable}-${props.expandable}-${props.sorting}-${props.resizable}-${props.remote}`

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
          stickyHeader={props.stickyHeader}
          resizable={props.resizable}
          expandable={props.expandable}
          loading={props.loading}
          remote={props.remote}
          remoteSorting={remoteSorting}
          setRemoteSorting={setRemoteSorting}
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
