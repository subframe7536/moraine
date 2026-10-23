import { Badge, Button, Checkbox, DropdownMenu, Icon, Input, Table } from '@src'
import type { BadgeT, DropdownMenuT } from '@src'
import {
  createSolidTable,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from '@tanstack/solid-table'
import type {
  ColumnDef,
  ColumnFiltersState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/solid-table'
import { createMemo, createSignal, For, Show } from 'solid-js'

export interface Payment {
  id: string
  amount: number
  status: 'pending' | 'processing' | 'success' | 'failed'
  email: string
  client: string
}

const INITIAL_DATA: Payment[] = [
  {
    id: 'm5gr84i9',
    amount: 316,
    status: 'success',
    email: 'ken99@yahoo.com',
    client: 'Ken Thompson',
  },
  {
    id: '3u1reuv4',
    amount: 242,
    status: 'success',
    email: 'abe45@gmail.com',
    client: 'Abe Lincoln',
  },
  {
    id: 'derv1ws0',
    amount: 837,
    status: 'processing',
    email: 'monserrat44@gmail.com',
    client: 'Monserrat R.',
  },
  {
    id: '5kma53ae',
    amount: 874,
    status: 'success',
    email: 'silas22@gmail.com',
    client: 'Silas Marner',
  },
  {
    id: 'bhqecj4p',
    amount: 721,
    status: 'failed',
    email: 'carmella@hotmail.com',
    client: 'Carmella Bing',
  },
  {
    id: '728ed52f',
    amount: 100,
    status: 'pending',
    email: 'alex.smith@example.com',
    client: 'Alex Smith',
  },
  {
    id: '928ed52a',
    amount: 540,
    status: 'success',
    email: 'sarah.j@example.com',
    client: 'Sarah Jenkins',
  },
]

function getStatusBadgeTone(status: Payment['status']): BadgeT.Variants['tone'] {
  switch (status) {
    case 'success':
      return 'success'
    case 'processing':
      return 'info'
    case 'pending':
      return 'warning'
    case 'failed':
      return 'danger'
  }
}

export function DataTable() {
  const [data] = createSignal<Payment[]>(INITIAL_DATA)
  const [sorting, setSorting] = createSignal<SortingState>([])
  const [columnFilters, setColumnFilters] = createSignal<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = createSignal<VisibilityState>({})
  const [rowSelection, setRowSelection] = createSignal<RowSelectionState>({})

  const columns: ColumnDef<Payment>[] = [
    {
      id: 'select',
      header: (props) => (
        <Checkbox
          checked={
            props.table.getIsAllPageRowsSelected()
              ? true
              : props.table.getIsSomePageRowsSelected()
                ? 'indeterminate'
                : false
          }
          onCheckedChange={(value) => props.table.toggleAllPageRowsSelected(value)}
          aria-label="Select all rows"
        />
      ),
      cell: (props) => (
        <Checkbox
          checked={props.row.getIsSelected()}
          onCheckedChange={(value) => props.row.toggleSelected(value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'client',
      header: 'Client',
      cell: (props) => <span class="font-medium">{props.row.getValue('client')}</span>,
    },
    {
      accessorKey: 'email',
      header: (props) => {
        const isSorted = () => props.column.getIsSorted()
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => props.column.toggleSorting(isSorted() === 'asc')}
            class="h-8 -ml-3"
          >
            Email
            <Show
              when={isSorted()}
              fallback={
                <Icon name="i-lucide:arrow-up-down" class="text-muted-foreground ml-2 h-4 w-4" />
              }
            >
              {(direction) => (
                <Icon
                  name={direction() === 'asc' ? 'i-lucide:arrow-up' : 'i-lucide:arrow-down'}
                  class="ml-2 h-4 w-4"
                />
              )}
            </Show>
          </Button>
        )
      },
      cell: (props) => (
        <span class="text-muted-foreground lowercase">{props.row.getValue('email')}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: (props) => {
        const status = () => props.row.getValue('status') as Payment['status']
        return (
          <Badge tone={getStatusBadgeTone(status())} variant="subtle" class="capitalize">
            {status()}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'amount',
      header: (props) => {
        const isSorted = () => props.column.getIsSorted()
        return (
          <div class="text-right">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => props.column.toggleSorting(isSorted() === 'asc')}
              class="h-8 -mr-3"
            >
              Amount
              <Show
                when={isSorted()}
                fallback={
                  <Icon name="i-lucide:arrow-up-down" class="text-muted-foreground ml-2 h-4 w-4" />
                }
              >
                {(direction) => (
                  <Icon
                    name={direction() === 'asc' ? 'i-lucide:arrow-up' : 'i-lucide:arrow-down'}
                    class="ml-2 h-4 w-4"
                  />
                )}
              </Show>
            </Button>
          </div>
        )
      },
      cell: (props) => {
        const formatted = () => {
          const amount = Number.parseFloat(props.row.getValue('amount'))
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(amount)
        }

        return <div class="font-medium text-right">{formatted()}</div>
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: (props) => {
        const actionItems: DropdownMenuT.Item[] = [
          {
            label: 'Copy payment ID',
            onSelect: () => navigator.clipboard.writeText(props.row.original.id),
          },
          { type: 'separator' },
          { label: 'View client' },
          { label: 'View payment details' },
        ]

        return (
          <DropdownMenu>
            <DropdownMenu.Trigger
              as={Button}
              variant="ghost"
              size="sm"
              class="p-0 h-8 w-8"
              aria-label="Open menu"
            >
              <Icon name="i-lucide:more-horizontal" class="h-4 w-4" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content items={actionItems} />
          </DropdownMenu>
        )
      },
    },
  ]

  const table = createSolidTable({
    get data() {
      return data()
    },
    columns,
    state: {
      get sorting() {
        return sorting()
      },
      get columnFilters() {
        return columnFilters()
      },
      get columnVisibility() {
        return columnVisibility()
      },
      get rowSelection() {
        return rowSelection()
      },
    },
    initialState: {
      pagination: {
        pageSize: 4,
      },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const visibilityItems = createMemo<DropdownMenuT.Item[]>(() =>
    table
      .getAllColumns()
      .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide())
      .map((column) => ({
        type: 'checkbox',
        label: column.id,
        checked: column.getIsVisible(),
        onCheckedChange: (checked) => column.toggleVisibility(checked),
      })),
  )

  const emailFilter = () => (table.getColumn('email')?.getFilterValue() as string) ?? ''

  return (
    <div class="w-full space-y-4">
      <div class="flex gap-4 items-center justify-between">
        <Input
          placeholder="Filter emails..."
          value={emailFilter()}
          onInput={(e) => table.getColumn('email')?.setFilterValue(e.currentTarget.value)}
          class="max-w-xs"
        />
        <DropdownMenu>
          <DropdownMenu.Trigger as={Button} variant="outline" size="sm" class="ml-auto">
            Columns
            <Icon name="i-lucide:chevron-down" class="ml-2 h-4 w-4" />
          </DropdownMenu.Trigger>
          <DropdownMenu.Content items={visibilityItems()} />
        </DropdownMenu>
      </div>

      <Table bordered>
        <Table.Header>
          <For each={table.getHeaderGroups()}>
            {(headerGroup) => (
              <Table.Row>
                <For each={headerGroup.headers}>
                  {(header) => (
                    <Table.Head colSpan={header.colSpan}>
                      <Show when={!header.isPlaceholder}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </Show>
                    </Table.Head>
                  )}
                </For>
              </Table.Row>
            )}
          </For>
        </Table.Header>
        <Table.Body>
          <Show
            when={table.getRowModel().rows.length > 0}
            fallback={
              <Table.Row>
                <Table.Cell colSpan={columns.length} class="text-muted-foreground text-center h-24">
                  No results.
                </Table.Cell>
              </Table.Row>
            }
          >
            <For each={table.getRowModel().rows}>
              {(row) => (
                <Table.Row selected={row.getIsSelected()}>
                  <For each={row.getVisibleCells()}>
                    {(cell) => (
                      <Table.Cell>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </Table.Cell>
                    )}
                  </For>
                </Table.Row>
              )}
            </For>
          </Show>
        </Table.Body>
      </Table>

      <div class="text-sm text-muted-foreground flex items-center justify-between">
        <div>
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div class="flex gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
