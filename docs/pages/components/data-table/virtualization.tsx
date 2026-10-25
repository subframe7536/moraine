import type { ColumnDef, Row } from '@tanstack/solid-table'
import { Badge, DataTable } from 'moraine'
import { createTableVirtualizer } from 'moraine/virtualizer'

interface TaskRecord {
  id: number
  task: string
  department: string
  priority: string
  views: number
  created: string
}

const ROWS: TaskRecord[] = Array.from({ length: 10_000 }, (_, index) => ({
  id: index + 1,
  task: `Task item #${index + 1}`,
  department: ['Platform', 'Product', 'Infrastructure', 'Security', 'Design System'][index % 5]!,
  priority: ['Low', 'Medium', 'High', 'Critical'][index % 4]!,
  views: ((index * 37) % 800) + 12,
  created: '2026-03-24',
}))

const COLUMNS: ColumnDef<any, TaskRecord>[] = [
  { accessorKey: 'id', header: 'ID', size: 80 },
  { accessorKey: 'task', header: 'Task Name' },
  { accessorKey: 'department', header: 'Department' },
  {
    accessorKey: 'priority',
    header: 'Priority',
    cell: (info) => (
      <Badge
        variant="subtle"
        tone={
          info.getValue() === 'Critical'
            ? 'danger'
            : info.getValue() === 'High'
              ? 'warning'
              : 'neutral'
        }
      >
        {String(info.getValue())}
      </Badge>
    ),
  },
  {
    accessorKey: 'views',
    header: 'Views',
    meta: { align: 'right' },
  },
  { accessorKey: 'created', header: 'Created' },
]

export default function VirtualizationExample() {
  const virtualizer = createTableVirtualizer<Row<any, TaskRecord>>({
    estimateSize: () => 41,
    getItemKey: (row) => row.id,
    overscan: 10,
  })

  return (
    <DataTable
      data={ROWS}
      columns={COLUMNS}
      virtualRender={virtualizer.virtualRender}
      classes={{
        container: 'max-h-80 overflow-y-auto border border-border rounded-lg',
        header: 'sticky top-0 bg-background z-10',
      }}
    />
  )
}
