import { Input } from '@src'
import { DataTable, createDataTable } from '@src/data-table'
import type { DataTableT } from '@src/data-table'
import type { CellContext } from '@tanstack/solid-table'
import type { JSX } from 'solid-js'
import { Show, createSignal } from 'solid-js'

interface Product {
  id: string
  name: string
  sku: string
  stock: number
}

type EditableKey = 'name' | 'stock'

interface EditingCell {
  rowId: string
  columnId: EditableKey
}

const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Desk lamp', sku: 'LMP-204', stock: 18 },
  { id: '2', name: 'Monitor arm', sku: 'ARM-118', stock: 7 },
  { id: '3', name: 'USB-C dock', sku: 'DCK-330', stock: 42 },
  { id: '4', name: 'Keyboard tray', sku: 'TRY-052', stock: 0 },
]

/** Returns an error message, or `undefined` when the draft is valid. */
function validate(columnId: EditableKey, draft: string): string | undefined {
  if (columnId === 'name') {
    return draft.trim() ? undefined : 'Name is required.'
  }
  return /^\d+$/.test(draft.trim()) ? undefined : 'Stock must be a whole number.'
}

export default function EditableCellsExample() {
  const [products, setProducts] = createSignal(INITIAL_PRODUCTS)
  const [editing, setEditing] = createSignal<EditingCell>()
  const [lastChange, setLastChange] = createSignal('Double-click a name or stock cell to edit it.')

  const isEditing = (rowId: string, columnId: EditableKey) =>
    editing()?.rowId === rowId && editing()?.columnId === columnId

  const commit = (rowId: string, columnId: EditableKey, draft: string) => {
    const value = columnId === 'stock' ? Number(draft.trim()) : draft.trim()
    const name = products().find((row) => row.id === rowId)?.name
    setProducts((rows) =>
      rows.map((row) => (row.id === rowId ? { ...row, [columnId]: value } : row)),
    )
    setEditing(undefined)
    setLastChange(`Saved ${columnId} of ${name}: ${value}`)
  }

  /** Renders a value that turns into an input on double-click, Enter, or F2. */
  function EditableCell(props: {
    context: CellContext<DataTableT.Features, Product>
    columnId: EditableKey
    label: string
    children: JSX.Element
  }): JSX.Element {
    const rowId = () => props.context.row.id
    const initial = () => String(props.context.row.original[props.columnId])
    const [draft, setDraft] = createSignal('')
    const error = () => validate(props.columnId, draft())

    const start = () => {
      setDraft(initial())
      setEditing({ rowId: rowId(), columnId: props.columnId })
    }
    const cancel = () => setEditing(undefined)
    const save = () => {
      // Removing the input fires `blur` after Enter or Escape has already finished the edit.
      if (!isEditing(rowId(), props.columnId) || error()) {
        return
      }
      if (draft().trim() === initial()) {
        cancel()
        return
      }
      commit(rowId(), props.columnId, draft())
    }

    return (
      <Show
        when={isEditing(rowId(), props.columnId)}
        fallback={
          <div
            role="button"
            tabIndex={0}
            aria-label={`Edit ${props.label}: ${initial()}`}
            class="px-1 py-0.5 rounded min-h-6 cursor-text -mx-1 focus-visible:(outline-none ring-2 ring-ring/50) hover:bg-accent/60"
            onDblClick={start}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === 'F2') {
                event.preventDefault()
                start()
              }
            }}
          >
            {props.children}
          </div>
        }
      >
        <div class="flex flex-col gap-1">
          <Input
            aria-label={props.label}
            aria-invalid={error() ? true : undefined}
            size="sm"
            autofocus
            inputMode={props.columnId === 'stock' ? 'numeric' : undefined}
            value={draft()}
            onValueChange={setDraft}
            onBlur={save}
            onKeyDown={(event: KeyboardEvent) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                save()
              } else if (event.key === 'Escape') {
                event.preventDefault()
                cancel()
              }
            }}
          />
          <Show when={error()}>
            <span class="text-xs text-danger">{error()}</span>
          </Show>
        </div>
      </Show>
    )
  }

  const columns: DataTableT.Column<Product>[] = [
    {
      accessorKey: 'name',
      header: 'Product',
      size: 240,
      cell: (context) => (
        <EditableCell context={context} columnId="name" label="Product name">
          {context.row.original.name}
        </EditableCell>
      ),
    },
    {
      accessorKey: 'sku',
      header: 'SKU',
      size: 120,
      cell: (context) => <span class="text-muted-foreground">{context.row.original.sku}</span>,
    },
    {
      accessorKey: 'stock',
      header: 'Stock',
      size: 120,
      meta: { align: 'right' },
      cell: (context) => (
        <EditableCell context={context} columnId="stock" label="Stock">
          <span class="tabular-nums">{context.row.original.stock}</span>
        </EditableCell>
      ),
    },
  ]

  const table = createDataTable({
    get data() {
      return products()
    },
    columns,
    getRowId: (row) => row.id,
  })

  return (
    <div class="flex flex-col gap-3 w-full">
      <DataTable table={table} aria-label="Inventory" />
      <p class="text-sm text-muted-foreground" aria-live="polite">
        {lastChange()}
      </p>
    </div>
  )
}
