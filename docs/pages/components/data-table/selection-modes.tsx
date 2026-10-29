import { Badge, Button, ButtonGroup, ToggleButton } from '@src'
import { DataTable, createDataTable } from '@src/data-table'
import type { DataTableT } from '@src/data-table'
import { Show, createSignal } from 'solid-js'

interface ServerNode {
  id: string
  name: string
  cluster: string
  vcpu: number
  ram: string
  status: 'running' | 'stopped' | 'terminated'
}

const NODES: ServerNode[] = [
  {
    id: 'node-us-east-1a',
    name: 'api-ingress-gateway-01',
    cluster: 'k8s-prod-primary',
    vcpu: 16,
    ram: '64 GB',
    status: 'running',
  },
  {
    id: 'node-us-east-1b',
    name: 'api-ingress-gateway-02',
    cluster: 'k8s-prod-primary',
    vcpu: 16,
    ram: '64 GB',
    status: 'running',
  },
  {
    id: 'node-us-east-1c',
    name: 'worker-queue-consumer-01',
    cluster: 'k8s-prod-primary',
    vcpu: 32,
    ram: '128 GB',
    status: 'stopped',
  },
  {
    id: 'node-us-east-2a',
    name: 'analytics-clickhouse-replica',
    cluster: 'k8s-analytics-cluster',
    vcpu: 64,
    ram: '256 GB',
    status: 'running',
  },
  {
    id: 'node-us-east-2b',
    name: 'legacy-monolith-decom-01',
    cluster: 'k8s-legacy-decom',
    vcpu: 8,
    ram: '32 GB',
    status: 'terminated',
  },
  {
    id: 'node-us-east-2c',
    name: 'cache-redis-shard-01',
    cluster: 'k8s-prod-primary',
    vcpu: 16,
    ram: '64 GB',
    status: 'running',
  },
]

const NODE_STATUS = {
  running: { label: 'Running', tone: 'success' },
  stopped: { label: 'Stopped', tone: 'warning' },
  terminated: { label: 'Terminated', tone: 'neutral' },
} as const

const COLUMNS: DataTableT.Column<ServerNode>[] = [
  {
    accessorKey: 'id',
    header: 'Node ID',
    size: 160,
    cell: (props) => <span class="text-xs font-mono">{props.row.original.id}</span>,
  },
  {
    accessorKey: 'name',
    header: 'Instance Name',
    size: 220,
    cell: (props) => <span class="font-medium">{props.row.original.name}</span>,
  },
  {
    accessorKey: 'cluster',
    header: 'Cluster',
    size: 180,
    cell: (props) => <span class="text-muted-foreground">{props.row.original.cluster}</span>,
  },
  {
    accessorKey: 'vcpu',
    header: 'vCPU',
    size: 80,
    meta: { align: 'right' },
    cell: (props) => <span class="tabular-nums">{props.row.original.vcpu}</span>,
  },
  {
    accessorKey: 'ram',
    header: 'RAM',
    size: 90,
    meta: { align: 'right' },
    cell: (props) => <span class="tabular-nums">{props.row.original.ram}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 120,
    cell: (props) => {
      const status = () => NODE_STATUS[props.row.original.status]
      return (
        <Badge tone={status().tone} variant="subtle" size="sm">
          {status().label}
        </Badge>
      )
    },
  },
]

export default function SelectionModesExample() {
  const [mode, setMode] = createSignal<'multiple' | 'single'>('multiple')
  const [selectedRows, setSelectedRows] = createSignal<DataTableT.State['rowSelection']>({})

  const selectedCount = () => Object.keys(selectedRows()).length

  const changeMode = (next: 'multiple' | 'single') => {
    setMode(next)
    setSelectedRows({})
  }

  const table = createDataTable({
    data: NODES,
    columns: COLUMNS,
    get selection() {
      return mode()
    },
    canSelectRow: (row) => row.original.status !== 'terminated',
    state: {
      get rowSelection() {
        return selectedRows()
      },
    },
    onRowSelectionChange: setSelectedRows,
  })

  return (
    <div class="flex flex-col gap-3 w-full">
      <div class="flex flex-wrap gap-2 min-h-8 items-center justify-between">
        <ButtonGroup size="sm" variant="outline" aria-label="Selection mode">
          <ToggleButton
            pressed={mode() === 'multiple'}
            onPressedChange={() => changeMode('multiple')}
          >
            Multiple
          </ToggleButton>
          <ToggleButton pressed={mode() === 'single'} onPressedChange={() => changeMode('single')}>
            Single
          </ToggleButton>
        </ButtonGroup>

        <Show when={selectedCount() > 0}>
          <div class="flex gap-2 items-center">
            <span class="text-sm text-muted-foreground">{selectedCount()} selected</span>
            <Button size="sm" variant="outline" onClick={() => setSelectedRows({})}>
              Clear
            </Button>
            <Button size="sm" variant="solid" tone="primary">
              Restart
            </Button>
          </div>
        </Show>
      </div>

      <DataTable
        table={table}
        rowClass={(row) => row.original.status === 'terminated' && 'text-muted-foreground'}
        hoverEffect
        classes={{ container: 'border border-border rounded-lg' }}
      />

      <div class="text-xs text-muted-foreground">
        Terminated nodes are locked by <code class="font-mono">canSelectRow</code> and cannot be
        selected.
      </div>
    </div>
  )
}
