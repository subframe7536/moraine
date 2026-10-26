import { Badge, DataTable, createDataTable } from '@src'
import type { DataTableT } from '@src'
import { createTableVirtualizer } from '@src/virtualizer'

interface TaskRecord {
  id: number
  task: string
  department: string
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  views: number
  created: string
}

const ROW_HEIGHT = 37

const ROWS: TaskRecord[] = Array.from({ length: 10_000 }, (_, index) => ({
  id: index + 1,
  task: `Task item #${index + 1}`,
  department: ['Platform', 'Product', 'Infrastructure', 'Security', 'Design System'][index % 5]!,
  priority: (['Low', 'Medium', 'High', 'Critical'] as const)[index % 4]!,
  views: ((index * 37) % 800) + 12,
  created: '2026-03-24',
}))

const PRIORITY_TONE = {
  Low: 'neutral',
  Medium: 'info',
  High: 'warning',
  Critical: 'danger',
} as const

const COLUMNS: DataTableT.Column<TaskRecord>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 80,
    cell: (props) => (
      <span class="text-muted-foreground tabular-nums">{props.row.original.id}</span>
    ),
  },
  { accessorKey: 'task', header: 'Task Name' },
  { accessorKey: 'department', header: 'Department' },
  {
    accessorKey: 'priority',
    header: 'Priority',
    cell: (props) => (
      <Badge tone={PRIORITY_TONE[props.row.original.priority]} variant="subtle" size="sm">
        {props.row.original.priority}
      </Badge>
    ),
  },
  {
    accessorKey: 'views',
    header: 'Views',
    meta: { align: 'right' },
    cell: (props) => <span class="tabular-nums">{props.row.original.views}</span>,
  },
  {
    accessorKey: 'created',
    header: 'Created',
    cell: (props) => <span class="text-muted-foreground">{props.row.original.created}</span>,
  },
]

export default function VirtualizationExample() {
  const virtualizer = createTableVirtualizer<DataTableT.Row<TaskRecord>>({
    estimateSize: () => ROW_HEIGHT,
    getItemKey: (row) => row.id,
    overscan: 10,
  })

  const table = createDataTable({
    data: ROWS,
    columns: COLUMNS,
  })

  return (
    <DataTable
      table={table}
      virtualRender={virtualizer.virtualRender}
      sticky
      maxHeight={320}
      classes={{ container: 'border border-border rounded-lg' }}
    />
  )
}
