import { Badge, Button, DataTable, DropdownMenu, createDataTable } from '@src'
import type { DataTableT } from '@src'

interface Customer {
  id: string
  name: string
  email: string
  avatar: string
  plan: 'Enterprise' | 'Pro' | 'Starter'
  spend: string
  invoices: number
  lastPayment: string
  method: string
  status: 'active' | 'past_due' | 'canceled'
}

const CUSTOMERS: Customer[] = [
  {
    id: 'CUST-8021',
    name: 'Sarah Connor',
    email: 'sarah.connor@cyberdyne.io',
    avatar: 'SC',
    plan: 'Enterprise',
    spend: '$4,800.00',
    invoices: 18,
    lastPayment: 'Oct 24, 2026',
    method: 'Visa •••• 4242',
    status: 'active',
  },
  {
    id: 'CUST-8022',
    name: 'Alexander Hayes',
    email: 'a.hayes@acme-corp.com',
    avatar: 'AH',
    plan: 'Enterprise',
    spend: '$7,250.00',
    invoices: 32,
    lastPayment: 'Oct 22, 2026',
    method: 'Mastercard •••• 8821',
    status: 'active',
  },
  {
    id: 'CUST-8023',
    name: 'Elena Rostova',
    email: 'elena@vanguard-tech.net',
    avatar: 'ER',
    plan: 'Pro',
    spend: '$1,450.00',
    invoices: 8,
    lastPayment: 'Sep 15, 2026',
    method: 'Bank Transfer',
    status: 'past_due',
  },
  {
    id: 'CUST-8024',
    name: 'David Kim',
    email: 'david.kim@nexus-labs.dev',
    avatar: 'DK',
    plan: 'Pro',
    spend: '$2,100.00',
    invoices: 12,
    lastPayment: 'Oct 19, 2026',
    method: 'Visa •••• 9912',
    status: 'active',
  },
  {
    id: 'CUST-8025',
    name: 'Mia Thorne',
    email: 'm.thorne@solis-energy.com',
    avatar: 'MT',
    plan: 'Starter',
    spend: '$490.00',
    invoices: 3,
    lastPayment: 'Aug 02, 2026',
    method: 'PayPal',
    status: 'canceled',
  },
  {
    id: 'CUST-8026',
    name: 'Lucas Silva',
    email: 'lucas@hyperion-cloud.io',
    avatar: 'LS',
    plan: 'Enterprise',
    spend: '$9,800.00',
    invoices: 45,
    lastPayment: 'Oct 25, 2026',
    method: 'Amex •••• 1004',
    status: 'active',
  },
]

const PLAN_TONE = {
  Enterprise: 'primary',
  Pro: 'info',
  Starter: 'neutral',
} as const

const STATUS = {
  active: { label: 'Active', tone: 'success' },
  past_due: { label: 'Past Due', tone: 'warning' },
  canceled: { label: 'Canceled', tone: 'danger' },
} as const

const COLUMNS: DataTableT.Column<Customer>[] = [
  {
    accessorKey: 'id',
    header: 'Customer ID',
    size: 130,
    cell: (props) => <span class="text-xs font-medium font-mono">{props.row.original.id}</span>,
  },
  {
    accessorKey: 'name',
    header: 'Customer',
    size: 260,
    cell: (props) => (
      <div class="flex gap-3 items-center">
        <div class="text-xs text-primary font-medium rounded-full bg-primary/10 flex shrink-0 size-8 items-center justify-center">
          {props.row.original.avatar}
        </div>
        <div class="flex flex-col min-w-0">
          <span class="text-foreground font-medium truncate">{props.row.original.name}</span>
          <span class="text-xs text-muted-foreground truncate">{props.row.original.email}</span>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'plan',
    header: 'Plan',
    size: 120,
    cell: (props) => (
      <Badge tone={PLAN_TONE[props.row.original.plan]} variant="subtle" size="sm">
        {props.row.original.plan}
      </Badge>
    ),
  },
  {
    accessorKey: 'spend',
    header: 'Monthly Spend',
    size: 140,
    meta: { align: 'right' },
    cell: (props) => <span class="font-medium tabular-nums">{props.row.original.spend}</span>,
  },
  {
    accessorKey: 'invoices',
    header: 'Invoices',
    size: 100,
    meta: { align: 'right' },
    cell: (props) => <span class="tabular-nums">{props.row.original.invoices}</span>,
  },
  {
    accessorKey: 'lastPayment',
    header: 'Last Payment',
    size: 140,
    cell: (props) => <span class="text-muted-foreground">{props.row.original.lastPayment}</span>,
  },
  {
    accessorKey: 'method',
    header: 'Billing Method',
    size: 180,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 120,
    cell: (props) => {
      const status = () => STATUS[props.row.original.status]
      return (
        <Badge tone={status().tone} variant="subtle" size="sm">
          {status().label}
        </Badge>
      )
    },
  },
  {
    id: 'actions',
    header: () => <span class="sr-only">Actions</span>,
    size: 56,
    meta: { align: 'center' },
    cell: (props) => (
      <DropdownMenu>
        <DropdownMenu.Trigger
          as={Button}
          variant="ghost"
          size="icon-sm"
          leading="i-lucide:ellipsis"
          aria-label={`Open actions for ${props.row.original.name}`}
        />
        <DropdownMenu.Content
          items={[
            {
              label: 'View customer profile',
              onSelect: () => console.log('Viewing', props.row.original.id),
            },
            {
              label: 'Download tax invoices',
              onSelect: () => console.log('Invoices for', props.row.original.id),
            },
            {
              label: 'Manage subscription',
              onSelect: () => console.log('Managing', props.row.original.id),
            },
          ]}
        />
      </DropdownMenu>
    ),
  },
]

export default function PinnedColumnsExample() {
  const table = createDataTable({
    data: CUSTOMERS,
    columns: COLUMNS,
    selection: 'multiple',
    initialState: {
      columnPinning: { start: ['select', 'id'], end: ['actions'] },
    },
  })

  return (
    <div class="flex flex-col gap-3 w-full">
      <div class="text-sm text-muted-foreground">
        Scroll horizontally: the selection and Customer ID columns stay pinned on the left, and the
        actions column stays pinned on the right.
      </div>
      <DataTable
        table={table}
        hoverEffect
        classes={{ container: 'border border-border rounded-lg' }}
      />
    </div>
  )
}
