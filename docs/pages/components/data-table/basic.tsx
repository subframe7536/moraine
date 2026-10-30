import { Badge } from '@src'
import { DataTable, createDataTable } from '@src/data-table'
import type { DataTableT } from '@src/data-table'

interface Member {
  id: string
  name: string
  email: string
  role: 'Owner' | 'Admin' | 'Member' | 'Viewer'
  team: string
  joined: string
}

const MEMBERS: Member[] = [
  {
    id: 'u1',
    name: 'Alice Johnson',
    email: 'alice@acme.dev',
    role: 'Owner',
    team: 'Platform',
    joined: '2023-02-14',
  },
  {
    id: 'u2',
    name: 'Bob Smith',
    email: 'bob@acme.dev',
    role: 'Admin',
    team: 'Product',
    joined: '2023-06-01',
  },
  {
    id: 'u3',
    name: 'Carmen Diaz',
    email: 'carmen@acme.dev',
    role: 'Member',
    team: 'Platform',
    joined: '2024-01-09',
  },
  {
    id: 'u4',
    name: 'Dmitri Ivanov',
    email: 'dmitri@acme.dev',
    role: 'Member',
    team: 'Security',
    joined: '2024-03-22',
  },
  {
    id: 'u5',
    name: 'Elena Novak',
    email: 'elena@acme.dev',
    role: 'Admin',
    team: 'Security',
    joined: '2023-11-30',
  },
  {
    id: 'u6',
    name: 'Farah Khan',
    email: 'farah@acme.dev',
    role: 'Viewer',
    team: 'Finance',
    joined: '2025-05-17',
  },
  {
    id: 'u7',
    name: 'Gus Moreau',
    email: 'gus@acme.dev',
    role: 'Member',
    team: 'Product',
    joined: '2024-08-04',
  },
  {
    id: 'u8',
    name: 'Hana Sato',
    email: 'hana@acme.dev',
    role: 'Member',
    team: 'Platform',
    joined: '2025-01-12',
  },
  {
    id: 'u9',
    name: 'Ivan Petrov',
    email: 'ivan@acme.dev',
    role: 'Viewer',
    team: 'Finance',
    joined: '2025-07-28',
  },
  {
    id: 'u10',
    name: 'Julia Weber',
    email: 'julia@acme.dev',
    role: 'Member',
    team: 'Product',
    joined: '2024-10-19',
  },
  {
    id: 'u11',
    name: 'Kofi Mensah',
    email: 'kofi@acme.dev',
    role: 'Admin',
    team: 'Platform',
    joined: '2023-09-05',
  },
  {
    id: 'u12',
    name: 'Lina Haddad',
    email: 'lina@acme.dev',
    role: 'Member',
    team: 'Security',
    joined: '2025-03-03',
  },
]

const ROLE_TONE = {
  Owner: 'primary',
  Admin: 'info',
  Member: 'neutral',
  Viewer: 'neutral',
} as const

// Sort roles by rank instead of alphabetically.
const ROLE_RANK: Record<Member['role'], number> = { Owner: 0, Admin: 1, Member: 2, Viewer: 3 }

const COLUMNS: DataTableT.Column<Member>[] = [
  {
    accessorKey: 'name',
    header: 'Member',
    cell: (props) => (
      <div class="flex flex-col">
        <span class="font-medium">{props.row.original.name}</span>
        <span class="text-xs text-muted-foreground">{props.row.original.email}</span>
      </div>
    ),
  },
  {
    accessorKey: 'role',
    header: 'Role',
    sortFn: (a, b) => ROLE_RANK[a.original.role] - ROLE_RANK[b.original.role],
    cell: (props) => (
      <Badge tone={ROLE_TONE[props.row.original.role]} variant="subtle" size="sm">
        {props.row.original.role}
      </Badge>
    ),
  },
  { accessorKey: 'team', header: 'Team' },
  {
    accessorKey: 'joined',
    header: 'Joined',
    cell: (props) => (
      <span class="text-muted-foreground tabular-nums">{props.row.original.joined}</span>
    ),
  },
]

export default function BasicExample() {
  const table = createDataTable({
    data: MEMBERS,
    columns: COLUMNS,
    getRowId: (member) => member.id,
    selection: 'multiple',
    pagination: { pageSize: 5 },
    initialState: { sorting: [{ id: 'role', desc: false }] },
  })

  return <DataTable table={table} aria-label="Team members" hoverEffect />
}
