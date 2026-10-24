import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library'
import { createTable } from '@tanstack/solid-table'
import type { ColumnDef } from '@tanstack/solid-table'
import { createSignal } from 'solid-js'
import { describe, expect, it, vi } from 'vitest'

import { DataTable } from './data-table'
import { getDefaultDataTableFeatures } from './data-table-helpers'

interface Person {
  id: string
  name: string
  age: number
  role: string
}

const TEST_DATA: Person[] = [
  { id: '1', name: 'Alice', age: 28, role: 'Engineer' },
  { id: '2', name: 'Bob', age: 34, role: 'Designer' },
  { id: '3', name: 'Charlie', age: 22, role: 'Intern' },
]

const TEST_COLUMNS: ColumnDef<any, Person>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: (props) => <span>{props.row.getValue('name')}</span>,
  },
  {
    accessorKey: 'age',
    header: 'Age',
    cell: (props) => <span>{props.row.getValue('age')}</span>,
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: (props) => <span>{props.row.getValue('role')}</span>,
  },
]

describe('DataTable', () => {
  it('renders data in convenience mode with standard columns and rows', () => {
    render(() => <DataTable data={TEST_DATA} columns={TEST_COLUMNS} />)

    expect(screen.getByText('Name')).toBeDefined()
    expect(screen.getByText('Age')).toBeDefined()
    expect(screen.getByText('Role')).toBeDefined()

    expect(screen.getByText('Alice')).toBeDefined()
    expect(screen.getByText('Bob')).toBeDefined()
    expect(screen.getByText('Charlie')).toBeDefined()
  })

  it('renders with an external SolidTable instance in instance mode', () => {
    render(() => {
      const table = createTable({
        features: getDefaultDataTableFeatures(),
        columns: TEST_COLUMNS,
        get data() {
          return TEST_DATA
        },
      })
      return <DataTable table={table} />
    })

    expect(screen.getByText('Alice')).toBeDefined()
    expect(screen.getByText('Bob')).toBeDefined()
  })

  it('handles client-side sorting when sorting={true}', () => {
    render(() => <DataTable data={TEST_DATA} columns={TEST_COLUMNS} sorting />)

    const nameHeader = screen.getByText('Name')
    const sortButton = nameHeader.closest('button')!
    expect(sortButton).toBeDefined()

    // Click to sort ascending (Alice, Bob, Charlie)
    fireEvent.click(sortButton)

    let rows = screen.getAllByRole('row')
    // row 0 is the header row
    expect(rows[1]?.textContent).toContain('Alice')
    expect(rows[2]?.textContent).toContain('Bob')
    expect(rows[3]?.textContent).toContain('Charlie')

    // Click to sort descending (Charlie, Bob, Alice)
    fireEvent.click(sortButton)

    rows = screen.getAllByRole('row')
    expect(rows[1]?.textContent).toContain('Charlie')
    expect(rows[2]?.textContent).toContain('Bob')
    expect(rows[3]?.textContent).toContain('Alice')
  })

  it('handles row selection when selectable={true}', () => {
    render(() => <DataTable data={TEST_DATA} columns={TEST_COLUMNS} selectable />)

    const checkboxes = screen.getAllByRole('checkbox')
    // checkboxes[0] is select all, checkboxes[1..3] are row checkboxes
    expect(checkboxes.length).toBe(4)

    // Select all rows
    fireEvent.click(checkboxes[0]!)

    const bodyRows = screen.getAllByRole('row').slice(1)
    for (const row of bodyRows) {
      expect(row.getAttribute('aria-selected')).toBe('true')
      expect(row.hasAttribute('data-selected')).toBe(true)
    }

    // Unselect first row
    fireEvent.click(checkboxes[1]!)
    expect(bodyRows[0]?.getAttribute('aria-selected')).toBe('false')
    expect(bodyRows[0]?.hasAttribute('data-selected')).toBe(false)
    expect(bodyRows[1]?.getAttribute('aria-selected')).toBe('true')
    expect(bodyRows[1]?.hasAttribute('data-selected')).toBe(true)
  })

  it('renders default empty state when dataset is empty', () => {
    render(() => <DataTable data={[]} columns={TEST_COLUMNS} />)

    expect(screen.getByText('No results.')).toBeDefined()
  })

  it('renders custom emptyRender when dataset is empty', () => {
    render(() => (
      <DataTable
        data={[]}
        columns={TEST_COLUMNS}
        emptyRender={(props) => (
          <div data-testid="custom-empty">Custom empty message (cols: {props.colSpan})</div>
        )}
      />
    ))

    const empty = screen.getByTestId('custom-empty')
    expect(empty).toBeDefined()
    expect(empty.textContent).toBe('Custom empty message (cols: 3)')
  })

  it('renders loading overlay when loading={true}', () => {
    const { container } = render(() => (
      <DataTable data={TEST_DATA} columns={TEST_COLUMNS} loading />
    ))

    expect(container.querySelector('[data-slot="data-table-loading"]')).toBeDefined()
  })

  it('renders pagination and page size dropdown', () => {
    render(() => (
      <DataTable data={TEST_DATA} columns={TEST_COLUMNS} pagination pageSizeOptions={[5, 10, 20]} />
    ))

    expect(screen.getByRole('navigation')).toBeDefined()
    expect(screen.getByRole('button', { name: /10 \/ page/i })).toBeDefined()
  })

  it('supports remote pagination with rowCount and manualPagination', () => {
    render(() => (
      <DataTable
        data={TEST_DATA}
        columns={TEST_COLUMNS}
        pagination
        manualPagination
        rowCount={100}
      />
    ))

    expect(screen.getByRole('navigation')).toBeDefined()
    // In remote mode with rowCount=100 and pageSize=10, page 10 exists
    expect(screen.getByText('10')).toBeDefined()
  })

  it('dispatches onPaginationChange exactly once with pageIndex 0 on pageSize change without data cascades', async () => {
    const onPaginationChange = vi.fn()
    const [data, setData] = createSignal(TEST_DATA)

    render(() => (
      <DataTable
        data={data}
        columns={TEST_COLUMNS}
        pagination
        manualPagination
        rowCount={100}
        currentPagination={{ pageIndex: 2, pageSize: 5 }}
        onPaginationChange={onPaginationChange}
        pageSizeOptions={[5, 10, 20]}
      />
    ))

    fireEvent.click(screen.getByRole('button', { name: /5 \/ page/i }))
    await waitFor(() => expect(screen.getByRole('menuitem', { name: /10 \/ page/i })).toBeDefined())
    fireEvent.click(screen.getByRole('menuitem', { name: /10 \/ page/i }))

    expect(onPaginationChange).toHaveBeenCalledTimes(1)
    expect(onPaginationChange).toHaveBeenCalledWith({ pageIndex: 0, pageSize: 10 })

    // Updating data in remote mode should not cause automatic onPaginationChange resets
    onPaginationChange.mockClear()
    setData([{ id: '99', name: 'Zoe', age: 28, role: 'Engineer' }])
    expect(onPaginationChange).not.toHaveBeenCalled()
  })

  it('applies custom rowClass function', () => {
    render(() => (
      <DataTable
        data={TEST_DATA}
        columns={TEST_COLUMNS}
        rowClass={(row) => (row.original.role === 'Intern' ? 'bg-amber-100' : undefined)}
      />
    ))

    const rows = screen.getAllByRole('row').slice(1)
    expect(rows[2]?.className).toContain('bg-amber-100')
    expect(rows[0]?.className).not.toContain('bg-amber-100')
  })

  it('applies recipe variants such as size, striped, and showBorder', () => {
    const { container } = render(() => (
      <DataTable
        data={TEST_DATA}
        columns={TEST_COLUMNS}
        size="sm"
        striped
        hoverEffect
        showBorder="both"
      />
    ))

    const table = container.querySelector('[data-slot="data-table"]')!
    expect(table.className).toContain('text-xs')

    const head = container.querySelector('[data-slot="data-table-head"]')!
    expect(head.className).toContain('text-xs')

    const row = container.querySelector(
      '[data-slot="data-table-body"] [data-slot="data-table-row"]',
    )!
    expect(row.className).toContain('hover:bg-accent/50')
  })

  it('reacts dynamically to reactive data signals', () => {
    const [data, setData] = createSignal(TEST_DATA)

    render(() => <DataTable data={data} columns={TEST_COLUMNS} />)

    expect(screen.getAllByRole('row').length).toBe(4)

    setData([...TEST_DATA, { id: '4', name: 'Diana', age: 31, role: 'Manager' }])

    expect(screen.getAllByRole('row').length).toBe(5)
    expect(screen.getByText('Diana')).toBeDefined()
  })
})
