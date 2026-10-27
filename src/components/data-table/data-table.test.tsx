import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library'
import { createRoot, createSignal, mergeProps } from 'solid-js'
import { describe, expect, it, vi } from 'vitest'

import { createTableVirtualizer } from '../../virtualizer'

import { createDataTable } from './create-data-table'
import { DataTable } from './data-table'
import type { DataTableT } from './data-table.types'

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

const TEST_COLUMNS: DataTableT.Column<Person>[] = [
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

function createPersonTable(options: Partial<DataTableT.Options<Person>> = {}) {
  const merged = mergeProps({ data: TEST_DATA, columns: TEST_COLUMNS }, options)
  return createDataTable<Person>(merged)
}

describe('DataTable', () => {
  it('renders data with a createDataTable instance', () => {
    render(() => {
      const table = createPersonTable()
      return <DataTable table={table} />
    })

    expect(screen.getByText('Name')).toBeDefined()
    expect(screen.getByText('Age')).toBeDefined()
    expect(screen.getByText('Role')).toBeDefined()

    expect(screen.getByText('Alice')).toBeDefined()
    expect(screen.getByText('Bob')).toBeDefined()
    expect(screen.getByText('Charlie')).toBeDefined()
  })

  it('supports column and global filtering without unregistered filterFn warnings', () => {
    createRoot((dispose) => {
      const warnSpy = vi.spyOn(console, 'warn')
      const table = createPersonTable()
      table.getColumn('name')?.setFilterValue('Alice')
      expect(table.getFilteredRowModel().rows.length).toBe(1)
      expect(table.getFilteredRowModel().rows[0]?.getValue('name')).toBe('Alice')

      table.getColumn('name')?.setFilterValue(undefined)
      table.setGlobalFilter('Designer')
      expect(table.getFilteredRowModel().rows.length).toBe(1)
      expect(table.getFilteredRowModel().rows[0]?.getValue('name')).toBe('Bob')

      expect(warnSpy).not.toHaveBeenCalledWith(expect.stringContaining('filterFn'))
      warnSpy.mockRestore()
      dispose()
    })
  })

  it('handles client-side sorting from the table instance', () => {
    render(() => {
      const table = createPersonTable()
      return <DataTable table={table} />
    })

    const nameHeader = screen.getByText('Name')
    expect(nameHeader.closest('button')).toBeNull()
    const sortButton = nameHeader
      .closest('th')!
      .querySelector('[data-slot="data-table-sort-button"]')!
    expect(sortButton).toBeDefined()

    fireEvent.click(sortButton)

    let rows = screen.getAllByRole('row')
    expect(rows[1]?.textContent).toContain('Alice')
    expect(rows[2]?.textContent).toContain('Bob')
    expect(rows[3]?.textContent).toContain('Charlie')

    fireEvent.click(sortButton)

    rows = screen.getAllByRole('row')
    expect(rows[1]?.textContent).toContain('Charlie')
    expect(rows[2]?.textContent).toContain('Bob')
    expect(rows[3]?.textContent).toContain('Alice')
  })

  it('handles multiple row selection when selection="multiple"', () => {
    render(() => {
      const table = createPersonTable({
        selection: 'multiple',
      })
      return <DataTable table={table} />
    })

    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes.length).toBe(4)

    fireEvent.click(checkboxes[0]!)

    const bodyRows = screen.getAllByRole('row').slice(1)
    for (const row of bodyRows) {
      expect(row.getAttribute('aria-selected')).toBe('true')
      expect(row.hasAttribute('data-selected')).toBe(true)
    }

    fireEvent.click(checkboxes[1]!)
    expect(bodyRows[0]?.getAttribute('aria-selected')).toBe('false')
    expect(bodyRows[0]?.hasAttribute('data-selected')).toBe(false)
    expect(bodyRows[1]?.getAttribute('aria-selected')).toBe('true')
    expect(bodyRows[1]?.hasAttribute('data-selected')).toBe(true)
  })

  it('renders default empty state when dataset is empty', () => {
    render(() => {
      const table = createPersonTable({ data: [] })
      return <DataTable table={table} />
    })

    expect(screen.getByText('No results.')).toBeDefined()
  })

  it('renders custom emptyRender when dataset is empty', () => {
    render(() => {
      const table = createPersonTable({ data: [] })
      return (
        <DataTable
          table={table}
          emptyRender={(props) => (
            <div data-testid="custom-empty">Custom empty message (cols: {props.colSpan})</div>
          )}
        />
      )
    })

    const empty = screen.getByTestId('custom-empty')
    expect(empty).toBeDefined()
    expect(empty.textContent).toBe('Custom empty message (cols: 3)')
  })

  it('renders loading overlay when loading={true}', () => {
    const { container } = render(() => {
      const table = createPersonTable()
      return <DataTable table={table} loading />
    })

    expect(container.querySelector('[data-slot="data-table-loading"]')).toBeDefined()
  })

  it('does not render pagination toolbar by default, and renders it when pagination is enabled', () => {
    const { container, unmount } = render(() => {
      const table = createPersonTable()
      return <DataTable table={table} />
    })
    expect(container.querySelector('[data-slot="data-table-pagination"]')).toBeNull()
    unmount()

    render(() => {
      const table = createPersonTable({ pagination: { pageSizes: [5, 10, 20] } })
      return <DataTable table={table} />
    })

    expect(screen.getByRole('navigation')).toBeDefined()
    expect(screen.getByRole('button', { name: /10 \/ page/i })).toBeDefined()
  })

  it('hides page size dropdown when pagination.pageSizes is false', () => {
    render(() => {
      const table = createPersonTable({ pagination: { pageSize: 5, pageSizes: false } })
      return <DataTable table={table} />
    })

    expect(screen.getByRole('navigation')).toBeDefined()
    expect(screen.queryByRole('button', { name: /\/ page/i })).toBeNull()
  })

  it('supports remote pagination with rowCount and manual', () => {
    render(() => {
      const table = createPersonTable({
        pagination: true,
        manual: true,
        rowCount: 100,
      })
      return <DataTable table={table} />
    })

    expect(screen.getByRole('navigation')).toBeDefined()
    expect(screen.getByText('10')).toBeDefined()
  })

  it('dispatches onPaginationChange with resolved value and pageIndex 0 on pageSize change without data cascades', async () => {
    const onPaginationChange = vi.fn()
    const [data, setData] = createSignal(TEST_DATA)
    const [pagination, setPagination] = createSignal({ pageIndex: 2, pageSize: 5 })

    render(() => {
      const table = createPersonTable({
        get data() {
          return data()
        },
        pagination: { pageSizes: [5, 10, 20] },
        manual: true,
        rowCount: 100,
        state: {
          get pagination() {
            return pagination()
          },
        },
        onPaginationChange: (next) => {
          setPagination(next)
          onPaginationChange(next)
        },
      })
      return <DataTable table={table} />
    })

    fireEvent.click(screen.getByRole('button', { name: /5 \/ page/i }))
    await waitFor(() => expect(screen.getByRole('menuitem', { name: /10 \/ page/i })).toBeDefined())
    fireEvent.click(screen.getByRole('menuitem', { name: /10 \/ page/i }))

    expect(onPaginationChange).toHaveBeenCalledTimes(1)
    expect(onPaginationChange).toHaveBeenCalledWith({ pageIndex: 0, pageSize: 10 })

    onPaginationChange.mockClear()
    setData([{ id: '99', name: 'Zoe', age: 28, role: 'Engineer' }])
    expect(onPaginationChange).not.toHaveBeenCalled()
  })

  it('toggles pagination reactively without recreating the table instance', async () => {
    const [paginated, setPaginated] = createSignal(false)
    const { container } = render(() => {
      const table = createPersonTable({
        get pagination() {
          return paginated() ? ({ pageSizes: false } as const) : false
        },
        initialState: { pagination: { pageIndex: 0, pageSize: 2 } },
      })
      return <DataTable table={table} />
    })

    expect(container.querySelector('[data-slot="data-table-pagination"]')).toBeNull()
    expect(screen.getAllByRole('row').length).toBe(4)

    setPaginated(true)

    await waitFor(() =>
      expect(container.querySelector('[data-slot="data-table-pagination"]')).not.toBeNull(),
    )
    expect(screen.getAllByRole('row').length).toBe(3)

    setPaginated(false)

    await waitFor(() =>
      expect(container.querySelector('[data-slot="data-table-pagination"]')).toBeNull(),
    )
    expect(screen.getAllByRole('row').length).toBe(4)
  })

  it('adds and removes the selection column reactively', () => {
    const [mode, setMode] = createSignal<'multiple' | undefined>(undefined)
    render(() => {
      const table = createPersonTable({
        get selection() {
          return mode()
        },
      })
      return <DataTable table={table} />
    })

    expect(screen.queryAllByRole('checkbox').length).toBe(0)

    setMode('multiple')
    expect(screen.getAllByRole('checkbox').length).toBe(4)

    setMode(undefined)
    expect(screen.queryAllByRole('checkbox').length).toBe(0)
  })

  it('keeps uncontrolled state when only an onSortingChange listener is provided', () => {
    const onSortingChange = vi.fn()
    render(() => {
      const table = createPersonTable({ onSortingChange })
      return <DataTable table={table} />
    })

    const sortButton = screen
      .getByText('Name')
      .closest('th')!
      .querySelector('[data-slot="data-table-sort-button"]')!

    fireEvent.click(sortButton)
    expect(onSortingChange).toHaveBeenLastCalledWith([{ id: 'name', desc: false }])

    fireEvent.click(sortButton)
    expect(onSortingChange).toHaveBeenLastCalledWith([{ id: 'name', desc: true }])
    expect(screen.getAllByRole('row')[1]?.textContent).toContain('Charlie')
  })

  it('applies custom rowClass function', () => {
    render(() => {
      const table = createPersonTable()
      return (
        <DataTable
          table={table}
          rowClass={(row) => (row.original.role === 'Intern' ? 'bg-amber-100' : undefined)}
        />
      )
    })

    const rows = screen.getAllByRole('row').slice(1)
    expect(rows[2]?.className).toContain('bg-amber-100')
    expect(rows[0]?.className).not.toContain('bg-amber-100')
  })

  it('applies recipe variants such as size, striped, and showBorder', () => {
    const { container } = render(() => {
      const table = createPersonTable()
      return <DataTable table={table} size="sm" striped hoverEffect showBorder="both" />
    })

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
    const { container } = render(() => {
      const table = createPersonTable({
        expandable: true,
        state: { expanded: { '0': true } },
      })
      return (
        <DataTable
          table={table}
          striped
          expandedRowRender={(props) => <div>{props.row.original.name} details</div>}
        />
      )
    })

    const bodyRows = container.querySelectorAll('tbody > tr[data-slot="data-table-row"]')
    expect([...bodyRows].map((row) => row.hasAttribute('data-even'))).toEqual([false, true, false])
    expect(bodyRows[0]!.hasAttribute('data-expanded')).toBe(true)
    expect(bodyRows[1]!.hasAttribute('data-expanded')).toBe(false)

    const headerRow = container.querySelector('thead tr')!
    expect(headerRow.hasAttribute('data-even')).toBe(false)
    expect(headerRow.hasAttribute('aria-selected')).toBe(false)
  })

  it('marks the empty-state row so row hover styles skip it', () => {
    const { container } = render(() => {
      const table = createPersonTable({ data: [] })
      return <DataTable table={table} hoverEffect />
    })

    const emptyRow = container.querySelector('tbody > tr')!
    expect(emptyRow.hasAttribute('data-empty')).toBe(true)
  })

  it('keeps sort controls detached at the end of the header cell', () => {
    const columns: DataTableT.Column<Person>[] = [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'age', header: 'Age', meta: { align: 'right' } },
    ]
    render(() => {
      const table = createPersonTable({ columns })
      return <DataTable table={table} />
    })

    const ageTh = screen.getByText('Age').closest('th')!
    const ageButton = ageTh.querySelector('[data-slot="data-table-sort-button"]')!
    expect(ageButton.contains(screen.getByText('Age'))).toBe(false)
    expect(ageButton.parentElement?.lastElementChild).toBe(ageButton)

    const ageIcon = ageButton.querySelector('[data-slot="data-table-sort-icon"]')!
    expect(ageIcon.hasAttribute('data-sorted')).toBe(false)
    fireEvent.click(ageButton)
    expect(ageIcon.hasAttribute('data-sorted')).toBe(true)
  })

  it('reacts dynamically to reactive data signals', () => {
    const [data, setData] = createSignal(TEST_DATA)

    render(() => {
      const table = createPersonTable({
        get data() {
          return data()
        },
      })
      return <DataTable table={table} />
    })

    expect(screen.getAllByRole('row').length).toBe(4)

    setData([...TEST_DATA, { id: '4', name: 'Diana', age: 31, role: 'Manager' }])

    expect(screen.getAllByRole('row').length).toBe(5)
    expect(screen.getByText('Diana')).toBeDefined()
  })

  it('renders all rows when pagination is omitted', () => {
    const twentyRows = Array.from({ length: 20 }, (_, i) => ({
      id: String(i + 1),
      name: `Person ${i + 1}`,
      age: 20 + i,
      role: 'Staff',
    }))

    render(() => {
      const table = createPersonTable({ data: twentyRows })
      return <DataTable table={table} />
    })

    expect(screen.getAllByRole('row').length).toBe(21)
  })

  it('renders virtualized rows with virtualRender adapter', async () => {
    const virtualizer = createTableVirtualizer<DataTableT.Row<Person>>({
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

    const { container } = render(() => {
      const table = createPersonTable({ data: manyRows })
      return <DataTable table={table} virtualRender={virtualizer.virtualRender} />
    })
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

  it('does not render pagination toolbar and warns when virtualRender is combined with pagination', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const virtualizer = createTableVirtualizer<DataTableT.Row<Person>>({
      estimateSize: () => 30,
      measureElement: () => 30,
    })

    const { container } = render(() => {
      const table = createPersonTable({ pagination: true })
      return <DataTable table={table} virtualRender={virtualizer.virtualRender} />
    })

    expect(container.querySelector('[data-slot="data-table-pagination"]')).toBeNull()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('virtualRender and pagination'))
    warnSpy.mockRestore()
  })

  it('handles single row selection when selection="single"', () => {
    render(() => {
      const table = createPersonTable({
        selection: 'single',
      })
      return <DataTable table={table} />
    })

    const radios = screen.getAllByRole('radio')
    expect(radios.length).toBe(3)
    expect(screen.queryByRole('checkbox')).toBeNull()

    fireEvent.click(radios[0]!)
    expect(radios[0]?.getAttribute('aria-checked')).toBe('true')
    expect(radios[1]?.getAttribute('aria-checked')).toBe('false')

    fireEvent.click(radios[1]!)
    expect(radios[0]?.getAttribute('aria-checked')).toBe('false')
    expect(radios[1]?.getAttribute('aria-checked')).toBe('true')
  })

  it('respects canSelectRow to disable selection on specific rows', () => {
    render(() => {
      const table = createPersonTable({
        selection: 'multiple',
        canSelectRow: (row) => row.original.role !== 'Intern',
      })
      return <DataTable table={table} />
    })

    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes[1]?.getAttribute('disabled')).toBeNull()
    expect(checkboxes[2]?.getAttribute('disabled')).toBeNull()
    expect(checkboxes[3]?.getAttribute('disabled')).not.toBeNull()

    fireEvent.click(checkboxes[3]!)
    const bodyRows = screen.getAllByRole('row').slice(1)
    expect(bodyRows[2]?.getAttribute('aria-selected')).toBe('false')
  })

  it('applies sticky styles to th and supports maxHeight', () => {
    const { container } = render(() => {
      const table = createPersonTable()
      return <DataTable table={table} sticky maxHeight={300} />
    })

    const scrollDiv = container.querySelector('[data-slot="data-table-scroll"]') as HTMLElement
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

  it('keeps the pagination toolbar outside the scroll viewport', () => {
    const { container } = render(() => {
      const table = createPersonTable({ pagination: true })
      return <DataTable table={table} sticky maxHeight={200} />
    })

    const scrollDiv = container.querySelector('[data-slot="data-table-scroll"]')!
    const pagination = container.querySelector('[data-slot="data-table-pagination"]')!
    expect(scrollDiv.contains(pagination)).toBe(false)
    expect(
      container.querySelector('[data-slot="data-table-container"]')!.contains(pagination),
    ).toBe(true)
  })

  it('sticks footer cells to the bottom when sticky includes footer', () => {
    const footerColumns: DataTableT.Column<Person>[] = [
      { accessorKey: 'name', header: 'Name', footer: 'Total' },
      { accessorKey: 'age', header: 'Age' },
    ]

    const { container, unmount } = render(() => {
      const table = createPersonTable({ columns: footerColumns })
      return <DataTable table={table} sticky maxHeight={200} />
    })

    const footerCells = container.querySelectorAll<HTMLElement>(
      'tfoot td[data-slot="data-table-cell"]',
    )
    expect(footerCells.length).toBe(2)
    for (const td of footerCells) {
      expect(td.style.position).toBe('sticky')
      expect(td.style.bottom).toBe('0px')
    }
    unmount()

    const { container: footerOnly } = render(() => {
      const table = createPersonTable({ columns: footerColumns })
      return <DataTable table={table} sticky="footer" maxHeight={200} />
    })

    const footerCell = footerOnly.querySelector<HTMLElement>(
      'tfoot td[data-slot="data-table-cell"]',
    )!
    expect(footerCell.style.position).toBe('sticky')
    expect(footerCell.style.bottom).toBe('0px')

    const head = footerOnly.querySelector<HTMLElement>('thead th')!
    expect(head.style.position).not.toBe('sticky')
  })

  it('supports columnPinning with sticky position and pixel offsets', () => {
    const pinnedCols: DataTableT.Column<Person>[] = [
      {
        accessorKey: 'name',
        header: 'Name',
      },
      {
        accessorKey: 'age',
        header: 'Age',
      },
      {
        accessorKey: 'role',
        header: 'Role',
      },
    ]

    const { container } = render(() => {
      const table = createPersonTable({
        columns: pinnedCols,
        state: { columnPinning: { start: ['name'], end: ['role'] } },
      })
      return <DataTable table={table} />
    })

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
    const columns: DataTableT.Column<Person>[] = [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'age', header: 'Age' },
      { accessorKey: 'role', header: 'Role' },
    ]
    const { container } = render(() => {
      const table = createPersonTable({
        columns,
        state: { columnPinning: { start: ['name', 'age'], end: [] } },
      })
      return <DataTable table={table} />
    })

    const [nameTh, ageTh] = container.querySelectorAll('th[data-slot="data-table-head"]')
    expect(nameTh!.hasAttribute('data-pinned-edge')).toBe(false)
    expect(ageTh!.getAttribute('data-pinned-edge')).toBe('start')
  })

  it('stacks sticky header cells above pinned body cells', () => {
    const columns: DataTableT.Column<Person>[] = [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'age', header: 'Age' },
      { accessorKey: 'role', header: 'Role' },
    ]
    const { container } = render(() => {
      const table = createPersonTable({
        columns,
        state: { columnPinning: { start: ['name'], end: [] } },
      })
      return <DataTable table={table} sticky maxHeight={200} loading />
    })

    const [pinnedTh, plainTh] = container.querySelectorAll<HTMLElement>('thead th')
    const pinnedTd = container.querySelector<HTMLElement>('tbody td[data-pinned]')!
    const pinnedBodyZ = Number(pinnedTd.style.zIndex)
    expect(Number(plainTh!.style.zIndex)).toBeGreaterThan(pinnedBodyZ)
    expect(Number(pinnedTh!.style.zIndex)).toBeGreaterThan(Number(plainTh!.style.zIndex))

    const loading = container.querySelector('[data-slot="data-table-loading"]')!
    expect(loading.className).toContain('z-40')
  })

  it('renders column resize handles when resizable is true', () => {
    const { container } = render(() => {
      const table = createPersonTable({ resizable: true })
      return <DataTable table={table} />
    })

    const resizers = container.querySelectorAll('[data-slot="data-table-resizer"]')
    expect(resizers.length).toBe(TEST_COLUMNS.length)
  })

  it('supports expandable rows with expandable and expandedRowRender', async () => {
    render(() => {
      const table = createPersonTable({
        expandable: true,
      })
      return (
        <DataTable
          table={table}
          expandedRowRender={(props) => (
            <div data-testid="detail-content">{props.row.original.name} details</div>
          )}
        />
      )
    })

    const expandButtons = screen.getAllByRole('button', { name: /expand row/i })
    expect(expandButtons.length).toBe(3)

    expect(screen.queryByTestId('detail-content')).toBeNull()

    fireEvent.click(expandButtons[0]!)
    expect(screen.getByTestId('detail-content')).toBeDefined()
    expect(screen.getByTestId('detail-content').textContent).toBe('Alice details')

    const wrapper = document.querySelector(
      '[data-slot="data-table-expanded-content"]',
    ) as HTMLElement
    expect(wrapper.className).toContain('data-expanded:animate-accordion-down')
    expect(wrapper.className).toContain('data-closed:animate-accordion-up')
    expect(wrapper.style.animation).not.toBe('none')
    expect(wrapper.style.height).not.toBe('auto')

    fireEvent.click(expandButtons[0]!)
    await Promise.resolve()
    expect(screen.queryByTestId('detail-content')).not.toBeNull()
    expect(wrapper.hasAttribute('data-closed')).toBe(true)

    fireEvent.animationEnd(wrapper, { animationName: 'accordion-up' })
    await Promise.resolve()
    expect(screen.queryByTestId('detail-content')).toBeNull()
  })

  it('reorders columns from table columnOrder state', () => {
    const { container } = render(() => {
      const table = createPersonTable({
        state: { columnOrder: ['role', 'name', 'age'] },
      })
      return <DataTable table={table} />
    })

    const headers = [...container.querySelectorAll('thead th')].map((th) => th.textContent)
    expect(headers).toEqual(['Role', 'Name', 'Age'])

    const firstRowCells = [...container.querySelectorAll('tbody tr:first-child td')].map(
      (td) => td.textContent,
    )
    expect(firstRowCells).toEqual(['Engineer', 'Alice', '28'])
  })

  it('keeps a leading select column when column order lists it first', () => {
    const { container } = render(() => {
      const table = createPersonTable({
        selection: 'multiple',
        state: { columnOrder: ['select', 'role', 'name'] },
      })
      return <DataTable table={table} />
    })

    const headers = [...container.querySelectorAll('thead th')].map((th) => th.textContent?.trim())
    expect(headers[0]).toBe('')
    expect(headers.slice(1)).toEqual(['Role', 'Name', 'Age'])
  })

  it('applies the expandButton slot to expand toggles', () => {
    render(() => {
      const table = createPersonTable({
        expandable: true,
      })
      return (
        <DataTable
          table={table}
          expandedRowRender={(props) => <div>{props.row.original.name}</div>}
          classes={{ expandButton: 'custom-expand' }}
        />
      )
    })

    const [button] = screen.getAllByRole('button', { name: /expand row/i })
    expect(button!.className).toContain('custom-expand')
    expect(button!.className).toContain('data-expanded:rotate-90')
  })

  it('does not emit onRowClick when a selection checkbox is clicked', () => {
    const onRowClick = vi.fn()

    render(() => {
      const table = createPersonTable({ selection: 'multiple' })
      return <DataTable table={table} onRowClick={onRowClick} />
    })

    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[1]!)

    expect(onRowClick).not.toHaveBeenCalled()
    const bodyRows = screen.getAllByRole('row').slice(1)
    expect(bodyRows[0]?.getAttribute('aria-selected')).toBe('true')
  })

  it('emits onRowClick and onRowDoubleClick events', () => {
    const onRowClick = vi.fn()
    const onRowDoubleClick = vi.fn()

    render(() => {
      const table = createPersonTable()
      return <DataTable table={table} onRowClick={onRowClick} onRowDoubleClick={onRowDoubleClick} />
    })

    const bodyRows = screen.getAllByRole('row').slice(1)
    fireEvent.click(bodyRows[0]!)
    expect(onRowClick).toHaveBeenCalledTimes(1)
    expect(onRowClick.mock.calls[0]?.[0].original.name).toBe('Alice')

    fireEvent.dblClick(bodyRows[1]!)
    expect(onRowDoubleClick).toHaveBeenCalledTimes(1)
    expect(onRowDoubleClick.mock.calls[0]?.[0].original.name).toBe('Bob')
  })

  it('sets aria-sort on th headers according to sort state', () => {
    render(() => {
      const table = createPersonTable()
      return <DataTable table={table} />
    })

    const nameTh = screen.getByText('Name').closest('th')!
    expect(nameTh.getAttribute('aria-sort')).toBe('none')

    const sortButton = nameTh.querySelector('button')!
    fireEvent.click(sortButton)
    expect(nameTh.getAttribute('aria-sort')).toBe('ascending')

    fireEvent.click(sortButton)
    expect(nameTh.getAttribute('aria-sort')).toBe('descending')
  })

  it('does not display empty message while loading is true', () => {
    render(() => {
      const table = createPersonTable({ data: [] })
      return <DataTable table={table} loading />
    })

    expect(screen.queryByText('No results.')).toBeNull()
  })

  it('updates column width when dragging resize handle', () => {
    const { container } = render(() => {
      const table = createPersonTable({
        resizable: true,
        columns: [
          { accessorKey: 'name', header: 'Name', size: 100 },
          { accessorKey: 'age', header: 'Age', size: 150 },
        ],
      })
      return <DataTable table={table} />
    })

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

  it('pins a leading select column with explicit columnPinning state', () => {
    const { container } = render(() => {
      const table = createPersonTable({
        selection: 'multiple',
        columns: [
          { accessorKey: 'name', header: 'Name', size: 120 },
          { accessorKey: 'age', header: 'Age', size: 80 },
        ],
        state: { columnPinning: { start: ['select', 'name'], end: [] } },
      })
      return <DataTable table={table} />
    })

    const ths = container.querySelectorAll('thead th')
    expect((ths[0] as HTMLElement).style.position).toBe('sticky')
    expect((ths[0] as HTMLElement).style.left).toBe('0px')
    expect((ths[0] as HTMLElement).style.width).toBe('40px')

    expect((ths[1] as HTMLElement).style.position).toBe('sticky')
    expect((ths[1] as HTMLElement).style.left).toBe('40px')
    expect((ths[1] as HTMLElement).style.width).toBe('120px')
  })

  it('supports translations overrides on DataTable', () => {
    render(() => {
      const table = createPersonTable({
        data: [],
        selection: 'multiple',
        pagination: true,
      })
      return (
        <DataTable
          table={table}
          translations={{
            empty: 'Aucune donnée.',
            selectAll: 'Tout sélectionner',
            selectedCount: ({ selected, total }) => `${selected} sur ${total} sélectionné(s)`,
            pageSize: ({ size }) => `${size} par page`,
          }}
        />
      )
    })

    expect(screen.getByText('Aucune donnée.')).toBeDefined()
    expect(screen.getByLabelText('Tout sélectionner')).toBeDefined()
    expect(screen.getByText('0 sur 0 sélectionné(s)')).toBeDefined()
    expect(screen.getByRole('button', { name: '10 par page' })).toBeDefined()
  })
})
