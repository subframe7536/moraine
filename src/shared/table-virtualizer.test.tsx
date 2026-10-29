import { render } from '@solidjs/testing-library'
import type { JSX } from 'solid-js'
import { createSignal } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { describe, expect, test, vi } from 'vitest'

import { Table } from '../components/table/table'

import { createTableVirtualizer } from './table-virtualizer'

type TableVirtualizer = ReturnType<typeof createTableVirtualizer<string>>

function renderInTbody(
  virtualizer: TableVirtualizer,
  entries: readonly string[],
  options?: {
    scrollElement?: HTMLDivElement
    renderRow?: (item: string, index: number, props?: Record<string, unknown>) => JSX.Element
  },
) {
  return render(() => (
    <table>
      <tbody>
        <Dynamic
          component={virtualizer.virtualRender}
          entries={entries}
          scrollElement={options?.scrollElement}
          render={options?.renderRow ?? ((item, _index, props) => <tr {...props}>{item}</tr>)}
        />
      </tbody>
    </table>
  ))
}

describe('createTableVirtualizer', () => {
  test('renders constant spacer rows and only the visible window with data-index', async () => {
    const scrollElement = document.createElement('div')
    document.body.append(scrollElement)
    const virtualizer = createTableVirtualizer<string>({
      estimateSize: () => 20,
      measureElement: () => 20,
      observeElementRect: (_instance, callback) => callback({ width: 100, height: 40 }),
      observeElementOffset: (_instance, callback) => callback(0, false),
      overscan: 0,
    })
    const entries = Array.from({ length: 100 }, (_, index) => `Item ${index}`)

    const screen = renderInTbody(virtualizer, entries, { scrollElement })
    await Promise.resolve()

    const tbody = screen.container.querySelector('tbody')!
    const spacers = tbody.querySelectorAll<HTMLTableRowElement>('tr[aria-hidden="true"]')
    expect(spacers.length).toBe(2)
    expect(spacers[0]?.style.height).toBe('0px')
    expect(spacers[1]?.style.height).toBe('1960px')

    const rows = [...tbody.querySelectorAll('tr[data-index]')]
    expect(rows.map((row) => row.getAttribute('data-index'))).toEqual(['0', '1'])
    expect(rows[0]?.textContent).toBe('Item 0')
    screen.unmount()
    scrollElement.remove()
  })

  test('renders empty spacers and no rows for zero entries', async () => {
    const scrollElement = document.createElement('div')
    document.body.append(scrollElement)
    const virtualizer = createTableVirtualizer<string>({
      estimateSize: () => 20,
      observeElementRect: (_instance, callback) => callback({ width: 100, height: 40 }),
      observeElementOffset: (_instance, callback) => callback(0, false),
    })

    const screen = renderInTbody(virtualizer, [], { scrollElement })
    await Promise.resolve()

    const tbody = screen.container.querySelector('tbody')!
    expect(virtualizer.instance()?.getTotalSize()).toBe(0)
    expect(tbody.querySelectorAll('tr[data-index]').length).toBe(0)
    expect(
      [...tbody.querySelectorAll<HTMLTableRowElement>('tr[aria-hidden="true"]')].map(
        (row) => row.style.height,
      ),
    ).toEqual(['0px', '0px'])
    screen.unmount()
    scrollElement.remove()
  })

  test('rebuilds rows when entries are reactively replaced', async () => {
    const scrollElement = document.createElement('div')
    document.body.append(scrollElement)
    const [entries, setEntries] = createSignal(['Alpha', 'Beta'])
    const virtualizer = createTableVirtualizer<string>({
      estimateSize: () => 20,
      measureElement: () => 20,
      observeElementRect: (_instance, callback) => callback({ width: 100, height: 40 }),
      observeElementOffset: (_instance, callback) => callback(0, false),
    })

    const screen = render(() => (
      <table>
        <tbody>
          <Dynamic
            component={virtualizer.virtualRender}
            entries={entries()}
            scrollElement={scrollElement}
            render={(item, _index, props) => <tr {...props}>{item}</tr>}
          />
        </tbody>
      </table>
    ))
    await Promise.resolve()
    expect(screen.container.querySelector('tr[data-index="0"]')?.textContent).toBe('Alpha')

    setEntries(['Beta updated', 'Alpha updated'])
    await Promise.resolve()
    expect(screen.container.querySelector('tr[data-index="0"]')?.textContent).toBe('Beta updated')
    expect(screen.container.querySelector('tr[data-index="1"]')?.textContent).toBe('Alpha updated')
    screen.unmount()
    scrollElement.remove()
  })

  test('defaults the scroll element to the host tbody', async () => {
    const virtualizer = createTableVirtualizer<string>({
      estimateSize: () => 20,
      observeElementRect: (_instance, callback) => callback({ width: 100, height: 40 }),
      observeElementOffset: (_instance, callback) => callback(0, false),
    })

    const screen = renderInTbody(virtualizer, ['one'])
    await Promise.resolve()

    const tbody = screen.container.querySelector('tbody')!
    expect(virtualizer.instance()?.scrollElement).toBe(tbody)
    screen.unmount()
  })

  test('releases observers and the instance on unmount', async () => {
    const scrollElement = document.createElement('div')
    document.body.append(scrollElement)
    const cleanupRect = vi.fn()
    const cleanupOffset = vi.fn()
    const virtualizer = createTableVirtualizer<string>({
      estimateSize: () => 20,
      observeElementRect: (_instance, callback) => {
        callback({ width: 100, height: 40 })
        return cleanupRect
      },
      observeElementOffset: (_instance, callback) => {
        callback(0, false)
        return cleanupOffset
      },
    })

    const screen = renderInTbody(virtualizer, ['one'], { scrollElement })
    await Promise.resolve()

    expect(virtualizer.instance()?.scrollElement).toBe(scrollElement)

    screen.unmount()

    expect(cleanupRect).toHaveBeenCalledOnce()
    expect(cleanupOffset).toHaveBeenCalledOnce()
    expect(virtualizer.instance()).toBeUndefined()
    scrollElement.remove()
  })

  test('forwards an explicit scrollMargin option', async () => {
    const scrollElement = document.createElement('div')
    document.body.append(scrollElement)
    const virtualizer = createTableVirtualizer<string>({
      estimateSize: () => 20,
      scrollMargin: 7,
      observeElementRect: (_instance, callback) => callback({ width: 100, height: 40 }),
      observeElementOffset: (_instance, callback) => callback(0, false),
    })

    const screen = renderInTbody(virtualizer, ['one'], { scrollElement })
    await Promise.resolve()

    expect(virtualizer.instance()?.options.scrollMargin).toBe(7)
    screen.unmount()
    scrollElement.remove()
  })

  test('scrolls to an index while mounted and becomes inert after unmount', async () => {
    const scrollElement = document.createElement('div')
    Object.defineProperties(scrollElement, {
      clientHeight: { configurable: true, value: 40 },
      scrollHeight: { configurable: true, value: 200 },
    })
    document.body.append(scrollElement)
    const scrollToFn = vi.fn()
    const virtualizer = createTableVirtualizer<string>({
      estimateSize: () => 20,
      observeElementRect: (_instance, callback) => callback({ width: 100, height: 40 }),
      observeElementOffset: (_instance, callback) => callback(0, false),
      scrollToFn,
    })

    const screen = renderInTbody(
      virtualizer,
      Array.from({ length: 10 }, (_, index) => `Item ${index}`),
      { scrollElement },
    )
    await Promise.resolve()
    scrollToFn.mockClear()

    virtualizer.scrollToIndex(3, { align: 'start' })
    expect(scrollToFn).toHaveBeenCalledWith(
      60,
      expect.objectContaining({ behavior: 'auto' }),
      virtualizer.instance(),
    )

    screen.unmount()
    scrollToFn.mockClear()
    virtualizer.scrollToIndex(4)
    expect(scrollToFn).not.toHaveBeenCalled()
    scrollElement.remove()
  })

  test('announces aria-rowcount and absolute aria-rowindex with header rows', async () => {
    const scrollElement = document.createElement('div')
    document.body.append(scrollElement)
    const virtualizer = createTableVirtualizer<string>({
      estimateSize: () => 20,
      measureElement: () => 20,
      observeElementRect: (_instance, callback) => callback({ width: 100, height: 40 }),
      observeElementOffset: (_instance, callback) => callback(0, false),
      overscan: 0,
    })

    const screen = render(() => (
      <table>
        <thead>
          <tr>
            <th>Label</th>
          </tr>
        </thead>
        <tbody>
          <Dynamic
            component={virtualizer.virtualRender}
            entries={['a', 'b', 'c']}
            scrollElement={scrollElement}
            render={(item, _index, props) => <tr {...props}>{item}</tr>}
          />
        </tbody>
      </table>
    ))
    await Promise.resolve()

    const table = screen.container.querySelector('table')!
    const rows = [...table.querySelectorAll('tr[data-index]')]
    expect(table.getAttribute('aria-rowcount')).toBe('4')
    expect(rows.map((row) => row.getAttribute('aria-rowindex'))).toEqual(['2', '3'])

    screen.unmount()
    expect(table.getAttribute('aria-rowcount')).toBeNull()
    scrollElement.remove()
  })

  test('keeps an explicit aria-rowcount provided by the caller', async () => {
    const scrollElement = document.createElement('div')
    document.body.append(scrollElement)
    const virtualizer = createTableVirtualizer<string>({
      estimateSize: () => 20,
      observeElementRect: (_instance, callback) => callback({ width: 100, height: 40 }),
      observeElementOffset: (_instance, callback) => callback(0, false),
    })

    const screen = render(() => (
      <table aria-rowcount="999">
        <tbody>
          <Dynamic
            component={virtualizer.virtualRender}
            entries={['a', 'b']}
            scrollElement={scrollElement}
            render={(item, _index, props) => <tr {...props}>{item}</tr>}
          />
        </tbody>
      </table>
    ))
    await Promise.resolve()

    const table = screen.container.querySelector('table')!
    expect(table.getAttribute('aria-rowcount')).toBe('999')

    screen.unmount()
    expect(table.getAttribute('aria-rowcount')).toBe('999')
    scrollElement.remove()
  })

  test('measures spacer rows from the first row when scrollMargin is set', async () => {
    const virtualizer = createTableVirtualizer<string>({
      estimateSize: () => 10,
      measureElement: () => 10,
      observeElementRect: (_instance, callback) => callback({ width: 100, height: 70 }),
      observeElementOffset: (_instance, callback) => callback(0, false),
      overscan: 0,
      scrollMargin: 40,
    })
    const entries = Array.from({ length: 10 }, (_, index) => `Item ${index}`)

    const screen = renderInTbody(virtualizer, entries)
    await Promise.resolve()

    // The first 30px of the viewport sit above the list, so rows 0-2 are visible.
    const spacers = screen.container.querySelectorAll<HTMLElement>('tr[aria-hidden="true"]')
    const rows = screen.container.querySelectorAll('tr[data-index]')
    expect(rows.length).toBe(3)
    expect(spacers[0]?.style.height).toBe('0px')
    expect(spacers[1]?.style.height).toBe('70px')
    screen.unmount()
  })

  test('skips rows past the end when entries shrink', async () => {
    const virtualizer = createTableVirtualizer<string>({
      estimateSize: () => 10,
      measureElement: () => 10,
      observeElementRect: (_instance, callback) => callback({ width: 100, height: 100 }),
      observeElementOffset: (_instance, callback) => callback(0, false),
      overscan: 2,
    })
    const [entries, setEntries] = createSignal(
      Array.from({ length: 50 }, (_, index) => `Item ${index}`),
    )
    const rendered: unknown[] = []

    const screen = render(() => (
      <table>
        <tbody>
          <Dynamic
            component={virtualizer.virtualRender}
            entries={entries()}
            render={(item: string, _index: number, props?: Record<string, unknown>) => {
              rendered.push(item)
              return <tr {...props}>{item.toUpperCase()}</tr>
            }}
          />
        </tbody>
      </table>
    ))
    await Promise.resolve()

    expect(() => setEntries(['a', 'b'])).not.toThrow()
    await Promise.resolve()

    expect(rendered).not.toContain(undefined)
    const rows = [...screen.container.querySelectorAll('tr[data-index]')]
    expect(rows.map((row) => row.textContent)).toEqual(['A', 'B'])
    screen.unmount()
  })

  test('updates its own aria-rowcount when entries change', async () => {
    const virtualizer = createTableVirtualizer<string>({
      estimateSize: () => 20,
      measureElement: () => 20,
      observeElementRect: (_instance, callback) => callback({ width: 100, height: 40 }),
      observeElementOffset: (_instance, callback) => callback(0, false),
    })
    const [entries, setEntries] = createSignal(['a', 'b', 'c'])

    const screen = render(() => (
      <table>
        <tbody>
          <Dynamic
            component={virtualizer.virtualRender}
            entries={entries()}
            render={(item: string, _index: number, props?: Record<string, unknown>) => (
              <tr {...props}>{item}</tr>
            )}
          />
        </tbody>
      </table>
    ))
    await Promise.resolve()

    const table = screen.container.querySelector('table')!
    expect(table.getAttribute('aria-rowcount')).toBe('3')

    setEntries(['a'])
    expect(table.getAttribute('aria-rowcount')).toBe('1')

    setEntries([])
    expect(table.hasAttribute('aria-rowcount')).toBe(false)
    screen.unmount()
  })

  test('composes with Table: the tbody becomes the scroll element and rows render inside the body', async () => {
    const virtualizer = createTableVirtualizer<string>({
      estimateSize: () => 20,
      measureElement: () => 20,
      observeElementRect: (_instance, callback) => callback({ width: 100, height: 40 }),
      observeElementOffset: (_instance, callback) => callback(0, false),
      overscan: 0,
    })
    const VirtualRender = virtualizer.virtualRender

    const screen = render(() => (
      <Table
        classes={{
          root: 'block',
          header: 'table w-full table-fixed',
          body: 'block max-h-96 overflow-y-auto [&_tr]:table [&_tr]:w-full [&_tr]:table-fixed',
        }}
      >
        <Table.Header>
          <Table.Row>
            <Table.Head class="w-1/2">Label</Table.Head>
            <Table.Head class="w-1/2">Value</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Dynamic
            component={VirtualRender}
            entries={['a', 'b', 'c']}
            render={(item, _index, props) => (
              <Table.Row {...props}>
                <Table.Cell class="w-1/2">{item}</Table.Cell>
                <Table.Cell class="w-1/2">{item.toUpperCase()}</Table.Cell>
              </Table.Row>
            )}
          />
        </Table.Body>
      </Table>
    ))
    await Promise.resolve()

    const body = screen.container.querySelector('[data-slot="table-body"]')!
    expect(virtualizer.instance()?.scrollElement).toBe(body)
    expect(body.className).toContain('overflow-y-auto')

    const table = screen.container.querySelector('[data-slot="table"]')!
    expect(table.getAttribute('aria-rowcount')).toBe('4')

    const rows = [...body.querySelectorAll('[data-slot="table-row"]')]
    expect(rows.map((row) => row.getAttribute('data-index'))).toEqual(['0', '1'])
    expect(rows.map((row) => row.getAttribute('aria-rowindex'))).toEqual(['2', '3'])
    expect(rows[0]?.textContent).toBe('aA')
    screen.unmount()
  })
})
