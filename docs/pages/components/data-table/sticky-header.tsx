import { Badge, DataTable, createDataTable } from '@src'
import type { DataTableT } from '@src'

interface AuditEvent {
  id: string
  timestamp: string
  actor: string
  action: string
  resource: string
  ip: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

const AUDIT_EVENTS: AuditEvent[] = Array.from({ length: 30 }, (_, i) => {
  const severities: AuditEvent['severity'][] = ['low', 'medium', 'high', 'critical']
  const actions = [
    'iam.role.assume',
    's3.object.put',
    'auth.mfa.verify',
    'kms.key.decrypt',
    'k8s.pod.restart',
    'db.cluster.snapshot',
    'api.token.generate',
  ]
  const actors = [
    'dev-deployer@internal.corp',
    'admin.ops@internal.corp',
    'github-actions[bot]',
    'security-scanner@internal.corp',
    'app-backend-svc',
  ]
  const pad = (n: number) => String(n).padStart(2, '0')
  const date = `2026-10-25 10:${pad(59 - i)}:${pad((i * 7) % 60)}`

  return {
    id: `EVT-${1000 + i}`,
    timestamp: date,
    actor: actors[i % actors.length]!,
    action: actions[i % actions.length]!,
    resource: `arn:aws:prod:service/${actions[i % actions.length]!.split('.')[0]}-${(i % 5) + 1}`,
    ip: `192.168.${(i % 10) + 1}.${((i * 13) % 254) + 1}`,
    severity: severities[i % severities.length]!,
  }
})

const SEVERITY = {
  low: { label: 'Low', tone: 'neutral' },
  medium: { label: 'Medium', tone: 'info' },
  high: { label: 'High', tone: 'warning' },
  critical: { label: 'Critical', tone: 'danger' },
} as const

const COLUMNS: DataTableT.Column<AuditEvent>[] = [
  {
    accessorKey: 'timestamp',
    header: 'Timestamp',
    size: 170,
    cell: (props) => (
      <span class="text-xs text-muted-foreground font-mono">{props.row.original.timestamp}</span>
    ),
  },
  {
    accessorKey: 'actor',
    header: 'Principal / Actor',
    size: 200,
    cell: (props) => <span class="font-medium">{props.row.original.actor}</span>,
  },
  {
    accessorKey: 'action',
    header: 'Action',
    size: 180,
    cell: (props) => (
      <span class="text-xs font-mono px-1.5 py-0.5 border border-border rounded bg-muted">
        {props.row.original.action}
      </span>
    ),
  },
  {
    accessorKey: 'resource',
    header: 'Target Resource',
    size: 240,
    cell: (props) => (
      <span class="text-xs text-muted-foreground font-mono">{props.row.original.resource}</span>
    ),
  },
  {
    accessorKey: 'ip',
    header: 'IP Address',
    size: 140,
    cell: (props) => (
      <span class="text-xs text-muted-foreground font-mono">{props.row.original.ip}</span>
    ),
  },
  {
    accessorKey: 'severity',
    header: 'Severity',
    size: 110,
    cell: (props) => {
      const severity = () => SEVERITY[props.row.original.severity]
      return (
        <Badge tone={severity().tone} variant="subtle" size="sm">
          {severity().label}
        </Badge>
      )
    },
  },
]

export default function StickyHeaderExample() {
  const table = createDataTable({
    data: AUDIT_EVENTS,
    columns: COLUMNS,
  })

  return (
    <div class="flex flex-col gap-3 w-full">
      <div class="text-sm text-muted-foreground">
        Scroll through 30 audit events; the header stays pinned to the top of the container.
      </div>
      <DataTable
        table={table}
        stickyHeader
        maxHeight={360}
        hoverEffect
        size="sm"
        classes={{ container: 'border border-border rounded-lg' }}
      />
    </div>
  )
}
