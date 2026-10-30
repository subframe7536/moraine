import { render } from '@solidjs/testing-library'
import { For, createEffect, createSignal, on } from 'solid-js'
import { describe, expect, test } from 'vitest'

import type { TableVirtualColumnWindow } from '../../shared/virtual'

import { Table } from './table'
import { TABLE_STRIPED_ROW_CLASS } from './table.recipe'

const slot = (container: HTMLElement, name: string) =>
  container.querySelector(`[data-slot="table${name ? `-${name}` : ''}"]`) as HTMLElement | null

describe('Table', () => {
  test('renders every public part with its default element and data-slot', () => {
    const { container } = render(() => (
      <Table>
        <Table.Caption>Caption</Table.Caption>
        <Table.Header>
          <Table.Row>
            <Table.Head>Head</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Cell</Table.Cell>
          </Table.Row>
        </Table.Body>
        <Table.Footer>
          <Table.Row>
            <Table.Cell>Footer Cell</Table.Cell>
          </Table.Row>
        </Table.Footer>
      </Table>
    ))

    expect(slot(container, 'container')?.tagName).toBe('DIV')
    expect(slot(container, '')?.tagName).toBe('TABLE')
    expect(slot(container, 'caption')?.tagName).toBe('CAPTION')
    expect(slot(container, 'header')?.tagName).toBe('THEAD')
    expect(slot(container, 'header')?.className).toContain('text-left')
    expect(slot(container, 'body')?.tagName).toBe('TBODY')
    expect(slot(container, 'footer')?.tagName).toBe('TFOOT')
    expect(slot(container, 'row')?.tagName).toBe('TR')
    expect(slot(container, 'head')?.tagName).toBe('TH')
    expect(slot(container, 'cell')?.tagName).toBe('TD')
  })

  test('showBorder variant controls row, column, and combined divider borders', () => {
    // Default showBorder="row"
    const { container: rowTable } = render(() => (
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.Head>Head 1</Table.Head>
            <Table.Head>Head 2</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Cell 1</Table.Cell>
            <Table.Cell>Cell 2</Table.Cell>
          </Table.Row>
        </Table.Body>
        <Table.Footer>
          <Table.Row>
            <Table.Cell>Foot 1</Table.Cell>
          </Table.Row>
        </Table.Footer>
      </Table>
    ))

    expect(slot(rowTable, 'header')?.className).toContain('[&_tr]:border-b')
    expect(slot(rowTable, 'row')?.className).toContain('border-b')
    expect(slot(rowTable, 'footer')?.className).toContain('border-t')
    const rowHeads = rowTable.querySelectorAll('th')
    expect(rowHeads[0]?.className).not.toContain('[&:not(:last-child)]:border-r')

    // showBorder="col"
    const { container: colTable } = render(() => (
      <Table showBorder="col">
        <Table.Header>
          <Table.Row>
            <Table.Head>Head 1</Table.Head>
            <Table.Head>Head 2</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Cell 1</Table.Cell>
            <Table.Cell>Cell 2</Table.Cell>
          </Table.Row>
        </Table.Body>
        <Table.Footer>
          <Table.Row>
            <Table.Cell>Foot 1</Table.Cell>
          </Table.Row>
        </Table.Footer>
      </Table>
    ))

    expect(slot(colTable, 'header')?.className.split(/\s+/)).not.toContain('[&_tr]:border-b')
    expect(slot(colTable, 'row')?.className.split(/\s+/)).not.toContain('border-b')
    expect(slot(colTable, 'footer')?.className.split(/\s+/)).not.toContain('border-t')
    const colHeads = colTable.querySelectorAll('th')
    const colCells = colTable.querySelectorAll('td')
    expect(colHeads[0]?.className).toContain('[&:not(:last-child)]:border-r')
    expect(colCells[0]?.className).toContain('[&:not(:last-child)]:border-r')

    // showBorder="both"
    const { container: bothTable } = render(() => (
      <Table showBorder="both">
        <Table.Header>
          <Table.Row>
            <Table.Head>Head 1</Table.Head>
            <Table.Head>Head 2</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Cell 1</Table.Cell>
            <Table.Cell>Cell 2</Table.Cell>
          </Table.Row>
        </Table.Body>
        <Table.Footer>
          <Table.Row>
            <Table.Cell>Foot 1</Table.Cell>
          </Table.Row>
        </Table.Footer>
      </Table>
    ))

    expect(slot(bothTable, 'header')?.className).toContain('[&_tr]:border-b')
    expect(slot(bothTable, 'row')?.className).toContain('border-b')
    expect(slot(bothTable, 'footer')?.className).toContain('border-t')
    const bothHeads = bothTable.querySelectorAll('th')
    const bothCells = bothTable.querySelectorAll('td')
    expect(bothHeads[0]?.className).toContain('[&:not(:last-child)]:border-r')
    expect(bothCells[0]?.className).toContain('[&:not(:last-child)]:border-r')
  })

  test('forwards containerRef to the outer wrapper element', () => {
    let refEl: HTMLDivElement | undefined
    render(() => (
      <Table containerRef={(el) => (refEl = el)}>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Cell</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    ))

    expect(refEl?.getAttribute('data-slot')).toBe('table-container')
  })

  test('selected prop on Table.Row sets data-selected without aria-selected', () => {
    const [selected, setSelected] = createSignal(false)
    const { container } = render(() => (
      <Table>
        <Table.Body>
          <Table.Row selected={selected()}>
            <Table.Cell>Item</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    ))

    // `aria-selected` is only valid on rows of a grid or treegrid, not a static table.
    const row = slot(container, 'row')!
    expect(row.hasAttribute('data-selected')).toBe(false)
    expect(row.hasAttribute('aria-selected')).toBe(false)

    setSelected(true)
    expect(row.hasAttribute('data-selected')).toBe(true)
    expect(row.hasAttribute('aria-selected')).toBe(false)
  })

  test.each([
    ['sm', 'h-8', 'py-1.5', 'text-xs'],
    ['md', 'h-10', 'p-2', 'text-sm'],
    ['lg', 'h-12', 'p-4', 'text-base'],
  ] as const)(
    '%s density applies to table, head, and cell',
    (size, headHeight, cellPadding, rootText) => {
      const { container } = render(() => (
        <Table size={size}>
          <Table.Header>
            <Table.Row>
              <Table.Head>Header</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell>Cell</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      ))

      expect(slot(container, '')?.className).toContain(rootText)
      expect(slot(container, 'head')?.className).toContain(headHeight)
      expect(slot(container, 'cell')?.className).toContain(cellPadding)
    },
  )

  test('striped variant applies alternating background to rows (false by default)', () => {
    const { container: defaultTable } = render(() => (
      <Table>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Row 1</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    ))
    expect(slot(defaultTable, 'row')?.className).not.toContain('bg-muted/50')

    const { container } = render(() => (
      <Table striped>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Row 1</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    ))

    expect(slot(container, 'row')?.className).toContain(
      '[&:nth-child(even):not([data-virtual-row]):not([data-selected])]:bg-muted/50',
    )
    expect(slot(container, 'row')?.className).toContain(
      '[&[data-even]:not([data-selected])]:bg-muted/50',
    )
  })

  test('stripes static rows by DOM position even when they carry data-index', () => {
    const { container } = render(() => (
      <Table striped>
        <Table.Body>
          <For each={[0, 1, 2, 3]}>
            {(index) => (
              <Table.Row data-index={index}>
                <Table.Cell>Row {index}</Table.Cell>
              </Table.Row>
            )}
          </For>
        </Table.Body>
      </Table>
    ))

    // Each striping utility is `[&<selector>]:bg-...`; match rows against those selectors.
    const selectors = TABLE_STRIPED_ROW_CLASS.split(' ').map((token) =>
      token.slice(2, token.lastIndexOf(']:')),
    )
    const striped = (row: Element) => selectors.some((selector) => row.matches(selector))
    expect([...container.querySelectorAll('tbody tr')].map(striped)).toEqual([
      false,
      true,
      false,
      true,
    ])
  })

  test('hoverEffect variant adds row hover background only when enabled (false by default)', () => {
    const { container: defaultTable } = render(() => (
      <Table>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Row 1</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    ))
    expect(slot(defaultTable, 'row')?.className).not.toContain('hover:bg-accent/50')

    const { container } = render(() => (
      <Table hoverEffect>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Row 1</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    ))
    expect(slot(container, 'row')?.className).toContain(
      '[tbody>&:not([data-selected]):hover]:bg-accent/50',
    )
  })

  test('base table rows and root include border-border', () => {
    const { container } = render(() => (
      <Table>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Cell</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    ))

    expect(slot(container, 'row')?.className).toContain('border-border')
    expect(slot(container, '')?.className).toContain('border-border')
  })

  test('align and truncated props on Table.Head and Table.Cell', () => {
    const { container } = render(() => (
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.Head align="center" truncated>
              Center
            </Table.Head>
            <Table.Head align="right">Right</Table.Head>
            <Table.Head align="left">Left</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell align="center" truncated>
              Cell Center
            </Table.Cell>
            <Table.Cell align="right">Cell Right</Table.Cell>
            <Table.Cell align="left">Cell Left</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    ))

    const heads = container.querySelectorAll('th')
    expect(heads[0]!.className).toContain('text-center')
    expect(heads[0]!.className).toContain('truncate')
    expect(heads[1]!.className).toContain('text-right')
    expect(heads[2]!.className).toContain('text-left')

    const cells = container.querySelectorAll('td')
    expect(cells[0]!.className).toContain('text-center')
    expect(cells[0]!.className).toContain('truncate')
    expect(cells[1]!.className).toContain('text-right')
    expect(cells[2]!.className).toContain('text-left')
  })

  test('Table.Head aligns left by default, including row headers outside thead', () => {
    const { container } = render(() => (
      <Table>
        <Table.Body>
          <Table.Row>
            <Table.Head scope="row">Row header</Table.Head>
            <Table.Cell>Cell</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    ))

    expect(container.querySelector('th')!.className).toContain('text-left')
  })

  test('classes and styles overrides from Table root', () => {
    const { container } = render(() => (
      <Table
        classes={{
          container: 'custom-container',
          root: 'custom-table',
          header: 'custom-header',
          body: 'custom-body',
          row: 'custom-row',
          cell: 'custom-cell',
        }}
        styles={{
          root: { opacity: '0.8' },
        }}
      >
        <Table.Header>
          <Table.Row>
            <Table.Head>H</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell>C</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    ))

    expect(slot(container, 'container')?.className).toContain('custom-container')
    expect(slot(container, '')?.className).toContain('custom-table')
    expect(slot(container, '')?.style.opacity).toBe('0.8')
    expect(slot(container, 'header')?.className).toContain('custom-header')
    expect(slot(container, 'body')?.className).toContain('custom-body')
    expect(slot(container, 'row')?.className).toContain('custom-row')
    expect(slot(container, 'cell')?.className).toContain('custom-cell')
  })

  test('forwards native table attributes like colSpan, rowSpan, scope', () => {
    const { container } = render(() => (
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.Head scope="col">Col 1</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell colSpan={2} rowSpan={1}>
              Merged
            </Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    ))

    const th = container.querySelector('th')!
    expect(th.getAttribute('scope')).toBe('col')

    const td = container.querySelector('td')!
    expect(td.colSpan).toBe(2)
    expect(td.rowSpan).toBe(1)
  })

  test('Table.Caption renders caption element with forwarded ref and recipe classes', () => {
    let captionRef: HTMLElement | undefined
    const { container } = render(() => (
      <Table>
        <Table.Caption ref={(el) => (captionRef = el)}>Invoice list</Table.Caption>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Cell</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    ))

    const caption = slot(container, 'caption')!
    expect(caption.tagName).toBe('CAPTION')
    expect(captionRef).toBe(caption)
    expect(caption.className).toContain('text-muted-foreground')
    expect(caption.className).toContain('my-4')
  })

  test('Table.VirtualRows mounts its virtualizer and passes the scroll element and columns', () => {
    let received: { scrollElement?: HTMLElement; columns?: readonly unknown[] } = {}
    const scroller = document.createElement('div')
    const { container } = render(() => (
      <Table>
        <Table.Body>
          <Table.VirtualRows
            items={['a', 'b', 'c']}
            scrollElement={scroller}
            columns={['x']}
            virtualizer={{
              scrollToIndex: () => {},
              columnWindow: () => undefined,
              virtualRender: (props) => {
                createEffect(
                  on(
                    () => [props.scrollElement, props.columns] as const,
                    ([scrollElement, columns]) => {
                      received = { scrollElement, columns }
                    },
                  ),
                )
                return (
                  <For each={props.entries.slice(1)}>
                    {(entry, index) => (
                      <>{props.render(entry, index() + 1, { 'data-index': index() + 1 })}</>
                    )}
                  </For>
                )
              },
            }}
            itemRender={(context) => (
              <Table.Row {...context.props}>
                <Table.Cell>{context.item}</Table.Cell>
              </Table.Row>
            )}
          />
        </Table.Body>
      </Table>
    ))

    const rows = [...slot(container, 'body')!.querySelectorAll('tr')]
    expect(rows.map((row) => row.textContent)).toEqual(['b', 'c'])
    expect(rows.map((row) => row.getAttribute('data-index'))).toEqual(['1', '2'])
    expect(received).toEqual({ scrollElement: scroller, columns: ['x'] })
  })

  test('Table.VirtualCells renders the column window between placeholder cells', () => {
    const columns = ['c0', 'c1', 'c2', 'c3', 'c4']
    const [window, setWindow] = createSignal<TableVirtualColumnWindow | undefined>()
    const { container } = render(() => (
      <Table>
        <Table.Body>
          <Table.VirtualRows
            items={['row']}
            columns={columns}
            columnIndexStart={2}
            virtualizer={{
              scrollToIndex: () => {},
              columnWindow: window,
              virtualRender: (props) => (
                <For each={props.entries}>
                  {(entry, index) => <>{props.render(entry, index(), {})}</>}
                </For>
              ),
            }}
            itemRender={(context) => (
              <Table.Row {...context.props}>
                <Table.Cell>head</Table.Cell>
                <Table.VirtualCells<string>
                  itemRender={(cell) => (
                    <Table.Cell {...cell.props}>
                      {cell.column}:{cell.index}
                    </Table.Cell>
                  )}
                />
              </Table.Row>
            )}
          />
        </Table.Body>
      </Table>
    ))
    const cells = () => [...container.querySelectorAll('tbody td')]

    // Without a window, every column renders.
    expect(cells().map((cell) => cell.textContent)).toEqual([
      'head',
      'c0:0',
      'c1:1',
      'c2:2',
      'c3:3',
      'c4:4',
    ])
    expect(cells()[1]!.getAttribute('aria-colindex')).toBe('2')

    const item = (index: number) => ({ index, start: index * 10, size: 10, key: index })
    setWindow({ items: [item(1), item(2)], skippedBefore: 1, skippedAfter: 2 })
    const c1 = cells().find((cell) => cell.textContent === 'c1:1')
    expect(cells().map((cell) => cell.textContent)).toEqual(['head', '', 'c1:1', 'c2:2', ''])
    const spacers = container.querySelectorAll('[data-slot="table-cell-spacer"]')
    expect([...spacers].map((cell) => cell.getAttribute('colspan'))).toEqual(['1', '2'])
    expect(spacers[0]!.getAttribute('aria-hidden')).toBe('true')

    // Cells still in the window stay mounted while it slides.
    setWindow({ items: [item(1), item(2), item(3)], skippedBefore: 1, skippedAfter: 1 })
    expect(cells().find((cell) => cell.textContent === 'c1:1')).toBe(c1)
    expect(
      cells()
        .find((cell) => cell.textContent === 'c3:3')!
        .getAttribute('aria-colindex'),
    ).toBe('5')
  })
})
