import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library'
import { createRoot, createSignal, mergeProps } from 'solid-js'
import { describe, expect, it, vi } from 'vitest'

import { MoraineProvider } from '../provider'
import { defineTheme } from '../theme'
import { createTableVirtualizer } from '../virtualizer'

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

function manyPeople(count: number): Person[] {
  return Array.from({ length: count }, (_, index) => ({
    id: String(index + 1),
    name: `Person ${index + 1}`,
    age: 20 + (index % 30),
    role: 'Staff',
  }))
}

/** Visible header label, without the screen-reader-only text of its controls. */
function headLabel(th: Element | null | undefined): string | null | undefined {
  return th?.querySelector('[data-slot="data-table-head-label"]')?.textContent ?? th?.textContent
}

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
      expect(row.hasAttribute('data-selected')).toBe(true)
      // `aria-selected` is only valid on rows of a grid or treegrid, not a static table.
      expect(row.hasAttribute('aria-selected')).toBe(false)
    }

    fireEvent.click(checkboxes[1]!)
    expect(bodyRows[0]?.hasAttribute('data-selected')).toBe(false)
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
    expect(headerRow.hasAttribute('data-selected')).toBe(false)
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

  it('shows every row and selects every row when virtualRender is combined with pagination', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const virtualizer = createTableVirtualizer<DataTableT.Row<Person>>({
      estimateSize: () => 30,
      measureElement: () => 30,
      observeElementRect: (_instance, callback) => callback({ width: 300, height: 3000 }),
      observeElementOffset: (_instance, callback) => callback(0, false),
      overscan: 0,
    })
    let table!: DataTableT.Instance<Person>

    const { container } = render(() => {
      table = createPersonTable({ data: manyPeople(25), pagination: true, selection: 'multiple' })
      return <DataTable table={table} virtualRender={virtualizer.virtualRender} />
    })
    await Promise.resolve()

    // Pagination would otherwise slice to the first 10 rows with no toolbar to reach the rest.
    expect(container.querySelectorAll('tbody tr[data-index]').length).toBe(25)

    // The first checkbox is the select-all header.
    fireEvent.click(screen.getAllByRole('checkbox')[0]!)
    expect(Object.keys(table.atoms.rowSelection?.get() ?? {}).length).toBe(25)
    warnSpy.mockRestore()
  })

  it('keeps rendering when filtering shrinks virtualized rows', async () => {
    const virtualizer = createTableVirtualizer<DataTableT.Row<Person>>({
      estimateSize: () => 10,
      measureElement: () => 10,
      observeElementRect: (_instance, callback) => callback({ width: 300, height: 100 }),
      observeElementOffset: (_instance, callback) => callback(0, false),
      overscan: 2,
    })
    let table!: DataTableT.Instance<Person>

    const { container } = render(() => {
      table = createPersonTable({ data: manyPeople(50) })
      return <DataTable table={table} virtualRender={virtualizer.virtualRender} />
    })
    await Promise.resolve()

    expect(() => table.setGlobalFilter('Person 49')).not.toThrow()
    await Promise.resolve()

    const rows = [...container.querySelectorAll('tbody tr[data-index]')]
    expect(rows.map((row) => row.textContent)).toEqual([expect.stringContaining('Person 49')])
    expect(container.querySelector('table')!.getAttribute('aria-rowcount')).toBe('2')
  })

  it('lets rows with sub-rows expand without the expandable option', () => {
    interface Node {
      id: string
      name: string
      children?: Node[]
    }
    let table!: DataTableT.Instance<Node>
    render(() => {
      table = createDataTable<Node>({
        data: [{ id: 'a', name: 'Parent', children: [{ id: 'b', name: 'Child' }] }],
        columns: [{ accessorKey: 'name', header: 'Name' }],
        tableOptions: { getSubRows: (row) => row.children },
      })
      return <DataTable table={table} />
    })

    const [parent] = table.getRowModel().rows
    expect(parent!.getCanExpand()).toBe(true)
    expect(parent!.subRows[0]!.getCanExpand()).toBe(false)

    parent!.toggleExpanded()
    expect(screen.getByText('Child')).toBeDefined()
  })

  it('applies provider theme overrides through the dataTable theme key', () => {
    render(() => {
      const table = createPersonTable()
      return (
        <MoraineProvider theme={defineTheme({ dataTable: { base: { root: 'p-theme-root' } } })}>
          <DataTable table={table} />
        </MoraineProvider>
      )
    })

    expect(document.querySelector('[data-slot="data-table"]')!.className).toContain('p-theme-root')
  })

  it('handles single row selection when selection="single"', () => {
    render(() => {
      const table = createPersonTable({
        selection: 'single',
      })
      return <DataTable table={table} />
    })

    const radios = screen.getAllByRole<HTMLInputElement>('radio')
    expect(radios.length).toBe(3)
    expect(screen.queryByRole('checkbox')).toBeNull()

    // Native same-name radios form one group: one tab stop and arrow-key navigation.
    const names = new Set(radios.map((radio) => radio.name))
    expect(names.size).toBe(1)
    expect([...names][0]).not.toBe('')

    fireEvent.click(radios[0]!)
    expect(radios.map((radio) => radio.checked)).toEqual([true, false, false])

    fireEvent.click(radios[1]!)
    expect(radios.map((radio) => radio.checked)).toEqual([false, true, false])
    const bodyRows = screen.getAllByRole('row').slice(1)
    expect(bodyRows.map((row) => row.hasAttribute('data-selected'))).toEqual([false, true, false])
  })

  it('renders selection checkboxes with the shared check control and a mixed select-all state', () => {
    const { container } = render(() => {
      const table = createPersonTable({ selection: 'multiple' })
      return <DataTable table={table} size="lg" classes={{ checkbox: 'custom-checkbox' }} />
    })

    const [selectAll, firstRow] = screen.getAllByRole('checkbox')
    expect(selectAll!.getAttribute('aria-label')).toBe('Select all rows')
    expect(selectAll!.getAttribute('aria-checked')).toBe('false')
    expect(firstRow!.getAttribute('aria-label')).toBe('Select row')
    expect(firstRow!.getAttribute('data-slot')).toBe('data-table-checkbox')
    expect(firstRow!.className).toContain('size-4.5')
    expect(firstRow!.className).toContain('custom-checkbox')
    // The lightweight control renders no form input per row.
    expect(container.querySelector('input[type="checkbox"]')).toBeNull()

    fireEvent.click(firstRow!)
    expect(firstRow!.getAttribute('aria-checked')).toBe('true')
    expect(firstRow!.hasAttribute('data-checked')).toBe(true)
    expect(selectAll!.getAttribute('aria-checked')).toBe('mixed')
    expect(selectAll!.hasAttribute('data-indeterminate')).toBe(true)

    // A mixed select-all selects every row.
    fireEvent.click(selectAll!)
    expect(selectAll!.getAttribute('aria-checked')).toBe('true')
    expect(
      screen.getAllByRole('checkbox').map((checkbox) => checkbox.getAttribute('aria-checked')),
    ).toEqual(['true', 'true', 'true', 'true'])
  })

  it('gives separate tables separate single-selection radio groups', () => {
    render(() => {
      // JSX props compile to getters, so create each instance once outside the JSX.
      const first = createPersonTable({ selection: 'single' })
      const second = createPersonTable({ selection: 'single' })
      return (
        <>
          <DataTable table={first} />
          <DataTable table={second} />
        </>
      )
    })

    const names = new Set(screen.getAllByRole<HTMLInputElement>('radio').map((radio) => radio.name))
    expect(names.size).toBe(2)
  })

  it('keeps a single-selection radio unchecked when controlled state rejects the change', () => {
    const onRowSelectionChange = vi.fn()
    render(() => {
      const table = createPersonTable({
        selection: 'single',
        state: { rowSelection: {} },
        onRowSelectionChange,
      })
      return <DataTable table={table} />
    })

    const [radio] = screen.getAllByRole<HTMLInputElement>('radio')
    fireEvent.click(radio!)
    expect(onRowSelectionChange).toHaveBeenCalledOnce()
    expect(radio!.checked).toBe(false)
  })

  it('disables single-selection radios for rows that cannot be selected', () => {
    render(() => {
      const table = createPersonTable({
        selection: 'single',
        canSelectRow: (row) => row.original.role !== 'Intern',
      })
      return <DataTable table={table} />
    })

    const radios = screen.getAllByRole<HTMLInputElement>('radio')
    expect(radios.map((radio) => radio.disabled)).toEqual([false, false, true])
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
    expect(bodyRows[2]?.hasAttribute('data-selected')).toBe(false)
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

    // The section sticks, so grouped header rows stack inside it instead of overlapping.
    const thead = container.querySelector<HTMLElement>('thead')!
    expect(thead.style.position).toBe('sticky')
    expect(thead.style.top).toBe('0px')
    const ths = container.querySelectorAll<HTMLElement>('thead th')
    expect(ths.length).toBeGreaterThan(0)
    for (const th of ths) {
      expect(th.style.position).toBe('')
      expect(th.style.top).toBe('')
      expect(th.className).toContain('bg-background')
    }
  })

  it('sticks a grouped header as one section so its rows stack', () => {
    const { container } = render(() => {
      const table = createPersonTable({
        columns: [
          {
            id: 'person',
            header: 'Person',
            columns: [
              { accessorKey: 'name', header: 'Name', footer: 'Total' },
              { accessorKey: 'age', header: 'Age' },
            ],
            footer: 'People',
          },
        ],
      })
      return <DataTable table={table} sticky maxHeight={200} />
    })

    const thead = container.querySelector<HTMLTableSectionElement>('thead')!
    const tfoot = container.querySelector<HTMLTableSectionElement>('tfoot')!
    expect(thead.rows.length).toBe(2)
    expect(tfoot.rows.length).toBe(2)
    expect([thead.style.position, thead.style.top]).toEqual(['sticky', '0px'])
    expect([tfoot.style.position, tfoot.style.bottom]).toEqual(['sticky', '0px'])
    for (const cell of container.querySelectorAll<HTMLElement>('thead th, tfoot td')) {
      expect(cell.style.top).toBe('')
      expect(cell.style.bottom).toBe('')
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

    const tfoot = container.querySelector<HTMLElement>('tfoot')!
    expect(tfoot.querySelectorAll('td[data-slot="data-table-cell"]').length).toBe(2)
    expect(tfoot.style.position).toBe('sticky')
    expect(tfoot.style.bottom).toBe('0px')
    unmount()

    const { container: footerOnly } = render(() => {
      const table = createPersonTable({ columns: footerColumns })
      return <DataTable table={table} sticky="footer" maxHeight={200} />
    })

    const footerSection = footerOnly.querySelector<HTMLElement>('tfoot')!
    expect(footerSection.style.position).toBe('sticky')
    expect(footerSection.style.bottom).toBe('0px')

    const headerSection = footerOnly.querySelector<HTMLElement>('thead')!
    expect(headerSection.style.position).toBe('')
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

    // The sticky thead is a stacking context above pinned body cells; inside it, the pinned
    // header cell sits above the scrolling ones.
    const thead = container.querySelector<HTMLElement>('thead')!
    const [pinnedTh, plainTh] = container.querySelectorAll<HTMLElement>('thead th')
    const pinnedTd = container.querySelector<HTMLElement>('tbody td[data-pinned]')!
    expect(Number(thead.style.zIndex)).toBeGreaterThan(Number(pinnedTd.style.zIndex))
    expect(Number(pinnedTh!.style.zIndex)).toBeGreaterThan(0)
    expect(plainTh!.style.zIndex).toBe('')

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

    const headers = [...container.querySelectorAll('thead th')].map(headLabel)
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

    const headers = [...container.querySelectorAll('thead th')].map((th) => headLabel(th)?.trim())
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
    expect(bodyRows[0]?.hasAttribute('data-selected')).toBe(true)
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
    const ageTh = screen.getByText('Age').closest('th')!
    // Only the sorted header carries `aria-sort`.
    expect(nameTh.hasAttribute('aria-sort')).toBe(false)

    const sortButton = nameTh.querySelector('button')!
    fireEvent.click(sortButton)
    expect(nameTh.getAttribute('aria-sort')).toBe('ascending')
    expect(ageTh.hasAttribute('aria-sort')).toBe(false)

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
            rowCount: ({ total }) => `${total} ligne(s)`,
            pageSize: ({ size }) => `${size} par page`,
          }}
        />
      )
    })

    expect(screen.getByText('Aucune donnée.')).toBeDefined()
    expect(screen.getByLabelText('Tout sélectionner')).toBeDefined()
    expect(screen.getByText('0 ligne(s)')).toBeDefined()
    expect(screen.getByRole('button', { name: '10 par page' })).toBeDefined()
  })

  it('keeps top-level state and callbacks authoritative over tableOptions', () => {
    createRoot((dispose) => {
      const onSortingChange = vi.fn()
      const escapeHatchSortingChange = vi.fn()
      const table = createPersonTable({
        pagination: { pageSize: 25 },
        initialState: { sorting: [{ id: 'name', desc: false }] },
        onSortingChange,
        // Untyped callers can still pass owned options; they must not take effect.
        tableOptions: {
          initialState: { sorting: [{ id: 'name', desc: true }], pagination: { pageSize: 9 } },
          onSortingChange: escapeHatchSortingChange,
          enableSorting: false,
        } as DataTableT.Options<Person>['tableOptions'],
      })

      expect(table.atoms.sorting?.get()).toEqual([{ id: 'name', desc: false }])
      expect(table.atoms.pagination?.get().pageSize).toBe(25)
      expect(table.getColumn('name')!.getCanSort()).toBe(true)

      table.getColumn('age')!.toggleSorting(false)
      expect(onSortingChange).toHaveBeenCalledWith([{ id: 'age', desc: false }])
      expect(escapeHatchSortingChange).not.toHaveBeenCalled()
      dispose()
    })
  })

  it('still forwards tableOptions that have no top-level option', () => {
    createRoot((dispose) => {
      const table = createPersonTable({
        resizable: true,
        tableOptions: { columnResizeMode: 'onEnd' },
      })
      expect(table.options.columnResizeMode).toBe('onEnd')
      dispose()
    })
  })

  it('lets a column with a derived reserved id replace the generated column instead of duplicating it', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    createRoot((dispose) => {
      interface Flagged {
        id: string
        select: string
        expand: string
      }
      const table = createDataTable<Flagged>({
        data: [{ id: '1', select: 'yes', expand: 'no' }],
        columns: [
          { accessorKey: 'select', header: 'Select value' },
          { header: 'Group', columns: [{ accessorKey: 'expand', header: 'Expand value' }] },
        ],
        selection: 'multiple',
        expandable: true,
      })

      const ids = table.getAllLeafColumns().map((column) => column.id)
      expect(ids).toEqual(['select', 'expand'])
      expect(new Set(ids).size).toBe(ids.length)
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('reserved id "select"'))
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('reserved id "expand"'))
      dispose()
    })
    warnSpy.mockRestore()
  })

  it('replaces the generated column silently for an explicit reserved id', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    createRoot((dispose) => {
      const table = createPersonTable({
        selection: 'multiple',
        columns: [{ id: 'select', header: 'Pick', cell: () => null }, ...TEST_COLUMNS],
      })
      expect(table.getAllLeafColumns().map((column) => column.id)).toEqual([
        'select',
        'name',
        'age',
        'role',
      ])
      expect(warnSpy).not.toHaveBeenCalled()
      dispose()
    })
    warnSpy.mockRestore()
  })

  it('splits a group header at the pin boundary so only the pinned part sticks', () => {
    const { container } = render(() => {
      const table = createPersonTable({
        columns: [
          {
            id: 'person',
            header: 'Person',
            columns: [
              { accessorKey: 'name', header: 'Name', size: 120 },
              { accessorKey: 'age', header: 'Age', size: 80 },
            ],
          },
          { accessorKey: 'role', header: 'Role', size: 100 },
        ],
        state: { columnPinning: { start: ['name'], end: ['role'] } },
      })
      return <DataTable table={table} />
    })

    const [groupRow, leafRow] = container.querySelectorAll('thead tr')
    const groupCells = [...groupRow!.querySelectorAll<HTMLTableCellElement>('th')]
    expect(groupCells.map(headLabel)).toEqual(['Person', 'Person', ''])
    expect(groupCells.map((th) => th.colSpan)).toEqual([1, 1, 1])

    const [pinnedGroup, scrollingGroup, endPlaceholder] = groupCells
    expect(pinnedGroup!.style.position).toBe('sticky')
    expect(pinnedGroup!.style.left).toBe('0px')
    expect(pinnedGroup!.style.width).toBe('120px')
    expect(pinnedGroup!.getAttribute('data-pinned')).toBe('start')
    expect(pinnedGroup!.getAttribute('data-pinned-edge')).toBe('start')
    expect(scrollingGroup!.style.position).toBe('')
    expect(scrollingGroup!.hasAttribute('data-pinned')).toBe(false)
    expect(endPlaceholder!.getAttribute('data-pinned')).toBe('end')
    expect(endPlaceholder!.style.right).toBe('0px')

    const leafCells = [...leafRow!.querySelectorAll<HTMLElement>('th')]
    expect(leafCells.map(headLabel)).toEqual(['Name', 'Age', 'Role'])
    expect(leafCells.map((th) => th.style.position)).toEqual(['sticky', '', 'sticky'])
  })

  it('renders header and footer cells when every column is pinned', () => {
    const { container } = render(() => {
      const table = createPersonTable({
        columns: [
          { accessorKey: 'name', header: 'Name', footer: 'Total', size: 120 },
          { accessorKey: 'role', header: 'Role', footer: '3 roles', size: 100 },
        ],
        state: { columnPinning: { start: ['name'], end: ['role'] } },
      })
      return <DataTable table={table} />
    })

    const heads = [...container.querySelectorAll<HTMLElement>('thead th')]
    expect(heads.map(headLabel)).toEqual(['Name', 'Role'])
    expect(heads.map((th) => th.getAttribute('data-pinned'))).toEqual(['start', 'end'])
    expect(
      heads.map((th) => th.querySelector('[data-slot="data-table-sort-button"]')),
    ).not.toContain(null)

    const footers = [...container.querySelectorAll<HTMLElement>('tfoot td')]
    expect(footers.map((td) => td.textContent)).toEqual(['Total', '3 roles'])
    expect(footers.map((td) => td.getAttribute('data-pinned'))).toEqual(['start', 'end'])
  })

  it('offsets end-pinned header cells from the end of their region', () => {
    const { container } = render(() => {
      const table = createPersonTable({
        columns: [
          { accessorKey: 'name', header: 'Name', size: 120 },
          { accessorKey: 'age', header: 'Age', size: 80 },
          { accessorKey: 'role', header: 'Role', size: 100 },
        ],
        state: { columnPinning: { start: [], end: ['age', 'role'] } },
      })
      return <DataTable table={table} />
    })

    const [, ageTh, roleTh] = container.querySelectorAll<HTMLElement>('thead th')
    expect(ageTh!.style.right).toBe('100px')
    expect(ageTh!.getAttribute('data-pinned-edge')).toBe('end')
    expect(roleTh!.style.right).toBe('0px')
    expect(roleTh!.hasAttribute('data-pinned-edge')).toBe(false)
  })

  it('resizes columns from the keyboard through an accessible separator', () => {
    const onColumnSizingChange = vi.fn()
    const { container } = render(() => {
      const table = createPersonTable({
        resizable: true,
        columns: [
          { accessorKey: 'name', header: 'Name', size: 100, minSize: 60, maxSize: 200 },
          { accessorKey: 'age', header: 'Age', size: 150 },
        ],
        onColumnSizingChange,
      })
      return <DataTable table={table} />
    })

    const [nameTh, ageTh] = container.querySelectorAll<HTMLElement>('thead th')
    const resizer = nameTh!.querySelector<HTMLElement>('[data-slot="data-table-resizer"]')!
    expect(resizer.getAttribute('role')).toBe('separator')
    expect(resizer.getAttribute('aria-orientation')).toBe('vertical')
    // The separator names the column it resizes.
    expect(screen.getByRole('separator', { name: 'Name Resize column' })).toBe(resizer)
    expect(resizer.tabIndex).toBe(0)
    expect(resizer.getAttribute('aria-valuenow')).toBe('100')
    expect(resizer.getAttribute('aria-valuemin')).toBe('60')
    expect(resizer.getAttribute('aria-valuemax')).toBe('200')

    fireEvent.keyDown(resizer, { key: 'ArrowRight' })
    expect(nameTh!.style.width).toBe('110px')
    expect(resizer.getAttribute('aria-valuenow')).toBe('110')
    expect(onColumnSizingChange).toHaveBeenLastCalledWith({ name: 110 })

    fireEvent.keyDown(resizer, { key: 'ArrowLeft', shiftKey: true })
    expect(nameTh!.style.width).toBe('60px')

    fireEvent.keyDown(resizer, { key: 'End' })
    expect(nameTh!.style.width).toBe('200px')

    fireEvent.keyDown(resizer, { key: 'Home' })
    expect(nameTh!.style.width).toBe('60px')

    // Without a maxSize, resizable columns get a finite default range that contains the width.
    const ageResizer = ageTh!.querySelector<HTMLElement>('[data-slot="data-table-resizer"]')!
    expect(ageResizer.getAttribute('aria-valuenow')).toBe('150')
    expect(ageResizer.getAttribute('aria-valuemin')).toBe('20')
    expect(ageResizer.getAttribute('aria-valuemax')).toBe('1000')
    fireEvent.keyDown(ageResizer, { key: 'End' })
    expect(ageTh!.style.width).toBe('1000px')
  })

  it('keeps a defaultColumn maxSize from tableOptions on resizable tables', () => {
    const { container } = render(() => {
      const table = createPersonTable({
        resizable: true,
        columns: [{ accessorKey: 'name', header: 'Name' }],
        tableOptions: { defaultColumn: { maxSize: 400 } },
      })
      return <DataTable table={table} />
    })

    const resizer = container.querySelector<HTMLElement>('[data-slot="data-table-resizer"]')!
    expect(resizer.getAttribute('aria-valuemax')).toBe('400')
  })

  it('does not cap column widths when the table is not resizable', () => {
    createRoot((dispose) => {
      const table = createPersonTable({ columns: [{ accessorKey: 'name', size: 1500 }] })
      expect(table.getColumn('name')!.getSize()).toBe(1500)
      dispose()
    })
  })

  it('names each sort button after its column', () => {
    render(() => {
      const table = createPersonTable()
      return <DataTable table={table} />
    })

    const nameSort = screen.getByRole('button', { name: 'Name Sort' })
    expect(screen.getByRole('button', { name: 'Age Sort' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Role Sort' })).toBeDefined()

    fireEvent.click(nameSort)
    expect(nameSort).toBe(screen.getByRole('button', { name: 'Name Sorted ascending' }))
  })

  it('marks the table busy and announces the default loading state', () => {
    const [loading, setLoading] = createSignal(true)
    const { container } = render(() => {
      const table = createPersonTable()
      return <DataTable table={table} loading={loading()} />
    })

    const table = container.querySelector('table')!
    expect(table.getAttribute('aria-busy')).toBe('true')
    const status = screen.getByRole('status')
    expect(status.getAttribute('data-slot')).toBe('data-table-loading')
    expect(status.textContent).toBe('Loading')

    setLoading(false)
    expect(table.hasAttribute('aria-busy')).toBe(false)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('lets callers override aria-busy', () => {
    const { container } = render(() => {
      const table = createPersonTable()
      return <DataTable table={table} loading aria-busy={false} />
    })

    expect(container.querySelector('table')!.getAttribute('aria-busy')).toBe('false')
  })

  it('does not render detail rows and warns when virtualRender is combined with expandedRowRender', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const virtualizer = createTableVirtualizer<DataTableT.Row<Person>>({
      estimateSize: () => 30,
      measureElement: () => 30,
      observeElementRect: (_instance, callback) => callback({ width: 300, height: 300 }),
      observeElementOffset: (_instance, callback) => callback(0, false),
    })
    let table!: DataTableT.Instance<Person>

    const { container } = render(() => {
      table = createPersonTable({ expandable: true })
      return (
        <DataTable
          table={table}
          virtualRender={virtualizer.virtualRender}
          expandedRowRender={(props) => <div data-testid="detail">{props.row.original.name}</div>}
        />
      )
    })
    await Promise.resolve()

    table.getRowModel().rows[0]!.toggleExpanded(true)
    await Promise.resolve()

    expect(screen.queryByTestId('detail')).toBeNull()
    expect(container.querySelector('[data-slot="data-table-expanded-row"]')).toBeNull()
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('virtualRender and expandedRowRender'),
    )
    warnSpy.mockRestore()
  })

  it('indexes header and footer rows around virtualized rows', async () => {
    const virtualizer = createTableVirtualizer<DataTableT.Row<Person>>({
      estimateSize: () => 30,
      measureElement: () => 30,
      observeElementRect: (_instance, callback) => callback({ width: 300, height: 60 }),
      observeElementOffset: (_instance, callback) => callback(0, false),
      overscan: 0,
    })

    const { container } = render(() => {
      const table = createPersonTable({
        data: manyPeople(50),
        columns: [
          { accessorKey: 'name', header: 'Name', footer: 'Total' },
          { accessorKey: 'age', header: 'Age' },
        ],
      })
      return <DataTable table={table} virtualRender={virtualizer.virtualRender} />
    })
    await Promise.resolve()

    const table = container.querySelector('table')!
    expect(table.getAttribute('aria-rowcount')).toBe('52')
    expect(table.querySelector('thead tr')!.getAttribute('aria-rowindex')).toBe('1')
    expect(table.querySelector('tbody tr[data-index="0"]')!.getAttribute('aria-rowindex')).toBe('2')
    expect(table.querySelector('tfoot tr')!.getAttribute('aria-rowindex')).toBe('52')
  })

  describe('column virtualization', () => {
    type Wide = Record<string, string>

    const CENTER_COUNT = 20
    const WIDE_COLUMNS: DataTableT.Column<Wide>[] = [
      { accessorKey: 'id', header: 'ID', size: 60 },
      ...Array.from({ length: CENTER_COUNT }, (_, index) => ({
        accessorKey: `c${index}`,
        header: `C${index}`,
        size: 100,
      })),
      { accessorKey: 'actions', header: 'Actions', size: 80 },
    ]
    const WIDE_ROWS: Wide[] = Array.from({ length: 30 }, (_, row) =>
      Object.fromEntries([
        ['id', `r${row}`],
        ['actions', `a${row}`],
        ...Array.from({ length: CENTER_COUNT }, (_, index) => [`c${index}`, `r${row}c${index}`]),
      ]),
    )

    function createWideVirtualizer() {
      let emitColumnOffset: ((offset: number, isScrolling: boolean) => void) | undefined
      const virtualizer = createTableVirtualizer<DataTableT.Row<Wide>>({
        estimateSize: () => 30,
        measureElement: () => 30,
        observeElementRect: (_instance, callback) => callback({ width: 440, height: 60 }),
        observeElementOffset: (_instance, callback) => callback(0, false),
        overscan: 0,
        columns: {
          // 440px viewport minus 60px start and 80px end pins leaves room for three columns.
          observeElementRect: (_instance, callback) => callback({ width: 440, height: 60 }),
          observeElementOffset: (_instance, callback) => {
            emitColumnOffset = callback
            callback(0, false)
          },
          overscan: 0,
        },
      })
      return {
        virtualizer,
        scrollColumns: (offset: number) => emitColumnOffset?.(offset, false),
      }
    }

    function createWideTable(options: Partial<DataTableT.Options<Wide>> = {}) {
      const merged = mergeProps(
        {
          data: WIDE_ROWS,
          columns: WIDE_COLUMNS,
          initialState: { columnPinning: { start: ['id'], end: ['actions'] } },
        },
        options,
      )
      return createDataTable<Wide>(merged)
    }

    function firstBodyRow(container: HTMLElement): HTMLTableRowElement {
      return container.querySelector<HTMLTableRowElement>('tbody tr[data-index="0"]')!
    }

    function cellTexts(row: HTMLTableRowElement): string[] {
      return [...row.cells].map((cell) =>
        cell.dataset.slot === 'data-table-cell-spacer' ? `<${cell.colSpan}>` : cell.textContent,
      )
    }

    function spanSum(row: HTMLTableRowElement): number {
      return [...row.cells].reduce((sum, cell) => sum + cell.colSpan, 0)
    }

    it('renders only the window of center cells between the pinned cells', async () => {
      const { virtualizer, scrollColumns } = createWideVirtualizer()
      const { container } = render(() => {
        const table = createWideTable()
        return <DataTable table={table} virtualRender={virtualizer.virtualRender} />
      })
      await Promise.resolve()

      // Rows 0 and 1 are in view; the end spacer covers the 17 columns after the window.
      expect(cellTexts(firstBodyRow(container))).toEqual([
        'r0',
        'r0c0',
        'r0c1',
        'r0c2',
        'r0c3',
        '<16>',
        'a0',
      ])

      // The 60px start pin offsets the columns: columns 9 to 13 overlap the scrolled viewport.
      scrollColumns(1000)
      expect(cellTexts(firstBodyRow(container))).toEqual([
        'r0',
        '<9>',
        'r0c9',
        'r0c10',
        'r0c11',
        'r0c12',
        'r0c13',
        '<6>',
        'a0',
      ])
    })

    it('keeps the header complete and every body row spanning all columns', async () => {
      const { virtualizer, scrollColumns } = createWideVirtualizer()
      const { container } = render(() => {
        const table = createWideTable({
          columns: [
            { accessorKey: 'id', header: 'ID', size: 60 },
            {
              id: 'group',
              header: 'Group',
              columns: WIDE_COLUMNS.slice(1, -1),
            },
            { accessorKey: 'actions', header: 'Actions', size: 80 },
          ],
        })
        return <DataTable table={table} virtualRender={virtualizer.virtualRender} />
      })
      await Promise.resolve()
      scrollColumns(1000)

      const headerRows = [...container.querySelectorAll<HTMLTableRowElement>('thead tr')]
      expect(headerRows.map(spanSum)).toEqual([CENTER_COUNT + 2, CENTER_COUNT + 2])
      expect(container.querySelectorAll('thead th').length).toBeGreaterThan(CENTER_COUNT)
      for (const row of container.querySelectorAll<HTMLTableRowElement>('tbody tr[data-index]')) {
        expect(spanSum(row)).toBe(CENTER_COUNT + 2)
      }
    })

    it('sizes columns from a colgroup in a fixed layout', async () => {
      const { virtualizer } = createWideVirtualizer()
      const { container } = render(() => {
        const table = createWideTable()
        return <DataTable table={table} virtualRender={virtualizer.virtualRender} />
      })
      await Promise.resolve()

      const table = container.querySelector('table')!
      expect(table.style.tableLayout).toBe('fixed')
      const widths = [...table.querySelectorAll('colgroup col')].map(
        (col) => (col as HTMLElement).style.width,
      )
      expect(widths).toEqual(['60px', ...new Array<string>(CENTER_COUNT).fill('100px'), '80px'])
    })

    it('announces the column count and the position of each rendered cell', async () => {
      const { virtualizer, scrollColumns } = createWideVirtualizer()
      const { container } = render(() => {
        const table = createWideTable()
        return <DataTable table={table} virtualRender={virtualizer.virtualRender} />
      })
      await Promise.resolve()
      scrollColumns(1000)

      expect(container.querySelector('table')!.getAttribute('aria-colcount')).toBe('22')
      const row = firstBodyRow(container)
      const indexes = [...row.querySelectorAll('[data-slot="data-table-cell"]')].map((cell) =>
        cell.getAttribute('aria-colindex'),
      )
      expect(indexes).toEqual(['1', '11', '12', '13', '14', '15', '22'])
      for (const spacer of row.querySelectorAll('[data-slot="data-table-cell-spacer"]')) {
        expect(spacer.getAttribute('aria-hidden')).toBe('true')
      }
      expect(container.querySelector('thead th')!.hasAttribute('aria-colindex')).toBe(false)
    })

    it('follows column size, order, and visibility changes', async () => {
      const [sizing, setSizing] = createSignal<Record<string, number>>({})
      const [order, setOrder] = createSignal<string[]>([])
      const [visibility, setVisibility] = createSignal<Record<string, boolean>>({})
      const { virtualizer } = createWideVirtualizer()
      const { container } = render(() => {
        const table = createWideTable({
          state: {
            get columnSizing() {
              return sizing()
            },
            get columnOrder() {
              return order()
            },
            get columnVisibility() {
              return visibility()
            },
          },
          onColumnSizingChange: setSizing,
          onColumnOrderChange: setOrder,
          onColumnVisibilityChange: setVisibility,
        })
        return <DataTable table={table} virtualRender={virtualizer.virtualRender} />
      })
      await Promise.resolve()

      setSizing({ c0: 300 })
      await Promise.resolve()
      expect(cellTexts(firstBodyRow(container))).toEqual(['r0', 'r0c0', 'r0c1', '<18>', 'a0'])

      setSizing({})
      setOrder(['id', 'c5', 'c4'])
      await Promise.resolve()
      expect(cellTexts(firstBodyRow(container)).slice(0, 3)).toEqual(['r0', 'r0c5', 'r0c4'])

      setVisibility({ c5: false })
      await Promise.resolve()
      expect(cellTexts(firstBodyRow(container)).slice(0, 3)).toEqual(['r0', 'r0c4', 'r0c0'])
      expect(spanSum(firstBodyRow(container))).toBe(CENTER_COUNT + 1)
    })

    it('works with row selection and tree indentation', async () => {
      const { virtualizer } = createWideVirtualizer()
      const { container } = render(() => {
        const table = createDataTable<Wide>({
          data: [{ name: 'parent' }],
          columns: [
            { accessorKey: 'name', header: 'Name', size: 100 },
            ...WIDE_COLUMNS.slice(1, 4),
          ],
          selection: 'multiple',
          initialState: { expanded: true },
          tableOptions: {
            getSubRows: (row) => (row.name === 'parent' ? [{ name: 'child' }] : undefined),
          },
        })
        return <DataTable table={table} virtualRender={virtualizer.virtualRender} />
      })
      await Promise.resolve()

      const child = container.querySelector<HTMLTableRowElement>('tbody tr[data-index="1"]')!
      expect(child.querySelector('[role="checkbox"]')).not.toBeNull()
      expect(child.querySelector('td[data-tree]')?.textContent).toBe('child')
    })

    it('renders every column when the virtualizer has no columns option', async () => {
      const virtualizer = createTableVirtualizer<DataTableT.Row<Wide>>({
        estimateSize: () => 30,
        measureElement: () => 30,
        observeElementRect: (_instance, callback) => callback({ width: 440, height: 60 }),
        observeElementOffset: (_instance, callback) => callback(0, false),
        overscan: 0,
      })
      const { container } = render(() => {
        const table = createWideTable()
        return <DataTable table={table} virtualRender={virtualizer.virtualRender} />
      })
      await Promise.resolve()

      const row = firstBodyRow(container)
      expect(row.cells.length).toBe(CENTER_COUNT + 2)
      expect(row.querySelector('[aria-colindex]')).toBeNull()
      expect(container.querySelector('colgroup')).toBeNull()
      expect(container.querySelector('table')!.hasAttribute('aria-colcount')).toBe(false)
    })
  })

  describe('pagination summary', () => {
    function summary(container: HTMLElement): string | null | undefined {
      return container.querySelector('[data-slot="data-table-pagination"]')?.firstElementChild
        ?.textContent
    }

    it('shows the row count when nothing is selected', () => {
      const { container } = render(() => {
        const table = createPersonTable({ pagination: true })
        return <DataTable table={table} />
      })

      expect(summary(container)).toBe('3 rows')
    })

    it('uses the singular for one row', () => {
      const { container } = render(() => {
        const table = createPersonTable({ data: TEST_DATA.slice(0, 1), pagination: true })
        return <DataTable table={table} />
      })

      expect(summary(container)).toBe('1 row')
    })

    it('switches between the selection and row counts as rows are selected', () => {
      let table!: DataTableT.Instance<Person>
      const { container } = render(() => {
        table = createPersonTable({ pagination: true, selection: 'multiple' })
        return <DataTable table={table} />
      })

      expect(summary(container)).toBe('3 rows')

      table.getRow('1').toggleSelected(true)
      expect(summary(container)).toBe('1 of 3 selected')

      table.getRow('1').toggleSelected(false)
      expect(summary(container)).toBe('3 rows')
    })

    it('shows the selection count without a selection column', () => {
      const { container } = render(() => {
        const table = createPersonTable({
          pagination: true,
          initialState: { rowSelection: { '0': true, '2': true } },
        })
        return <DataTable table={table} />
      })

      expect(summary(container)).toBe('2 of 3 selected')
    })

    it('counts the server total in manual mode', () => {
      const { container } = render(() => {
        const table = createPersonTable({ pagination: true, manual: true, rowCount: 120 })
        return <DataTable table={table} />
      })

      expect(summary(container)).toBe('120 rows')
    })
  })

  describe('multi-column sort priority', () => {
    function sortButton(container: HTMLElement, label: string): HTMLButtonElement {
      const th = [...container.querySelectorAll('th')].find((cell) => headLabel(cell) === label)
      return th!.querySelector<HTMLButtonElement>('[data-slot="data-table-sort-button"]')!
    }

    function priorities(container: HTMLElement): Record<string, string> {
      return Object.fromEntries(
        [...container.querySelectorAll('th')].flatMap((th) => {
          const index = th.querySelector('[data-slot="data-table-sort-index"]')
          return index ? [[headLabel(th), index.textContent]] : []
        }),
      )
    }

    function accessibleName(button: HTMLButtonElement): string {
      return button
        .getAttribute('aria-labelledby')!
        .split(' ')
        .map((id) => document.getElementById(id)?.textContent)
        .join(' ')
    }

    it('hides the priority while only one column is sorted', () => {
      const { container } = render(() => {
        const table = createPersonTable()
        return <DataTable table={table} />
      })

      fireEvent.click(sortButton(container, 'Name'))
      expect(priorities(container)).toEqual({})
      expect(accessibleName(sortButton(container, 'Name'))).toBe('Name Sorted ascending')
    })

    it('numbers sorted columns in priority order after a shift-click', () => {
      const { container } = render(() => {
        const table = createPersonTable()
        return <DataTable table={table} />
      })

      fireEvent.click(sortButton(container, 'Role'))
      fireEvent.click(sortButton(container, 'Age'), { shiftKey: true })

      expect(priorities(container)).toEqual({ Role: '1', Age: '2' })
      // TanStack sorts number columns descending first.
      expect(accessibleName(sortButton(container, 'Age'))).toBe(
        'Age Sorted descending Sort priority 2',
      )
      expect(
        sortButton(container, 'Age')
          .querySelector('[data-slot="data-table-sort-index"]')!
          .getAttribute('aria-hidden'),
      ).toBe('true')
    })

    it('renumbers the remaining columns when one leaves the sort', () => {
      const [sorting, setSorting] = createSignal([
        { id: 'name', desc: false },
        { id: 'age', desc: true },
        { id: 'role', desc: false },
      ])
      const { container } = render(() => {
        const table = createPersonTable({
          state: {
            get sorting() {
              return sorting()
            },
          },
          onSortingChange: setSorting,
        })
        return <DataTable table={table} />
      })

      expect(priorities(container)).toEqual({ Name: '1', Age: '2', Role: '3' })

      setSorting([
        { id: 'age', desc: true },
        { id: 'role', desc: false },
      ])
      expect(priorities(container)).toEqual({ Age: '1', Role: '2' })

      setSorting([{ id: 'role', desc: false }])
      expect(priorities(container)).toEqual({})
    })

    it('localizes the priority announcement', () => {
      const { container } = render(() => {
        const table = createPersonTable({
          initialState: {
            sorting: [
              { id: 'name', desc: false },
              { id: 'age', desc: false },
            ],
          },
        })
        return (
          <DataTable
            table={table}
            translations={{ sortPriority: ({ index }) => `Priorité ${index}` }}
          />
        )
      })

      expect(accessibleName(sortButton(container, 'Name'))).toBe('Name Sorted ascending Priorité 1')
    })
  })

  describe('tree data indentation', () => {
    interface TreeNode {
      id: string
      name: string
      kind: string
      children?: TreeNode[]
    }

    const TREE: TreeNode[] = [
      {
        id: 'src',
        name: 'src',
        kind: 'folder',
        children: [
          {
            id: 'components',
            name: 'components',
            kind: 'folder',
            children: [{ id: 'button', name: 'button.tsx', kind: 'file' }],
          },
        ],
      },
      { id: 'readme', name: 'README.md', kind: 'file' },
    ]

    const TREE_COLUMNS: DataTableT.Column<TreeNode>[] = [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'kind', header: 'Kind' },
    ]

    function createTreeTable(options: Partial<DataTableT.Options<TreeNode>> = {}) {
      const merged = mergeProps(
        {
          data: TREE,
          columns: TREE_COLUMNS,
          getRowId: (row: TreeNode) => row.id,
          initialState: { expanded: true as const },
          tableOptions: { getSubRows: (row: TreeNode) => row.children },
        },
        options,
      )
      return createDataTable<TreeNode>(merged)
    }

    function bodyRow(container: HTMLElement, text: string): HTMLTableRowElement {
      const row = [...container.querySelectorAll<HTMLTableRowElement>('tbody tr')].find((element) =>
        element.textContent?.includes(text),
      )
      expect(row).toBeDefined()
      return row!
    }

    function treeCells(row: HTMLTableRowElement): string[] {
      return [...row.querySelectorAll('td[data-tree]')].map((cell) => cell.textContent ?? '')
    }

    it('declares the row depth on sub-rows and marks only their tree cell', () => {
      const { container } = render(() => {
        const table = createTreeTable()
        return <DataTable table={table} />
      })

      const root = bodyRow(container, 'src')
      expect(root.style.getPropertyValue('--mo-data-table-depth')).toBe('')
      expect(treeCells(root)).toEqual([])

      const child = bodyRow(container, 'components')
      expect(child.style.getPropertyValue('--mo-data-table-depth')).toBe('1')
      expect(child.style.getPropertyValue('--mo-data-table-tree-pad')).toContain(
        'var(--mo-data-table-depth)',
      )
      expect(treeCells(child)).toEqual(['components'])

      const grandchild = bodyRow(container, 'button.tsx')
      expect(grandchild.style.getPropertyValue('--mo-data-table-depth')).toBe('2')
      expect(treeCells(grandchild)).toEqual(['button.tsx'])
    })

    it('indents the first data column after the generated selection and expand columns', () => {
      const { container } = render(() => {
        const table = createTreeTable({
          selection: 'multiple',
          expandable: (row) => row.subRows.length > 0,
        })
        return <DataTable table={table} />
      })

      const child = bodyRow(container, 'components')
      const cells = [...child.querySelectorAll('td')]
      expect(cells.map((cell) => cell.hasAttribute('data-tree'))).toEqual([
        false,
        false,
        true,
        false,
      ])
    })

    it('moves the indent with column order and visibility', () => {
      const [order, setOrder] = createSignal<string[]>([])
      const [visibility, setVisibility] = createSignal<Record<string, boolean>>({})
      const { container } = render(() => {
        const table = createTreeTable({
          state: {
            get columnOrder() {
              return order()
            },
            get columnVisibility() {
              return visibility()
            },
          },
          onColumnOrderChange: setOrder,
          onColumnVisibilityChange: setVisibility,
        })
        return <DataTable table={table} />
      })

      expect(treeCells(bodyRow(container, 'components'))).toEqual(['components'])

      setOrder(['kind', 'name'])
      expect(treeCells(bodyRow(container, 'components'))).toEqual(['folder'])

      setVisibility({ kind: false })
      expect(treeCells(bodyRow(container, 'components'))).toEqual(['components'])
    })

    it('indents virtualized sub-rows', async () => {
      const virtualizer = createTableVirtualizer<DataTableT.Row<TreeNode>>({
        estimateSize: () => 30,
        measureElement: () => 30,
        observeElementRect: (_instance, callback) => callback({ width: 300, height: 300 }),
        observeElementOffset: (_instance, callback) => callback(0, false),
        overscan: 0,
      })

      const { container } = render(() => {
        const table = createTreeTable()
        return <DataTable table={table} virtualRender={virtualizer.virtualRender} />
      })
      await Promise.resolve()

      expect(treeCells(bodyRow(container, 'button.tsx'))).toEqual(['button.tsx'])
    })
  })
})
