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

  test('forwards wrapperRef to the wrapper element around the table', () => {
    let refEl: HTMLDivElement | undefined
    render(() => (
      <Table wrapperRef={(el) => (refEl = el)}>
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

  test('Table.Caption forwards its ref to the caption element', () => {
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
  })
})
