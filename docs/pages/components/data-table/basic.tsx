import { DataTable, createDataTable } from '@src'
import type { DataTableT } from '@src'

interface User {
  id: string
  name: string
  role: string
}

const data: User[] = [
  { id: '1', name: 'Alice', role: 'Engineer' },
  { id: '2', name: 'Bob', role: 'Designer' },
  { id: '3', name: 'Charlie', role: 'Intern' },
]

const columns: DataTableT.Column<User>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'role', header: 'Role' },
]

export default function BasicExample() {
  const table = createDataTable({
    data,
    columns,
    selection: 'multiple',
  })

  return <DataTable table={table} classes={{ container: 'border border-border rounded-lg' }} />
}
