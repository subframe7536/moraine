import { DataTable, createDataTable } from '@src/data-table'
import type { DataTableT } from '@src/data-table'
import { createTableVirtualizer } from '@src/virtualizer'

interface MetricRow {
  id: number
  server: string
  readings: number[]
}

const ROW_HEIGHT = 37
const HOUR_COUNT = 100

const REGIONS = ['eu-west', 'us-east', 'ap-south', 'sa-east'] as const

const ROWS: MetricRow[] = Array.from({ length: 10_000 }, (_, row) => ({
  id: row + 1,
  server: `${REGIONS[row % REGIONS.length]}-${String(row + 1).padStart(5, '0')}`,
  readings: Array.from({ length: HOUR_COUNT }, (_, hour) => ((row * 31 + hour * 17) % 97) + 1),
}))

const COLUMNS: DataTableT.Column<MetricRow>[] = [
  {
    accessorKey: 'server',
    header: 'Server',
    size: 160,
    cell: (props) => <span class="font-medium">{props.row.original.server}</span>,
  },
  ...Array.from({ length: HOUR_COUNT }, (_, hour): DataTableT.Column<MetricRow> => ({
    id: `h${hour}`,
    header: `H${hour + 1}`,
    accessorFn: (row) => row.readings[hour],
    size: 72,
    meta: { align: 'right' },
    cell: (props) => <span class="tabular-nums">{props.row.original.readings[hour]}%</span>,
  })),
]

export default function WideVirtualizationExample() {
  const virtualizer = createTableVirtualizer<DataTableT.Row<MetricRow>>({
    estimateSize: () => ROW_HEIGHT,
    getItemKey: (row) => row.id,
    overscan: 10,
    columns: { overscan: 2 },
  })

  const table = createDataTable({
    data: ROWS,
    columns: COLUMNS,
    getRowId: (row) => String(row.id),
    sorting: false,
    initialState: { columnPinning: { start: ['server'], end: [] } },
  })

  return (
    <DataTable
      table={table}
      virtualRender={virtualizer.virtualRender}
      sticky="header"
      maxHeight={360}
      size="sm"
      aria-label="CPU usage per hour"
      classes={{ container: 'border border-border rounded-lg' }}
    />
  )
}
