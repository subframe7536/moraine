import { Input } from '@src'
import { createDataTable } from '@src/data-table'
import type { DataTableT } from '@src/data-table'
import type { PaginationState, SortingState } from '@tanstack/table-core'
import { createMemo, createSignal, isPending, latest, onCleanup } from 'solid-js'
interface Order {
  id: string
  customer: string
  status: 'Pending' | 'Shipped' | 'Delivered'
  total: number
}

interface OrderQuery {
  pageIndex: number
  pageSize: number
  sorting: SortingState
  search: string
}

interface OrderPage {
  rows: Array<Order>
  total: number
}

const CUSTOMERS = ['Acme', 'Globex', 'Initech', 'Umbrella', 'Hooli', 'Stark', 'Wayne']
const STATUSES = ['Pending', 'Shipped', 'Delivered'] as const

// Stands in for a server: the client never holds these 240 rows.
const SERVER_ORDERS: Array<Order> = Array.from({ length: 240 }, (_, index) => ({
  id: `ORD-${String(index + 1).padStart(4, '0')}`,
  customer: CUSTOMERS[index % CUSTOMERS.length] ?? 'Acme',
  status: STATUSES[index % STATUSES.length] ?? STATUSES[0],
  total: ((index * 7919) % 90_000) / 100 + 10,
}))

async function fetchOrders(query: OrderQuery): Promise<OrderPage> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 400)
  })
  const search = query.search.trim().toLowerCase()
  let rows = search
    ? SERVER_ORDERS.filter((order) =>
        [order.id, order.customer, order.status].some((value) =>
          value.toLowerCase().includes(search),
        ),
      )
    : SERVER_ORDERS
  const [sort] = query.sorting
  if (sort) {
    const key = sort.id as keyof Order
    rows = [...rows].sort((a, b) => {
      const order = a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0
      return sort.desc ? -order : order
    })
  }
  const start = query.pageIndex * query.pageSize
  return { rows: rows.slice(start, start + query.pageSize), total: rows.length }
}

const COLUMNS: Array<DataTableT.Column<Order>> = [
  { accessorKey: 'id', header: 'Order' },
  { accessorKey: 'customer', header: 'Customer' },
  { accessorKey: 'status', header: 'Status' },
  {
    accessorKey: 'total',
    header: 'Total',
    meta: { align: 'end' },
    cell: (props) => <span class="tabular-nums">${props.row.original.total.toFixed(2)}</span>,
  },
]

const SEARCH_DELAY = 300

export default function ServerDataExample() {
  const [sorting, setSorting] = createSignal<SortingState>([])
  const [pagination, setPagination] = createSignal<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [searchInput, setSearchInput] = createSignal('')
  const [search, setSearch] = createSignal('')

  // Debounce typing, and go back to the first page whenever the search changes.
  let searchTimer: ReturnType<typeof setTimeout> | undefined
  const onSearchInput = (value: string) => {
    setSearchInput(value)
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      setSearch(value)
      setPagination((current) => ({ ...current, pageIndex: 0 }))
    }, SEARCH_DELAY)
  }
  onCleanup(() => clearTimeout(searchTimer))

  // Every state slice that changes the result goes into one query, so one change sends one request.
  const query = createMemo<OrderQuery>(() => ({
    ...pagination(),
    sorting: sorting(),
    search: search(),
  }))
  const page = createMemo(() => fetchOrders(query()))
  // Keep the previous page on screen while the next one loads; start empty before the first one.
  const rows = createMemo<Array<Order>>(() => latest(() => page()?.rows) ?? [], {
    loadingValue: [],
  })
  const total = createMemo<number>(() => latest(() => page()?.total) ?? 0, { loadingValue: 0 })

  const table = createDataTable({
    get data() {
      return rows()
    },
    columns: COLUMNS,
    getRowId: (row) => row.id,
    manual: true,
    get rowCount() {
      return total()
    },
    paginated: true,
    state: {
      get sorting() {
        return sorting()
      },
      get pagination() {
        return pagination()
      },
    },
    onSortingChange: (next) => {
      setSorting(next)
      setPagination((current) => ({ ...current, pageIndex: 0 }))
    },
    onPaginationChange: setPagination,
  })

  return (
    <div class="flex flex-col gap-3 w-full">
      <Input
        aria-label="Search orders"
        placeholder="Search order, customer, or status..."
        value={searchInput()}
        onValueChange={onSearchInput}
        class="max-w-xs"
      />
      <table.DataTable aria-label="Orders" loading={isPending(page)} />
    </div>
  )
}
