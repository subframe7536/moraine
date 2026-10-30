import { render } from '@solidjs/testing-library'
import { observeElementOffset } from '@tanstack/virtual-core'
import type { JSX } from 'solid-js'
import { Show, createSignal } from 'solid-js'
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

  test('updates row metadata when header and footer rows change without new entries', async () => {
    const virtualizer = createTableVirtualizer<string>({
      estimateSize: () => 20,
      measureElement: () => 20,
      observeElementRect: (_instance, callback) => callback({ width: 100, height: 40 }),
      observeElementOffset: (_instance, callback) => callback(0, false),
      overscan: 0,
    })
    const [grouped, setGrouped] = createSignal(false)
    const [withFooter, setWithFooter] = createSignal(false)

    const screen = render(() => (
      <table>
        <thead>
          <Show when={grouped()}>
            <tr>
              <th>Group</th>
            </tr>
          </Show>
          <tr>
            <th>Label</th>
          </tr>
        </thead>
        <tbody>
          <Dynamic
            component={virtualizer.virtualRender}
            entries={['a', 'b', 'c']}
            render={(item, _index, props) => <tr {...props}>{item}</tr>}
          />
        </tbody>
        <Show when={withFooter()}>
          <tfoot>
            <tr>
              <td>Total</td>
            </tr>
          </tfoot>
        </Show>
      </table>
    ))
    await Promise.resolve()

    const table = screen.container.querySelector('table')!
    const bodyIndexes = () =>
      [...table.querySelectorAll('tbody tr[data-index]')].map((row) =>
        row.getAttribute('aria-rowindex'),
      )
    expect(table.getAttribute('aria-rowcount')).toBe('4')
    expect(bodyIndexes()).toEqual(['2', '3'])

    setGrouped(true)
    await Promise.resolve()
    expect(table.getAttribute('aria-rowcount')).toBe('5')
    expect(bodyIndexes()).toEqual(['3', '4'])
    expect([...table.tHead!.rows].map((row) => row.getAttribute('aria-rowindex'))).toEqual([
      '1',
      '2',
    ])

    setWithFooter(true)
    await Promise.resolve()
    expect(table.getAttribute('aria-rowcount')).toBe('6')
    expect(table.tFoot!.rows[0]!.getAttribute('aria-rowindex')).toBe('6')

    screen.unmount()
    expect(table.hasAttribute('aria-rowcount')).toBe(false)
  })

  test('keeps a footer row index provided by the caller', async () => {
    const virtualizer = createTableVirtualizer<string>({
      estimateSize: () => 20,
      observeElementRect: (_instance, callback) => callback({ width: 100, height: 40 }),
      observeElementOffset: (_instance, callback) => callback(0, false),
    })

    const screen = render(() => (
      <table>
        <tbody>
          <Dynamic
            component={virtualizer.virtualRender}
            entries={['a', 'b']}
            render={(item, _index, props) => <tr {...props}>{item}</tr>}
          />
        </tbody>
        <tfoot>
          <tr aria-rowindex="42">
            <td>Total</td>
          </tr>
        </tfoot>
      </table>
    ))
    await Promise.resolve()

    const footerRow = screen.container.querySelector('tfoot tr')!
    expect(footerRow.getAttribute('aria-rowindex')).toBe('42')
    screen.unmount()
    expect(footerRow.getAttribute('aria-rowindex')).toBe('42')
  })

  test('yields aria-rowcount to a caller value set after mount', async () => {
    const virtualizer = createTableVirtualizer<string>({
      estimateSize: () => 20,
      measureElement: () => 20,
      observeElementRect: (_instance, callback) => callback({ width: 100, height: 40 }),
      observeElementOffset: (_instance, callback) => callback(0, false),
    })
    const [entries, setEntries] = createSignal(['a', 'b'])
    const [rowCount, setRowCount] = createSignal<string>()
    const [mounted, setMounted] = createSignal(true)

    const screen = render(() => (
      <table aria-rowcount={rowCount()}>
        <tbody>
          <Show when={mounted()}>
            <Dynamic
              component={virtualizer.virtualRender}
              entries={entries()}
              render={(item: string, _index: number, props?: Record<string, unknown>) => (
                <tr {...props}>{item}</tr>
              )}
            />
          </Show>
        </tbody>
      </table>
    ))
    await Promise.resolve()

    const table = screen.container.querySelector('table')!
    expect(table.getAttribute('aria-rowcount')).toBe('2')

    setRowCount('500')
    setEntries(['a', 'b', 'c'])
    expect(table.getAttribute('aria-rowcount')).toBe('500')

    setMounted(false)
    expect(table.getAttribute('aria-rowcount')).toBe('500')
    screen.unmount()
  })

  test('measures the body offset and sticky header height inside an ancestor scroller', async () => {
    const rects = new Map<string, Partial<DOMRect>>([
      ['DIV', { top: 0, height: 200 }],
      ['THEAD', { top: 30, height: 40 }],
      ['TBODY', { top: 70, height: 1000 }],
    ])
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLElement) {
        return { top: 0, height: 0, ...rects.get(this.tagName) } as DOMRect
      })
    const virtualizer = createTableVirtualizer<string>({
      estimateSize: () => 20,
      measureElement: () => 20,
      observeElementRect: (_instance, callback) => callback({ width: 100, height: 200 }),
      observeElementOffset: (_instance, callback) => callback(0, false),
    })
    let scrollElement: HTMLDivElement | undefined

    const screen = render(() => (
      <div
        ref={(element) => {
          scrollElement = element
        }}
      >
        <table>
          <caption>Caption</caption>
          <thead>
            <tr>
              <th style={{ position: 'sticky', top: 0 }}>Label</th>
            </tr>
          </thead>
          <tbody>
            <Dynamic
              component={virtualizer.virtualRender}
              entries={Array.from({ length: 50 }, (_, index) => `Item ${index}`)}
              scrollElement={scrollElement}
              render={(item, _index, props) => <tr {...props}>{item}</tr>}
            />
          </tbody>
        </table>
      </div>
    ))
    await Promise.resolve()

    const options = virtualizer.instance()!.options
    expect(options.scrollMargin).toBe(70)
    expect(options.scrollPaddingStart).toBe(40)
    expect(options.scrollPaddingEnd).toBe(0)
    // Spacers stay relative to the first body row.
    const spacers = screen.container.querySelectorAll<HTMLElement>('tr[aria-hidden="true"]')
    expect(spacers[0]?.style.height).toBe('0px')

    screen.unmount()
    rectSpy.mockRestore()
  })

  test('does not treat a horizontally pinned header cell as a sticky header', async () => {
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLElement) {
        return { top: this.tagName === 'TBODY' ? 40 : 0, height: 40 } as DOMRect
      })
    const virtualizer = createTableVirtualizer<string>({
      estimateSize: () => 20,
      observeElementRect: (_instance, callback) => callback({ width: 100, height: 200 }),
      observeElementOffset: (_instance, callback) => callback(0, false),
    })
    let scrollElement: HTMLDivElement | undefined

    const screen = render(() => (
      <div
        ref={(element) => {
          scrollElement = element
        }}
      >
        <table>
          <thead>
            <tr>
              <th style={{ position: 'sticky', left: 0 }}>Label</th>
            </tr>
          </thead>
          <tbody>
            <Dynamic
              component={virtualizer.virtualRender}
              entries={['a']}
              scrollElement={scrollElement}
              render={(item, _index, props) => <tr {...props}>{item}</tr>}
            />
          </tbody>
        </table>
      </div>
    ))
    await Promise.resolve()

    const options = virtualizer.instance()!.options
    expect(options.scrollMargin).toBe(40)
    expect(options.scrollPaddingStart).toBe(0)
    screen.unmount()
    rectSpy.mockRestore()
  })

  test('prefers explicit scrollMargin and scroll padding over measured values', async () => {
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(function (this: HTMLElement) {
        return { top: this.tagName === 'TBODY' ? 70 : 0, height: 40 } as DOMRect
      })
    const virtualizer = createTableVirtualizer<string>({
      estimateSize: () => 20,
      scrollMargin: 5,
      scrollPaddingStart: 6,
      observeElementRect: (_instance, callback) => callback({ width: 100, height: 200 }),
      observeElementOffset: (_instance, callback) => callback(0, false),
    })
    let scrollElement: HTMLDivElement | undefined

    const screen = render(() => (
      <div
        ref={(element) => {
          scrollElement = element
        }}
      >
        <table>
          <thead style={{ position: 'sticky' }}>
            <tr>
              <th>Label</th>
            </tr>
          </thead>
          <tbody>
            <Dynamic
              component={virtualizer.virtualRender}
              entries={['a']}
              scrollElement={scrollElement}
              render={(item, _index, props) => <tr {...props}>{item}</tr>}
            />
          </tbody>
        </table>
      </div>
    ))
    await Promise.resolve()

    const options = virtualizer.instance()!.options
    expect(options.scrollMargin).toBe(5)
    expect(options.scrollPaddingStart).toBe(6)
    screen.unmount()
    rectSpy.mockRestore()
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

  test('marks the last entry, which the trailing spacer row hides from :last-child', async () => {
    let emitOffset: ((offset: number, isScrolling: boolean) => void) | undefined
    const virtualizer = createTableVirtualizer<string>({
      estimateSize: () => 20,
      measureElement: () => 20,
      observeElementRect: (_instance, callback) => callback({ width: 100, height: 40 }),
      observeElementOffset: (_instance, callback) => {
        emitOffset = callback
        callback(0, false)
      },
      overscan: 0,
    })
    const entries = Array.from({ length: 10 }, (_, index) => `Item ${index}`)
    const screen = render(() => (
      <Table>
        <Table.Body>
          <Dynamic
            component={virtualizer.virtualRender}
            entries={entries}
            render={(item, _index, props) => (
              <Table.Row {...props}>
                <Table.Cell>{item}</Table.Cell>
              </Table.Row>
            )}
          />
        </Table.Body>
      </Table>
    ))
    await Promise.resolve()

    const markers = () =>
      [...screen.container.querySelectorAll('tr[data-index]')].map(
        (row) => `${row.getAttribute('data-index')}${row.hasAttribute('data-last') ? ' last' : ''}`,
      )
    expect(markers()).toEqual(['0', '1'])
    expect(
      [...screen.container.querySelectorAll('tr[data-index]')].some((row) =>
        row.hasAttribute('data-even'),
      ),
    ).toBe(false)

    emitOffset?.(160, false)
    expect(markers()).toEqual(['8', '9 last'])
    screen.unmount()
  })

  describe('column virtualization', () => {
    const COLUMNS = Array.from({ length: 20 }, (_, index) => `c${index}`)

    function createColumnVirtualizer(
      columnOptions: NonNullable<
        Parameters<typeof createTableVirtualizer<string, string>>[0]['columns']
      > = {},
    ) {
      let emitColumnOffset: ((offset: number, isScrolling: boolean) => void) | undefined
      const virtualizer = createTableVirtualizer<string, string>({
        estimateSize: () => 20,
        measureElement: () => 20,
        observeElementRect: (_instance, callback) => callback({ width: 300, height: 40 }),
        observeElementOffset: (_instance, callback) => callback(0, false),
        overscan: 0,
        columns: {
          observeElementRect: (_instance, callback) => callback({ width: 300, height: 40 }),
          observeElementOffset: (_instance, callback) => {
            emitColumnOffset = callback
            callback(0, false)
          },
          overscan: 0,
          ...columnOptions,
        },
      })
      return { virtualizer, scrollColumns: (offset: number) => emitColumnOffset?.(offset, false) }
    }

    function renderColumns(
      virtualizer: ReturnType<typeof createTableVirtualizer<string, string>>,
      props: {
        columns?: () => readonly string[]
        columnSize?: (column: string, index: number) => number
        columnLayout?: { scrollMargin?: number }
        tableProps?: Record<string, string>
      } = {},
    ) {
      const scrollElement = document.createElement('div')
      Object.defineProperties(scrollElement, {
        clientWidth: { configurable: true, value: 300 },
        scrollWidth: { configurable: true, value: 2000 },
      })
      document.body.append(scrollElement)
      const screen = render(() => (
        <table {...props.tableProps}>
          <tbody>
            <Dynamic
              component={virtualizer.virtualRender}
              entries={['a', 'b']}
              scrollElement={scrollElement}
              columns={props.columns?.() ?? COLUMNS}
              columnSize={props.columnSize ?? (() => 100)}
              columnLayout={props.columnLayout}
              render={(item, _index, rowProps) => (
                <tr {...rowProps}>
                  <td>{item}</td>
                </tr>
              )}
            />
          </tbody>
        </table>
      ))
      return {
        screen,
        cleanup: () => {
          screen.unmount()
          scrollElement.remove()
        },
      }
    }

    const indexes = (virtualizer: ReturnType<typeof createTableVirtualizer<string, string>>) =>
      virtualizer.columnWindow()?.items.map((item) => item.index)

    test('lists the visible columns and the skipped counts on each side', async () => {
      const { virtualizer, scrollColumns } = createColumnVirtualizer()
      const { cleanup } = renderColumns(virtualizer)
      await Promise.resolve()

      expect(indexes(virtualizer)).toEqual([0, 1, 2])
      expect(virtualizer.columnWindow()).toMatchObject({ skippedBefore: 0, skippedAfter: 17 })
      expect(virtualizer.columnWindow()?.items[1]).toMatchObject({ start: 100, size: 100 })

      scrollColumns(500)
      expect(indexes(virtualizer)).toEqual([5, 6, 7])
      expect(virtualizer.columnWindow()).toMatchObject({ skippedBefore: 5, skippedAfter: 12 })
      cleanup()
      expect(virtualizer.columnWindow()).toBeUndefined()
    })

    test('widens the window by overscan', async () => {
      const { virtualizer, scrollColumns } = createColumnVirtualizer({ overscan: 2 })
      const { cleanup } = renderColumns(virtualizer)
      await Promise.resolve()

      scrollColumns(500)
      expect(indexes(virtualizer)).toEqual([3, 4, 5, 6, 7, 8, 9])
      cleanup()
    })

    test('offsets the window by the column scrollMargin', async () => {
      const { virtualizer } = createColumnVirtualizer()
      const { cleanup } = renderColumns(virtualizer, { columnLayout: { scrollMargin: 200 } })
      await Promise.resolve()

      // Pinned cells take the first 200px of the 300px viewport.
      expect(virtualizer.columnInstance()?.options.scrollMargin).toBe(200)
      expect(indexes(virtualizer)).toEqual([0])
      cleanup()
    })

    test('recomputes the window when host column widths change', async () => {
      const [width, setWidth] = createSignal(100)
      const { virtualizer } = createColumnVirtualizer()
      const { cleanup } = renderColumns(virtualizer, { columnSize: () => width() })
      await Promise.resolve()
      expect(indexes(virtualizer)).toEqual([0, 1, 2])

      setWidth(50)
      await Promise.resolve()
      expect(indexes(virtualizer)).toEqual([0, 1, 2, 3, 4, 5])
      expect(virtualizer.columnWindow()?.items[1]).toMatchObject({ start: 50, size: 50 })
      cleanup()
    })

    test('prefers columns.estimateSize over the host column size', async () => {
      const { virtualizer } = createColumnVirtualizer({ estimateSize: () => 150 })
      const { cleanup } = renderColumns(virtualizer)
      await Promise.resolve()

      expect(indexes(virtualizer)).toEqual([0, 1])
      cleanup()
    })

    test('skips window entries past the end when columns shrink', async () => {
      const [columns, setColumns] = createSignal<readonly string[]>(COLUMNS)
      const { virtualizer } = createColumnVirtualizer()
      const { cleanup } = renderColumns(virtualizer, { columns })
      await Promise.resolve()

      setColumns(['only'])
      await Promise.resolve()
      expect(indexes(virtualizer)).toEqual([0])
      expect(virtualizer.columnWindow()).toMatchObject({ skippedBefore: 0, skippedAfter: 0 })
      cleanup()
    })

    test('exposes the window while mounted and clears it on unmount', async () => {
      const { virtualizer, scrollColumns } = createColumnVirtualizer()
      const { cleanup } = renderColumns(virtualizer)
      await Promise.resolve()

      expect(virtualizer.columnWindow()).toMatchObject({ skippedBefore: 0, skippedAfter: 17 })

      scrollColumns(500)
      expect(virtualizer.columnWindow()).toMatchObject({ skippedBefore: 5 })

      cleanup()
      expect(virtualizer.columnWindow()).toBeUndefined()
    })

    test('scrolls to a column', async () => {
      const scrollToFn = vi.fn()
      const { virtualizer } = createColumnVirtualizer({ scrollToFn })
      const { cleanup } = renderColumns(virtualizer)
      await Promise.resolve()
      scrollToFn.mockClear()

      virtualizer.scrollToColumn(4, { align: 'start' })
      expect(scrollToFn).toHaveBeenCalledWith(
        400,
        expect.objectContaining({ behavior: 'auto' }),
        virtualizer.columnInstance(),
      )
      cleanup()
    })

    test('announces aria-colcount and removes it on unmount', async () => {
      const { virtualizer } = createColumnVirtualizer()
      const { screen, cleanup } = renderColumns(virtualizer)
      await Promise.resolve()

      const table = screen.container.querySelector('table')!
      expect(table.getAttribute('aria-colcount')).toBe('20')
      cleanup()
      expect(table.getAttribute('aria-colcount')).toBeNull()
    })

    test('keeps an explicit aria-colcount provided by the caller', async () => {
      const { virtualizer } = createColumnVirtualizer()
      const { screen, cleanup } = renderColumns(virtualizer, {
        tableProps: { 'aria-colcount': '24' },
      })
      await Promise.resolve()

      const table = screen.container.querySelector('table')!
      expect(table.getAttribute('aria-colcount')).toBe('24')
      cleanup()
      expect(table.getAttribute('aria-colcount')).toBe('24')
    })

    test('stays inactive without the columns option', async () => {
      const virtualizer = createTableVirtualizer<string, string>({
        estimateSize: () => 20,
        observeElementRect: (_instance, callback) => callback({ width: 300, height: 40 }),
        observeElementOffset: (_instance, callback) => callback(0, false),
      })
      const { screen, cleanup } = renderColumns(virtualizer)
      await Promise.resolve()

      expect(virtualizer.columnWindow()).toBeUndefined()
      expect(virtualizer.columnInstance()).toBeUndefined()
      expect(screen.container.querySelector('table')!.hasAttribute('aria-colcount')).toBe(false)
      cleanup()
    })

    test('renders the rows at the mounted scroll position, like the stock observer', async () => {
      const mount = async (offsetObserver?: typeof observeElementOffset) => {
        const scrollElement = document.createElement('div')
        let scrollTop = 900
        Object.defineProperty(scrollElement, 'scrollTop', {
          configurable: true,
          get: () => scrollTop,
          set: (value: number) => {
            scrollTop = value
          },
        })
        scrollElement.scrollTo = ((options: ScrollToOptions) => {
          if (options.top !== undefined) {
            scrollTop = options.top
          }
        }) as typeof scrollElement.scrollTo
        document.body.append(scrollElement)
        const virtualizer = createTableVirtualizer<string>({
          estimateSize: () => 30,
          measureElement: () => 30,
          observeElementRect: (_instance, callback) => callback({ width: 100, height: 90 }),
          ...(offsetObserver ? { observeElementOffset: offsetObserver } : {}),
          overscan: 0,
        })
        const entries = Array.from({ length: 100 }, (_, index) => `Item ${index}`)
        const screen = renderInTbody(virtualizer, entries, { scrollElement })
        await Promise.resolve()
        const rows = [...screen.container.querySelectorAll('tr[data-index]')].map((row) =>
          row.getAttribute('data-index'),
        )
        screen.unmount()
        scrollElement.remove()
        return { scrollTop, rows }
      }

      // TanStack applies `initialOffset` on mount, so the rows always match the container.
      const shared = await mount()
      expect(shared).toEqual(await mount(observeElementOffset))
      expect(shared.rows).toEqual(
        Array.from({ length: 3 }, (_, index) => String(Math.floor(shared.scrollTop / 30) + index)),
      )
    })

    test('shares one scroll listener and updates both axes in one batch', async () => {
      const scrollElement = document.createElement('div')
      let scrollTop = 0
      let scrollLeft = 0
      Object.defineProperties(scrollElement, {
        scrollTop: { configurable: true, get: () => scrollTop },
        scrollLeft: { configurable: true, get: () => scrollLeft },
      })
      document.body.append(scrollElement)
      const addListener = vi.spyOn(scrollElement, 'addEventListener')
      const removeListener = vi.spyOn(scrollElement, 'removeEventListener')
      const scrollListeners = () =>
        addListener.mock.calls.filter(([type]) => type === 'scroll').length -
        removeListener.mock.calls.filter(([type]) => type === 'scroll').length
      const virtualizer = createTableVirtualizer<string, string>({
        estimateSize: () => 20,
        measureElement: () => 20,
        observeElementRect: (_instance, callback) => callback({ width: 300, height: 40 }),
        overscan: 0,
        columns: {
          observeElementRect: (_instance, callback) => callback({ width: 300, height: 40 }),
          overscan: 0,
        },
      })
      const entries = Array.from({ length: 50 }, (_, index) => `Item ${index}`)
      const cellRuns: string[] = []
      const screen = render(() => (
        <table>
          <tbody>
            <Dynamic
              component={virtualizer.virtualRender}
              entries={entries}
              scrollElement={scrollElement}
              columns={COLUMNS}
              columnSize={() => 100}
              render={(item, _index, rowProps) => (
                <tr {...rowProps}>
                  <td>
                    {(() => {
                      const skipped = virtualizer.columnWindow()?.skippedBefore
                      cellRuns.push(`${item}:${skipped}`)
                      return skipped
                    })()}
                  </td>
                </tr>
              )}
            />
          </tbody>
        </table>
      ))
      await Promise.resolve()
      expect(scrollListeners()).toBe(1)

      cellRuns.length = 0
      scrollTop = 200
      scrollLeft = 500
      scrollElement.dispatchEvent(new Event('scroll'))

      const rows = [...screen.container.querySelectorAll('tr[data-index]')]
      expect(rows.map((row) => row.getAttribute('data-index'))).toEqual(['10', '11'])
      expect(rows.map((row) => row.textContent)).toEqual(['5', '5'])
      // Rows mount once with the new column window, instead of mounting with the old window and
      // updating when the column listener runs.
      expect(cellRuns).toEqual(['Item 10:5', 'Item 11:5'])

      screen.unmount()
      expect(scrollListeners()).toBe(0)
      scrollElement.remove()
    })
  })
})
