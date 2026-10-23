import { render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { Table } from './table'

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
    expect(slot(container, 'body')?.tagName).toBe('TBODY')
    expect(slot(container, 'footer')?.tagName).toBe('TFOOT')
    expect(slot(container, 'row')?.tagName).toBe('TR')
    expect(slot(container, 'head')?.tagName).toBe('TH')
    expect(slot(container, 'cell')?.tagName).toBe('TD')
  })

  test('verticalBorder variant applies dividing border to head and cell', () => {
    const { container } = render(() => (
      <Table verticalBorder>
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
      </Table>
    ))

    const heads = container.querySelectorAll('th')
    const cells = container.querySelectorAll('td')
    expect(heads[0]?.className).toContain('[&:not(:last-child)]:border-r')
    expect(cells[0]?.className).toContain('[&:not(:last-child)]:border-r')
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

  test('selected prop on Table.Row sets aria-selected, data-state, and data-selected', () => {
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

    const row = slot(container, 'row')!
    expect(row.hasAttribute('data-selected')).toBe(false)
    expect(row.getAttribute('aria-selected')).toBe('false')

    setSelected(true)
    expect(row.hasAttribute('data-selected')).toBe(true)
    expect(row.getAttribute('aria-selected')).toBe('true')
  })

  test.each([
    ['sm', 'h-8', 'p-1.5', 'text-xs'],
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
    expect(slot(defaultTable, 'row')?.className).not.toContain('even:bg-muted/30')

    const { container } = render(() => (
      <Table striped>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Row 1</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    ))

    expect(slot(container, 'row')?.className).toContain('even:bg-muted/30')
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

  test('borderless variant toggles divider borders', () => {
    const { container: defaultTable } = render(() => (
      <Table>
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
            <Table.Cell>Foot</Table.Cell>
          </Table.Row>
        </Table.Footer>
      </Table>
    ))

    expect(slot(defaultTable, 'header')?.className).toContain('[&_tr]:border-b')
    expect(slot(defaultTable, 'row')?.className).toContain('border-b')
    expect(slot(defaultTable, 'footer')?.className).toContain('border-t')

    const { container: borderlessTable } = render(() => (
      <Table borderless>
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
            <Table.Cell>Foot</Table.Cell>
          </Table.Row>
        </Table.Footer>
      </Table>
    ))

    expect(slot(borderlessTable, 'header')?.className.split(/\s+/)).not.toContain('[&_tr]:border-b')
    expect(slot(borderlessTable, 'row')?.className.split(/\s+/)).not.toContain('border-b')
    expect(slot(borderlessTable, 'footer')?.className.split(/\s+/)).not.toContain('border-t')
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

  test('TableHeader supports align prop', () => {
    const { container } = render(() => (
      <Table>
        <Table.Header align="right">
          <Table.Row>
            <Table.Head>Head</Table.Head>
          </Table.Row>
        </Table.Header>
      </Table>
    ))

    expect(slot(container, 'header')?.className).toContain('text-right')
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

  test('polymorphic as prop renders custom elements', () => {
    const { container } = render(() => (
      <Table as="section">
        <Table.Header as="div">
          <Table.Row as="div">
            <Table.Head as="span">Head</Table.Head>
          </Table.Row>
        </Table.Header>
      </Table>
    ))

    expect(slot(container, '')?.tagName).toBe('SECTION')
    expect(slot(container, 'header')?.tagName).toBe('DIV')
    expect(slot(container, 'row')?.tagName).toBe('DIV')
    expect(slot(container, 'head')?.tagName).toBe('SPAN')
  })
})
