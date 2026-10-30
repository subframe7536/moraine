import { Badge } from '@src'
import { DataTable, createDataTable } from '@src/data-table'
import type { DataTableT } from '@src/data-table'
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

const FULFILLMENT = {
  delivered: { label: 'Delivered', tone: 'success' },
  in_transit: { label: 'In Transit', tone: 'info' },
  processing: { label: 'Processing', tone: 'warning' },
} as const

const COLUMNS: DataTableT.Column<Order>[] = [
  {
    accessorKey: 'id',
    header: 'Order #',
    size: 150,
    cell: (props) => <span class="text-xs font-medium font-mono">{props.row.original.id}</span>,
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
    cell: (props) => <span class="text-muted-foreground">{props.row.original.date}</span>,
  },
  {
    accessorKey: 'fulfillment',
    header: 'Fulfillment',
    size: 130,
    cell: (props) => {
      const fulfillment = () => FULFILLMENT[props.row.original.fulfillment]
      return (
        <Badge tone={fulfillment().tone} variant="subtle" size="sm">
          {fulfillment().label}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'total',
    header: 'Total',
    size: 120,
    meta: { align: 'right' },
    cell: (props) => <span class="font-medium tabular-nums">{props.row.original.total}</span>,
  },
]

export default function ExpandableRowsExample() {
  const table = createDataTable({
    data: ORDERS,
    columns: COLUMNS,
    expandable: true,
  })

  return (
    <div class="flex flex-col gap-3 w-full">
      <div class="text-sm text-muted-foreground">
        Click the chevron on any row to inspect its line items and shipping details.
      </div>
      <DataTable
        table={table}
        hoverEffect
        classes={{ container: 'border border-border rounded-lg' }}
        expandedRowRender={(props) => (
          <div class="flex flex-col gap-3">
            <div class="text-xs flex flex-wrap gap-x-6 gap-y-1">
              <div class="text-muted-foreground">
                <span class="text-foreground font-medium">Ship to:</span>{' '}
                {props.row.original.shippingAddress}
              </div>
              <div class="text-muted-foreground">
                <span class="text-foreground font-medium">Tracking:</span>{' '}
                <span class="font-mono">{props.row.original.tracking}</span>
              </div>
            </div>
            <div class="border border-border rounded-md bg-background divide-border divide-y">
              <For each={props.row.original.items}>
                {(item) => (
                  <div class="text-xs px-3 py-2 flex gap-4 items-center justify-between">
                    <div class="flex flex-col min-w-0">
                      <span class="text-foreground font-medium truncate">{item.name}</span>
                      <span class="text-muted-foreground font-mono">{item.sku}</span>
                    </div>
                    <div class="flex shrink-0 gap-6 items-center tabular-nums">
                      <span class="text-muted-foreground">
                        {item.qty} × {item.price}
                      </span>
                      <span class="text-foreground font-medium text-right w-16">{item.total}</span>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        )}
      />
    </div>
  )
}
