import { DataTable } from '@src'
import type { ColumnDef } from '@tanstack/solid-table'

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

const columns: ColumnDef<any, User>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'role', header: 'Role' },
]

export default function BasicExample() {
  return <DataTable data={data} columns={columns} sorting selectable />
}
