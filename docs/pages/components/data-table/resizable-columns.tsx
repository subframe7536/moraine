import { Badge, DataTable } from '@src'
import type { ColumnDef } from '@tanstack/solid-table'

interface ServiceMetric {
  id: string
  service: string
  region: string
  rps: number
  p95Latency: string
  errorRate: string
  cpu: string
  status: 'healthy' | 'degraded' | 'critical'
}

const METRICS: ServiceMetric[] = [
  {
    id: '1',
    service: 'auth-service',
    region: 'us-east-1 (N. Virginia)',
    rps: 14250,
    p95Latency: '18ms',
    errorRate: '0.01%',
    cpu: '34%',
    status: 'healthy',
  },
  {
    id: '2',
    service: 'payment-gateway',
    region: 'us-west-2 (Oregon)',
    rps: 3820,
    p95Latency: '142ms',
    errorRate: '0.24%',
    cpu: '68%',
    status: 'degraded',
  },
  {
    id: '3',
    service: 'search-indexer',
    region: 'eu-central-1 (Frankfurt)',
    rps: 8900,
    p95Latency: '35ms',
    errorRate: '0.00%',
    cpu: '52%',
    status: 'healthy',
  },
  {
    id: '4',
    service: 'notification-worker',
    region: 'ap-northeast-1 (Tokyo)',
    rps: 1200,
    p95Latency: '210ms',
    errorRate: '3.12%',
    cpu: '94%',
    status: 'critical',
  },
  {
    id: '5',
    service: 'media-transcoder',
    region: 'us-east-2 (Ohio)',
    rps: 450,
    p95Latency: '480ms',
    errorRate: '0.05%',
    cpu: '78%',
    status: 'healthy',
  },
]

const COLUMNS: ColumnDef<any, ServiceMetric>[] = [
  {
    accessorKey: 'service',
    header: 'Service Name',
    size: 200,
    minSize: 120,
    maxSize: 320,
    cell: (props) => <span class="text-foreground font-medium">{props.row.original.service}</span>,
  },
  {
    accessorKey: 'region',
    header: 'Deployment Region',
    size: 220,
    minSize: 160,
    maxSize: 360,
    cell: (props) => <span class="text-xs text-muted-foreground">{props.row.original.region}</span>,
  },
  {
    accessorKey: 'rps',
    header: 'Requests / sec',
    size: 150,
    minSize: 110,
    maxSize: 220,
    meta: { align: 'right' },
    cell: (props) => (
      <span class="font-mono tabular-nums">{props.row.original.rps.toLocaleString()}</span>
    ),
  },
  {
    accessorKey: 'p95Latency',
    header: 'Latency (p95)',
    size: 140,
    minSize: 100,
    maxSize: 200,
    meta: { align: 'right' },
    cell: (props) => (
      <span class="text-xs font-mono tabular-nums">{props.row.original.p95Latency}</span>
    ),
  },
  {
    accessorKey: 'errorRate',
    header: 'Error Rate',
    size: 130,
    minSize: 100,
    maxSize: 180,
    meta: { align: 'right' },
    cell: (props) => (
      <span
        class={`text-xs font-mono tabular-nums ${
          Number.parseFloat(props.row.original.errorRate) > 1
            ? 'text-danger font-semibold'
            : 'text-muted-foreground'
        }`}
      >
        {props.row.original.errorRate}
      </span>
    ),
  },
  {
    accessorKey: 'cpu',
    header: 'CPU Usage',
    size: 120,
    minSize: 90,
    maxSize: 180,
    meta: { align: 'right' },
    cell: (props) => <span class="text-xs font-mono tabular-nums">{props.row.original.cpu}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Health',
    size: 120,
    minSize: 100,
    maxSize: 180,
    cell: (props) => {
      const st = () => props.row.original.status
      return (
        <Badge
          tone={st() === 'healthy' ? 'success' : st() === 'degraded' ? 'warning' : 'danger'}
          variant="subtle"
          size="sm"
        >
          {st().toUpperCase()}
        </Badge>
      )
    },
  },
]

export default function ResizableColumnsExample() {
  return (
    <div class="flex flex-col gap-3 w-full">
      <div class="text-sm text-muted-foreground">
        Hover over the boundary between any two column headers and drag horizontally to resize
        column widths.
      </div>
      <DataTable
        data={METRICS}
        columns={COLUMNS}
        resizable
        showBorder="both"
        hoverEffect
        classes={{ container: 'border border-border rounded-lg' }}
      />
    </div>
  )
}
