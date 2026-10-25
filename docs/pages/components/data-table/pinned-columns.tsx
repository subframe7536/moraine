import { Badge, Button, DropdownMenu, DataTable } from '@src'
import type { ColumnDef } from '@tanstack/solid-table'

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

const COLUMNS: ColumnDef<any, Customer>[] = [
  {
    accessorKey: 'id',
    header: 'Customer ID',
    size: 130,
    meta: {
      pinned: 'left',
      class: 'font-mono text-xs font-medium text-foreground',
    },
  },
  {
    accessorKey: 'name',
    header: 'Customer',
    size: 240,
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
      <Badge
        tone={
          props.row.original.plan === 'Enterprise'
            ? 'primary'
            : props.row.original.plan === 'Pro'
              ? 'info'
              : 'neutral'
        }
        variant="subtle"
        size="sm"
      >
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
    meta: { align: 'center' },
  },
  {
    accessorKey: 'lastPayment',
    header: 'Last Payment',
    size: 140,
    cell: (props) => (
      <span class="text-xs text-muted-foreground">{props.row.original.lastPayment}</span>
    ),
  },
  {
    accessorKey: 'method',
    header: 'Billing Method',
    size: 180,
    cell: (props) => <span class="text-xs">{props.row.original.method}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 120,
    cell: (props) => {
      const status = () => props.row.original.status
      return (
        <Badge
          tone={status() === 'active' ? 'success' : status() === 'past_due' ? 'warning' : 'danger'}
          variant="subtle"
          size="sm"
        >
          {status() === 'active' ? 'Active' : status() === 'past_due' ? 'Past Due' : 'Canceled'}
        </Badge>
      )
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    size: 90,
    meta: {
      pinned: 'right',
      align: 'center',
    },
    cell: (props) => (
      <DropdownMenu>
        <DropdownMenu.Trigger
          as={Button}
          variant="ghost"
          size="sm"
          class="p-0 size-8"
          aria-label="Open customer actions"
        >
          <span class="i-lucide:more-horizontal text-base" />
        </DropdownMenu.Trigger>
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
  return (
    <div class="flex flex-col gap-3 w-full">
      <div class="text-sm text-muted-foreground">
        Scroll horizontally to observe pinned Customer ID on the left and Actions on the right.
      </div>
      <DataTable
        data={CUSTOMERS}
        columns={COLUMNS}
        selectable
        hoverEffect
        showBorder="both"
        classes={{ container: 'border border-border rounded-lg' }}
      />
    </div>
  )
}
