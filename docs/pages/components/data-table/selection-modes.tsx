import { Badge, Button, DataTable } from '@src'
import type { ColumnDef, RowSelectionState } from '@tanstack/solid-table'
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

const COLUMNS: ColumnDef<any, ServerNode>[] = [
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
    cell: (props) => (
      <span class="text-xs text-muted-foreground">{props.row.original.cluster}</span>
    ),
  },
  {
    accessorKey: 'vcpu',
    header: 'vCPU',
    size: 100,
    meta: { align: 'center' },
    cell: (props) => <span class="font-mono tabular-nums">{props.row.original.vcpu}</span>,
  },
  {
    accessorKey: 'ram',
    header: 'RAM',
    size: 100,
    meta: { align: 'center' },
    cell: (props) => <span class="font-mono tabular-nums">{props.row.original.ram}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Node Status',
    size: 130,
    cell: (props) => {
      const s = () => props.row.original.status
      return (
        <Badge
          tone={s() === 'running' ? 'success' : s() === 'stopped' ? 'warning' : 'neutral'}
          variant="subtle"
          size="sm"
        >
          {s() === 'terminated' ? 'Terminated (Disabled)' : s().toUpperCase()}
        </Badge>
      )
    },
  },
]

export default function SelectionModesExample() {
  const [mode, setMode] = createSignal<'multiple' | 'single'>('multiple')
  const [selectedRows, setSelectedRows] = createSignal<RowSelectionState>({})

  const selectedCount = () => Object.keys(selectedRows()).length

  return (
    <div class="flex flex-col gap-3 w-full">
      <div class="p-3 border border-border rounded-lg bg-muted/40 flex flex-wrap gap-2 items-center justify-between">
        <div class="flex gap-2 items-center">
          <span class="text-xs text-muted-foreground font-semibold uppercase">Selection Mode:</span>
          <div class="p-0.5 border border-border rounded-md bg-background inline-flex">
            <button
              type="button"
              class={`text-xs font-medium px-2.5 py-1 rounded transition-colors ${
                mode() === 'multiple'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => {
                setMode('multiple')
                setSelectedRows({})
              }}
            >
              Multiple (Checkbox)
            </button>
            <button
              type="button"
              class={`text-xs font-medium px-2.5 py-1 rounded transition-colors ${
                mode() === 'single'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => {
                setMode('single')
                setSelectedRows({})
              }}
            >
              Single (Radio)
            </button>
          </div>
        </div>

        <Show when={selectedCount() > 0}>
          <div class="flex gap-2 items-center">
            <span class="text-xs text-foreground font-medium">
              {selectedCount()} node(s) selected
            </span>
            <Button size="sm" variant="outline" onClick={() => setSelectedRows({})}>
              Clear
            </Button>
            <Button size="sm" variant="solid" tone="primary">
              Restart
            </Button>
          </div>
        </Show>
      </div>

      <div class="text-xs text-muted-foreground">
        Note: Nodes with status{' '}
        <Badge tone="neutral" size="sm" variant="subtle">
          TERMINATED
        </Badge>{' '}
        are locked and cannot be selected (<code class="text-xs">isRowSelectable</code> check).
      </div>

      <DataTable
        data={NODES}
        columns={COLUMNS}
        selectable={mode()}
        currentRowSelection={selectedRows()}
        onRowSelectionChange={setSelectedRows}
        isRowSelectable={(row) => row.original.status !== 'terminated'}
        hoverEffect
        classes={{ container: 'border border-border rounded-lg' }}
      />
    </div>
  )
}
