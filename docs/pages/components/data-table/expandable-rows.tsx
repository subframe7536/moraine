import { Badge, DataTable } from '@src'
import type { ColumnDef } from '@tanstack/solid-table'
import { For } from 'solid-js'

interface OrderItem {
  sku: string
  name: string
  qty: number
  price: string
  total: string
}

interface Order {
  id: string
  customer: string
  date: string
  total: string
  fulfillment: 'delivered' | 'in_transit' | 'processing'
  shippingAddress: string
  tracking: string
  items: OrderItem[]
}

const ORDERS: Order[] = [
  {
    id: 'ORD-2026-9041',
    customer: 'Catherine Vance',
    date: 'Oct 24, 2026',
    total: '$1,249.00',
    fulfillment: 'delivered',
    shippingAddress: '742 Evergreen Terrace, Springfield, OR 97477',
    tracking: '1Z9999999999999999',
    items: [
      {
        sku: 'HW-DISP-4K',
        name: 'UltraSharp 32" 4K Thunderbolt Monitor',
        qty: 1,
        price: '$899.00',
        total: '$899.00',
      },
      {
        sku: 'ACC-KBD-MECH',
        name: 'Custom Wireless Mechanical Keyboard',
        qty: 1,
        price: '$250.00',
        total: '$250.00',
      },
      {
        sku: 'CBL-TB4-2M',
        name: 'Active Thunderbolt 4 Pro Cable (2m)',
        qty: 1,
        price: '$100.00',
        total: '$100.00',
      },
    ],
  },
  {
    id: 'ORD-2026-9042',
    customer: 'Marcus Brody',
    date: 'Oct 24, 2026',
    total: '$340.00',
    fulfillment: 'in_transit',
    shippingAddress: '221B Baker Street, Marylebone, London NW1 6XE',
    tracking: '1Z8888888888888888',
    items: [
      {
        sku: 'ACC-MOU-ERG',
        name: 'Vertical Ergonomic Mouse with USB-C Dongle',
        qty: 2,
        price: '$120.00',
        total: '$240.00',
      },
      {
        sku: 'ACC-PAD-DESK',
        name: 'Waterproof Wool Felt Desk Mat (Large)',
        qty: 1,
        price: '$100.00',
        total: '$100.00',
      },
    ],
  },
  {
    id: 'ORD-2026-9043',
    customer: 'Liam Henderson',
    date: 'Oct 25, 2026',
    total: '$2,850.00',
    fulfillment: 'processing',
    shippingAddress: '1000 Vin Scully Ave, Los Angeles, CA 90012',
    tracking: 'Pending Label',
    items: [
      {
        sku: 'SRV-NODE-RACK',
        name: 'Compact 1U Rackmount Network Storage Appliance',
        qty: 1,
        price: '$2,450.00',
        total: '$2,450.00',
      },
      {
        sku: 'NET-SFP-10G',
        name: '10GBase-SR SFP+ Optical Transceiver Module',
        qty: 4,
        price: '$100.00',
        total: '$400.00',
      },
    ],
  },
]

const COLUMNS: ColumnDef<any, Order>[] = [
  {
    accessorKey: 'id',
    header: 'Order #',
    size: 150,
    cell: (props) => <span class="text-xs font-mono font-semibold">{props.row.original.id}</span>,
  },
  {
    accessorKey: 'customer',
    header: 'Customer',
    size: 180,
    cell: (props) => <span class="font-medium">{props.row.original.customer}</span>,
  },
  {
    accessorKey: 'date',
    header: 'Order Date',
    size: 140,
    cell: (props) => <span class="text-xs text-muted-foreground">{props.row.original.date}</span>,
  },
  {
    accessorKey: 'fulfillment',
    header: 'Fulfillment',
    size: 130,
    cell: (props) => {
      const f = () => props.row.original.fulfillment
      return (
        <Badge
          tone={f() === 'delivered' ? 'success' : f() === 'in_transit' ? 'info' : 'warning'}
          variant="subtle"
          size="sm"
        >
          {f() === 'delivered' ? 'Delivered' : f() === 'in_transit' ? 'In Transit' : 'Processing'}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'total',
    header: 'Total Amount',
    size: 140,
    meta: { align: 'right' },
    cell: (props) => (
      <span class="text-foreground font-medium font-mono">{props.row.original.total}</span>
    ),
  },
]

export default function ExpandableRowsExample() {
  return (
    <div class="flex flex-col gap-3 w-full">
      <div class="text-sm text-muted-foreground">
        Click the chevron icon on any row to expand and inspect its detailed line items and shipping
        info.
      </div>
      <DataTable
        data={ORDERS}
        columns={COLUMNS}
        expandable
        hoverEffect
        classes={{ container: 'border border-border rounded-lg' }}
        expandedRowRender={(row) => (
          <div class="p-4 border border-border/60 rounded-lg bg-muted/30 flex flex-col gap-3">
            <div class="pb-2 border-b border-border/50 flex flex-wrap gap-2 items-center justify-between">
              <div class="text-xs text-muted-foreground">
                <span class="text-foreground font-medium">Shipping To:</span>{' '}
                {row.original.shippingAddress}
              </div>
              <div class="text-xs font-mono px-2 py-1 border border-border rounded bg-background">
                Tracking: {row.original.tracking}
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <span class="text-xs text-muted-foreground tracking-wide font-semibold uppercase">
                Ordered Items ({row.original.items.length})
              </span>
              <div class="border border-border rounded-md bg-background divide-border/50 divide-y">
                <For each={row.original.items}>
                  {(item) => (
                    <div class="text-xs p-2.5 flex items-center justify-between">
                      <div class="flex flex-col">
                        <span class="text-foreground font-medium">{item.name}</span>
                        <span class="text-[11px] text-muted-foreground font-mono">
                          SKU: {item.sku}
                        </span>
                      </div>
                      <div class="flex gap-6 items-center tabular-nums">
                        <span class="text-muted-foreground">
                          {item.qty} × {item.price}
                        </span>
                        <span class="text-foreground font-medium text-right w-16">
                          {item.total}
                        </span>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </div>
        )}
      />
    </div>
  )
}
