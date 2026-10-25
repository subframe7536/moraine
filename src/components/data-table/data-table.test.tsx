import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library'
import { createTable } from '@tanstack/solid-table'
import type { ColumnDef, Row } from '@tanstack/solid-table'
import { createRoot, createSignal } from 'solid-js'
import { describe, expect, it, vi } from 'vitest'

import { createTableVirtualizer } from '../../virtualizer'

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

  it('supports column filtering with getDefaultDataTableFeatures without unregistered filterFn warning', () => {
    createRoot((dispose) => {
      const warnSpy = vi.spyOn(console, 'warn')
      const table = createTable({
        features: getDefaultDataTableFeatures(),
        columns: TEST_COLUMNS,
        get data() {
          return TEST_DATA
        },
      })
      table.getColumn('name')?.setFilterValue('Alice')
      expect(table.getFilteredRowModel().rows.length).toBe(1)
      expect(table.getFilteredRowModel().rows[0]?.getValue('name')).toBe('Alice')
      expect(warnSpy).not.toHaveBeenCalledWith(expect.stringContaining('filterFn'))
      warnSpy.mockRestore()
      dispose()
    })
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
    expect(row.className).toContain(
      '[tbody>&:not([data-selected],[data-empty]):hover]:bg-accent/50',
    )
  })

  it('marks even display rows for striping and keeps header rows unmarked', () => {
    const { container } = render(() => (
      <DataTable
        data={TEST_DATA}
        columns={TEST_COLUMNS}
        striped
        expandable
        defaultExpanded={{ '0': true }}
        expandedRowRender={(row) => <div>{row.original.name} details</div>}
      />
    ))

    const bodyRows = container.querySelectorAll('tbody > tr[data-slot="data-table-row"]')
    expect([...bodyRows].map((row) => row.hasAttribute('data-even'))).toEqual([false, true, false])
    expect(bodyRows[0]!.hasAttribute('data-expanded')).toBe(true)
    expect(bodyRows[1]!.hasAttribute('data-expanded')).toBe(false)

    const headerRow = container.querySelector('thead tr')!
    expect(headerRow.hasAttribute('data-even')).toBe(false)
    expect(headerRow.hasAttribute('aria-selected')).toBe(false)
  })

  it('marks the empty-state row so row hover styles skip it', () => {
    const { container } = render(() => <DataTable data={[]} columns={TEST_COLUMNS} hoverEffect />)

    const emptyRow = container.querySelector('tbody > tr')!
    expect(emptyRow.hasAttribute('data-empty')).toBe(true)
  })

  it('aligns sort buttons with the column and flags the sorted icon', () => {
    const columns: ColumnDef<any, Person>[] = [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'age', header: 'Age', meta: { align: 'right' } },
    ]
    const { container } = render(() => <DataTable data={TEST_DATA} columns={columns} sorting />)

    const [nameButton, ageButton] = container.querySelectorAll(
      '[data-slot="data-table-sort-button"]',
    )
    expect(nameButton!.className).toContain('-ml-2')
    expect(ageButton!.className).toContain('-mr-2')
    expect(ageButton!.className).toContain('flex-row-reverse')

    const ageIcon = ageButton!.querySelector('[data-slot="data-table-sort-icon"]')!
    expect(ageIcon.hasAttribute('data-sorted')).toBe(false)
    fireEvent.click(ageButton!)
    expect(ageIcon.hasAttribute('data-sorted')).toBe(true)
  })

  it('reacts dynamically to reactive data signals', () => {
    const [data, setData] = createSignal(TEST_DATA)

    render(() => <DataTable data={data} columns={TEST_COLUMNS} />)

    expect(screen.getAllByRole('row').length).toBe(4)

    setData([...TEST_DATA, { id: '4', name: 'Diana', age: 31, role: 'Manager' }])

    expect(screen.getAllByRole('row').length).toBe(5)
    expect(screen.getByText('Diana')).toBeDefined()
  })

  it('renders all rows when pagination is not enabled even with more than 10 rows', () => {
    const twentyRows = Array.from({ length: 20 }, (_, i) => ({
      id: String(i + 1),
      name: `Person ${i + 1}`,
      age: 20 + i,
      role: 'Staff',
    }))

    render(() => <DataTable data={twentyRows} columns={TEST_COLUMNS} />)

    // 20 data rows + 1 header row = 21 rows
    expect(screen.getAllByRole('row').length).toBe(21)
  })

  it('renders virtualized rows with virtualRender adapter', async () => {
    const virtualizer = createTableVirtualizer<Row<any, Person>>({
      estimateSize: () => 30,
      measureElement: () => 30,
      observeElementRect: (_instance, callback) => callback({ width: 300, height: 60 }),
      observeElementOffset: (_instance, callback) => callback(0, false),
      overscan: 0,
    })

    const manyRows = Array.from({ length: 50 }, (_, i) => ({
      id: String(i + 1),
      name: `Person ${i + 1}`,
      age: 20 + (i % 30),
      role: 'Staff',
    }))

    const { container } = render(() => (
      <DataTable data={manyRows} columns={TEST_COLUMNS} virtualRender={virtualizer.virtualRender} />
    ))
    await Promise.resolve()

    const tbody = container.querySelector('[data-slot="data-table-body"]')!
    const spacers = tbody.querySelectorAll<HTMLTableRowElement>('tr[aria-hidden="true"]')
    expect(spacers.length).toBe(2)

    const renderedRows = tbody.querySelectorAll('tr[data-index]')
    expect(renderedRows.length).toBeLessThan(50)
    expect(renderedRows.length).toBeGreaterThan(0)

    const table = container.querySelector('table')!
    expect(table.getAttribute('aria-rowcount')).toBe('51')
  })

  it('excludes pagination feature in getDefaultDataTableFeatures when pagination: false', () => {
    const defaultFeatures = getDefaultDataTableFeatures()
    expect('rowPaginationFeature' in defaultFeatures).toBe(true)
    expect('paginatedRowModel' in defaultFeatures).toBe(true)

    const unpaginatedFeatures = getDefaultDataTableFeatures({ pagination: false })
    expect('rowPaginationFeature' in unpaginatedFeatures).toBe(false)
    expect('paginatedRowModel' in unpaginatedFeatures).toBe(false)
  })

  it('does not render pagination toolbar when virtualRender is setup even if pagination is true', () => {
    const virtualizer = createTableVirtualizer<Row<any, Person>>({
      estimateSize: () => 30,
      measureElement: () => 30,
    })

    const { container } = render(() => (
      <DataTable
        data={TEST_DATA}
        columns={TEST_COLUMNS}
        virtualRender={virtualizer.virtualRender}
        pagination
      />
    ))

    expect(container.querySelector('[data-slot="data-table-pagination"]')).toBeNull()
  })

  it('handles single row selection when selectable="single"', () => {
    render(() => <DataTable data={TEST_DATA} columns={TEST_COLUMNS} selectable="single" />)

    const radios = screen.getAllByRole('radio')
    expect(radios.length).toBe(3)
    // In single selection mode, no checkbox is in the header
    expect(screen.queryByRole('checkbox')).toBeNull()

    // Select first row
    fireEvent.click(radios[0]!)
    expect(radios[0]?.getAttribute('aria-checked')).toBe('true')
    expect(radios[1]?.getAttribute('aria-checked')).toBe('false')

    // Select second row (should automatically deselect first row)
    fireEvent.click(radios[1]!)
    expect(radios[0]?.getAttribute('aria-checked')).toBe('false')
    expect(radios[1]?.getAttribute('aria-checked')).toBe('true')
  })

  it('respects isRowSelectable to disable selection on specific rows', () => {
    render(() => (
      <DataTable
        data={TEST_DATA}
        columns={TEST_COLUMNS}
        selectable
        isRowSelectable={(row) => row.original.role !== 'Intern'}
      />
    ))

    const checkboxes = screen.getAllByRole('checkbox')
    // checkboxes[0] = select-all, checkboxes[1] = Alice, checkboxes[2] = Bob, checkboxes[3] = Charlie (Intern)
    expect(checkboxes[1]?.getAttribute('disabled')).toBeNull()
    expect(checkboxes[2]?.getAttribute('disabled')).toBeNull()
    expect(checkboxes[3]?.getAttribute('disabled')).not.toBeNull()

    // Clicking disabled row checkbox does not select it
    fireEvent.click(checkboxes[3]!)
    const bodyRows = screen.getAllByRole('row').slice(1)
    expect(bodyRows[2]?.getAttribute('aria-selected')).toBe('false')
  })

  it('applies stickyHeader styles to th and supports maxHeight', () => {
    const { container } = render(() => (
      <DataTable data={TEST_DATA} columns={TEST_COLUMNS} stickyHeader maxHeight={300} />
    ))

    const scrollDiv = container.querySelector('[data-slot="data-table-container"]') as HTMLElement
    expect(scrollDiv.style.maxHeight).toBe('300px')
    expect(scrollDiv.style.overflowY).toBe('auto')

    const table = container.querySelector('table') as HTMLElement
    expect(table.className).toContain('border-separate')

    const ths = container.querySelectorAll('thead th')
    expect(ths.length).toBeGreaterThan(0)
    for (const th of ths) {
      expect((th as HTMLElement).style.position).toBe('sticky')
      expect((th as HTMLElement).style.top).toBe('0px')
      expect(th.className).toContain('bg-background')
    }
  })

  it('supports columnPinning with sticky position and pixel offsets', () => {
    const pinnedCols: ColumnDef<any, Person>[] = [
      {
        accessorKey: 'name',
        header: 'Name',
        meta: { pinned: 'left' },
      },
      {
        accessorKey: 'age',
        header: 'Age',
      },
      {
        accessorKey: 'role',
        header: 'Role',
        meta: { pinned: 'right' },
      },
    ]

    const { container } = render(() => <DataTable data={TEST_DATA} columns={pinnedCols} />)

    const [nameTh, ageTh, roleTh] = container.querySelectorAll<HTMLElement>(
      'th[data-slot="data-table-head"]',
    )
    expect(nameTh!.style.position).toBe('sticky')
    expect(nameTh!.style.left).toBe('0px')
    expect(nameTh!.getAttribute('data-pinned')).toBe('start')
    expect(nameTh!.getAttribute('data-pinned-edge')).toBe('start')
    expect(ageTh!.hasAttribute('data-pinned')).toBe(false)
    expect(roleTh!.getAttribute('data-pinned')).toBe('end')
    expect(roleTh!.getAttribute('data-pinned-edge')).toBe('end')

    const [nameTd, ageTd] = container.querySelectorAll<HTMLElement>(
      'tbody td[data-slot="data-table-cell"]',
    )
    expect(nameTd!.style.position).toBe('sticky')
    expect(nameTd!.style.left).toBe('0px')
    expect(nameTd!.getAttribute('data-pinned')).toBe('start')
    expect(nameTd!.className).toContain('data-pinned:bg-background')
    expect(nameTd!.className).toContain(
      'data-[pinned-edge=start]:shadow-[inset_-1px_0_0_var(--border)]',
    )
    expect(ageTd!.hasAttribute('data-pinned-edge')).toBe(false)
  })

  it('only marks the innermost pinned column as the pinned edge', () => {
    const columns: ColumnDef<any, Person>[] = [
      { accessorKey: 'name', header: 'Name', meta: { pinned: 'left' } },
      { accessorKey: 'age', header: 'Age', meta: { pinned: 'left' } },
      { accessorKey: 'role', header: 'Role' },
    ]
    const { container } = render(() => <DataTable data={TEST_DATA} columns={columns} />)

    const [nameTh, ageTh] = container.querySelectorAll('th[data-slot="data-table-head"]')
    expect(nameTh!.hasAttribute('data-pinned-edge')).toBe(false)
    expect(ageTh!.getAttribute('data-pinned-edge')).toBe('start')
  })

  it('stacks sticky header cells above pinned body cells', () => {
    const columns: ColumnDef<any, Person>[] = [
      { accessorKey: 'name', header: 'Name', meta: { pinned: 'left' } },
      { accessorKey: 'age', header: 'Age' },
      { accessorKey: 'role', header: 'Role' },
    ]
    const { container } = render(() => (
      <DataTable data={TEST_DATA} columns={columns} stickyHeader maxHeight={200} loading />
    ))

    const [pinnedTh, plainTh] = container.querySelectorAll<HTMLElement>('thead th')
    const pinnedTd = container.querySelector<HTMLElement>('tbody td[data-pinned]')!
    const pinnedBodyZ = Number(pinnedTd.style.zIndex)
    expect(Number(plainTh!.style.zIndex)).toBeGreaterThan(pinnedBodyZ)
    expect(Number(pinnedTh!.style.zIndex)).toBeGreaterThan(Number(plainTh!.style.zIndex))

    const loading = container.querySelector('[data-slot="data-table-loading"]')!
    expect(loading.className).toContain('z-40')
  })

  it('renders column resize handles when resizable={true}', () => {
    const { container } = render(() => (
      <DataTable data={TEST_DATA} columns={TEST_COLUMNS} resizable />
    ))

    const resizers = container.querySelectorAll('[data-slot="data-table-resizer"]')
    expect(resizers.length).toBe(TEST_COLUMNS.length)
  })

  it('supports expandable rows with expandedRowRender', () => {
    render(() => (
      <DataTable
        data={TEST_DATA}
        columns={TEST_COLUMNS}
        expandable
        expandedRowRender={(row) => (
          <div data-testid="detail-content">{row.original.name} details</div>
        )}
      />
    ))

    const expandButtons = screen.getAllByRole('button', { name: /expand row/i })
    expect(expandButtons.length).toBe(3)

    // Initially no detail content is rendered
    expect(screen.queryByTestId('detail-content')).toBeNull()

    // Click to expand first row
    fireEvent.click(expandButtons[0]!)
    expect(screen.getByTestId('detail-content')).toBeDefined()
    expect(screen.getByTestId('detail-content').textContent).toBe('Alice details')

    // Click again to collapse
    fireEvent.click(expandButtons[0]!)
    expect(screen.queryByTestId('detail-content')).toBeNull()
  })

  it('applies the expandButton slot to expand toggles', () => {
    render(() => (
      <DataTable
        data={TEST_DATA}
        columns={TEST_COLUMNS}
        expandable
        expandedRowRender={(row) => <div>{row.original.name}</div>}
        classes={{ expandButton: 'custom-expand' }}
      />
    ))

    const [button] = screen.getAllByRole('button', { name: /expand row/i })
    expect(button!.className).toContain('custom-expand')
    expect(button!.className).toContain('data-expanded:rotate-90')
  })

  it('emits onRowClick and onRowDoubleClick events', () => {
    const onRowClick = vi.fn()
    const onRowDoubleClick = vi.fn()

    render(() => (
      <DataTable
        data={TEST_DATA}
        columns={TEST_COLUMNS}
        onRowClick={onRowClick}
        onRowDoubleClick={onRowDoubleClick}
      />
    ))

    const bodyRows = screen.getAllByRole('row').slice(1)
    fireEvent.click(bodyRows[0]!)
    expect(onRowClick).toHaveBeenCalledTimes(1)
    expect(onRowClick.mock.calls[0]?.[0].original.name).toBe('Alice')

    fireEvent.dblClick(bodyRows[1]!)
    expect(onRowDoubleClick).toHaveBeenCalledTimes(1)
    expect(onRowDoubleClick.mock.calls[0]?.[0].original.name).toBe('Bob')
  })

  it('sets aria-sort on th headers according to sort state', () => {
    render(() => <DataTable data={TEST_DATA} columns={TEST_COLUMNS} sorting />)

    const nameTh = screen.getByText('Name').closest('th')!
    expect(nameTh.getAttribute('aria-sort')).toBe('none')

    const sortButton = nameTh.querySelector('button')!
    fireEvent.click(sortButton)
    expect(nameTh.getAttribute('aria-sort')).toBe('ascending')

    fireEvent.click(sortButton)
    expect(nameTh.getAttribute('aria-sort')).toBe('descending')
  })

  it('does not display "No results." while loading is true', () => {
    render(() => <DataTable data={[]} columns={TEST_COLUMNS} loading />)

    expect(screen.queryByText('No results.')).toBeNull()
  })

  it('updates column width when dragging resize handle', () => {
    const { container } = render(() => (
      <DataTable
        data={TEST_DATA}
        columns={[
          { accessorKey: 'name', header: 'Name', size: 100 },
          { accessorKey: 'age', header: 'Age', size: 150 },
        ]}
        resizable
      />
    ))

    const ths = container.querySelectorAll('thead th')
    expect((ths[0] as HTMLElement).style.width).toBe('100px')
    const tds = container.querySelectorAll('tbody tr:first-child td')
    expect((tds[0] as HTMLElement).style.width).toBe('100px')

    const resizer = ths[0]?.querySelector('[data-slot="data-table-resizer"]') as HTMLElement
    expect(resizer).not.toBeNull()

    resizer.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: 100 }),
    )
    document.dispatchEvent(
      new MouseEvent('mousemove', { bubbles: true, cancelable: true, clientX: 160 }),
    )
    document.dispatchEvent(
      new MouseEvent('mouseup', { bubbles: true, cancelable: true, clientX: 160 }),
    )

    expect((ths[0] as HTMLElement).style.width).toBe('160px')
    expect((tds[0] as HTMLElement).style.width).toBe('160px')
  })

  it('automatically pins select column to left when left pinned columns exist', () => {
    const { container } = render(() => (
      <DataTable
        data={TEST_DATA}
        columns={[
          { accessorKey: 'name', header: 'Name', size: 120, meta: { pinned: 'left' } },
          { accessorKey: 'age', header: 'Age', size: 80 },
        ]}
        selectable
      />
    ))

    const ths = container.querySelectorAll('thead th')
    // First th should be select column pinned left at 0px
    expect((ths[0] as HTMLElement).style.position).toBe('sticky')
    expect((ths[0] as HTMLElement).style.left).toBe('0px')
    expect((ths[0] as HTMLElement).style.width).toBe('40px')

    // Second th should be Name pinned left at 40px
    expect((ths[1] as HTMLElement).style.position).toBe('sticky')
    expect((ths[1] as HTMLElement).style.left).toBe('40px')
    expect((ths[1] as HTMLElement).style.width).toBe('120px')
  })
})
