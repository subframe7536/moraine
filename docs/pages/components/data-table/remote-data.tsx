import { Alert, Button, Input, Switch } from '@src'
import { DataTable, createDataTable } from '@src/data-table'
import type { DataTableT } from '@src/data-table'
import type { PaginationState, SortingState } from '@tanstack/solid-table'
import { Show, createMemo, createResource, createSignal, onCleanup, untrack } from 'solid-js'

interface Product {
  id: number
  title: string
  brand?: string
  category: string
  price: number
  rating: number
  stock: number
}

interface ProductQuery {
  pageIndex: number
  pageSize: number
  sorting: SortingState
  search: string
}

interface ProductPage {
  products: Product[]
  total: number
}

const BRANDS = ['Apple', 'Samsung', 'Sony', 'Lenovo', 'Dell', undefined]
const CATEGORIES = ['laptops', 'smartphones', 'tablets', 'audio', 'accessories']
const MODELS = ['Laptop', 'Phone', 'Tablet', 'Headphones', 'Charger']

// Stands in for the remote database: the client only ever receives one page of it.
const REMOTE_PRODUCTS: Product[] = Array.from({ length: 186 }, (_, index) => ({
  id: index + 1,
  title: `${MODELS[index % MODELS.length]} ${String(index + 1).padStart(3, '0')}`,
  brand: BRANDS[index % BRANDS.length],
  category: CATEGORIES[index % CATEGORIES.length]!,
  price: ((index * 7919) % 200_000) / 100 + 9.99,
  rating: ((index * 37) % 50) / 10,
  stock: (index * 13) % 120,
}))

const LATENCY = 600

// Simulates `fetch`: resolves after a delay, rejects when aborted, and can be told to fail.
function fetchProducts(
  query: ProductQuery,
  options: { signal: AbortSignal; fail: boolean },
): Promise<ProductPage> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      options.signal.removeEventListener('abort', onAbort)
      if (options.fail) {
        reject(new Error('The server responded with 503.'))
        return
      }
      const search = query.search.trim().toLowerCase()
      let products = search
        ? REMOTE_PRODUCTS.filter((product) =>
            [product.title, product.brand ?? '', product.category].some((value) =>
              value.toLowerCase().includes(search),
            ),
          )
        : REMOTE_PRODUCTS
      const [sort] = query.sorting
      if (sort) {
        const key = sort.id as keyof Product
        products = [...products].sort((a, b) => {
          const left = a[key] ?? ''
          const right = b[key] ?? ''
          const order = left < right ? -1 : left > right ? 1 : 0
          return sort.desc ? -order : order
        })
      }
      const start = query.pageIndex * query.pageSize
      resolve({ products: products.slice(start, start + query.pageSize), total: products.length })
    }, LATENCY)
    const onAbort = () => {
      clearTimeout(timer)
      reject(new DOMException('The request was aborted.', 'AbortError'))
    }
    options.signal.addEventListener('abort', onAbort, { once: true })
  })
}

const COLUMNS: DataTableT.Column<Product>[] = [
  { accessorKey: 'title', header: 'Product', meta: { truncated: true } },
  {
    accessorKey: 'brand',
    header: 'Brand',
    cell: (props) => <>{props.row.original.brand ?? '—'}</>,
  },
  { accessorKey: 'category', header: 'Category' },
  {
    accessorKey: 'price',
    header: 'Price',
    meta: { align: 'right' },
    cell: (props) => <span class="tabular-nums">${props.row.original.price.toFixed(2)}</span>,
  },
  {
    accessorKey: 'rating',
    header: 'Rating',
    meta: { align: 'right' },
    cell: (props) => <span class="tabular-nums">{props.row.original.rating.toFixed(1)}</span>,
  },
  {
    accessorKey: 'stock',
    header: 'Stock',
    meta: { align: 'right' },
    cell: (props) => <span class="tabular-nums">{props.row.original.stock}</span>,
  },
]

const SEARCH_DELAY = 300

export default function RemoteDataExample() {
  const [sorting, setSorting] = createSignal<SortingState>([])
  const [pagination, setPagination] = createSignal<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const [searchInput, setSearchInput] = createSignal('')
  const [search, setSearch] = createSignal('')
  const [fail, setFail] = createSignal(false)

  let searchTimer: ReturnType<typeof setTimeout> | undefined
  const onSearchInput = (value: string) => {
    setSearchInput(value)
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      setSearch(value)
      setPagination((current) => ({ ...current, pageIndex: 0 }))
    }, SEARCH_DELAY)
  }
  // Only the latest request matters, so a new query aborts the one still in flight.
  let controller: AbortController | undefined
  onCleanup(() => {
    clearTimeout(searchTimer)
    controller?.abort()
  })

  const query = createMemo<ProductQuery>(() => ({
    ...pagination(),
    sorting: sorting(),
    search: search(),
  }))
  const [page, { refetch }] = createResource(query, (next) => {
    controller?.abort()
    controller = new AbortController()
    return fetchProducts(next, { signal: controller.signal, fail: untrack(fail) })
  })
  // `latest` throws while the resource holds an error, so keep the last page until a retry succeeds.
  const rows = createMemo<Product[]>(
    (previous) => (page.error ? previous : (page.latest?.products ?? previous)),
    [],
  )
  const total = createMemo<number>(
    (previous) => (page.error ? previous : (page.latest?.total ?? previous)),
    0,
  )

  const table = createDataTable({
    get data() {
      return rows()
    },
    columns: COLUMNS,
    getRowId: (row) => String(row.id),
    manual: true,
    get rowCount() {
      return total()
    },
    pagination: { pageSize: 10, pageSizes: [10, 20, 50] },
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
    // The simulated API sorts by one field.
    tableOptions: { enableMultiSort: false },
  })

  return (
    <div class="flex flex-col gap-3 w-full">
      <div class="max-w-xs w-full">
        <Input
          aria-label="Search products"
          placeholder="Search products..."
          value={searchInput()}
          onValueChange={onSearchInput}
        />
      </div>
      <Switch label="Simulate server errors" checked={fail()} onCheckedChange={setFail} />
      <Show when={page.error as Error | undefined}>
        {(error) => (
          <Alert
            type="error"
            title="Could not load products"
            description={error().message}
            actions={
              <Button size="sm" variant="outline" onClick={() => void refetch()}>
                Retry
              </Button>
            }
          />
        )}
      </Show>
      <DataTable table={table} aria-label="Products" loading={page.loading} />
    </div>
  )
}
