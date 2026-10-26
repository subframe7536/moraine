import { DataTable, createSelectColumn, getDefaultDataTableFeatures } from '@src'
import { createTable } from '@tanstack/solid-table'
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
  createSelectColumn(),
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'role', header: 'Role' },
]

export default function BasicExample() {
  const table = createTable({
    features: getDefaultDataTableFeatures({ pagination: false }),
    columns,
    data,
  })

  return <DataTable table={table} classes={{ container: 'border border-border rounded-lg' }} />
}
