import { fireEvent, render, within } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import type { ComponentApi } from '../../../build/api-doc/types.ts'

import { DocsApiReference, getDocsApiReferenceTocEntries } from './docs-api-reference.tsx'

const apiDoc: ComponentApi = {
  key: 'example',
  name: 'Example',
  kind: 'composite',
  parts: [
    {
      id: 'example',
      name: 'Example',
      access: { kind: 'export', name: 'Example' },
      description: 'Coordinates the composed parts.',
      props: [
        {
          name: 'items',
          optional: false,
          type: 'Item[]',
          typeDetails: '(string | { value: string; })[]',
        },
      ],
    },
    {
      id: 'trigger',
      name: 'Example.Trigger',
      access: { kind: 'attached', root: 'Example', member: 'Trigger' },
      defaultElement: 'button',
      generics: [{ name: 'T', constraint: 'HTMLElement' }],
      props: [
        {
          name: 'disabled',
          optional: true,
          type: 'boolean | (() => cls_variant0.Boolean_$)',
          description: 'Disables the trigger.',
        },
        {
          name: 'open',
          optional: false,
          type: 'boolean',
          default: { kind: 'literal', value: false },
        },
        { name: 'class', optional: true, type: 'string' },
      ],
    },
  ],
  item: {
    generics: [{ name: 'Value', constraint: 'string | number' }],
    props: [
      {
        name: 'value',
        optional: false,
        type: 'Value',
        description: 'The item value.',
      },
    ],
  },
  slots: ['root', 'trigger', 'content', 'empty'],
  dataAttributes: [
    { target: 'root', attributes: ['data-disabled'] },
    { target: 'trigger', attributes: ['data-disabled', 'data-expanded'] },
    { target: 'content', attributes: ['data-expanded', 'data-unknown'] },
  ],
}

describe('DocsApiReference', () => {
  test('renders compact expandable prop rows without search or copy controls', () => {
    const view = render(() => <DocsApiReference apiDoc={apiDoc} />)

    const columnHeaders = view.getAllByRole('columnheader').map((header) => header.textContent)
    expect(columnHeaders.slice(3, 6)).toEqual(['Prop', 'Type', 'Default'])
    expect(columnHeaders.slice(3, 6)).not.toContain('Description')
    expect(view.queryByRole('textbox')).toBeNull()
    expect(view.queryByRole('button', { name: 'Copy permalink' })).toBeNull()

    const disabled = view.getByRole('button', {
      name: 'disabled, type: Function',
    })
    expect(disabled.getAttribute('aria-expanded')).toBe('false')
    expect(disabled.closest('[data-slot="root"]')?.getAttribute('data-closed')).toBe('')
    fireEvent.click(disabled)
    expect(disabled.getAttribute('aria-expanded')).toBe('true')
    expect(disabled.closest('[data-slot="root"]')?.getAttribute('data-expanded')).toBe('')
    expect(view.getByText('Disables the trigger.')).toBeTruthy()
    const details = view.getByRole('region', { name: /^disabled/ })
    expect(within(details).getByText('boolean | (() => Boolean)')).toBeTruthy()
    expect(details.parentElement?.className).toContain('bg-muted/50')
    expect(disabled.className).toContain('hover:bg-muted/30')
    expect(view.getByRole('link', { name: 'disabled' }).getAttribute('href')).toBe(
      '#api-trigger-disabled',
    )

    const open = view.getByRole('button', {
      name: 'open, required, type: boolean, default: false',
    })
    expect(within(open).getByText('*').getAttribute('aria-hidden')).toBe('true')
    view.unmount()
  })

  test('uses short Web part headings and removes parts navigation', () => {
    const view = render(() => <DocsApiReference apiDoc={apiDoc} />)
    expect(view.getByRole('heading', { name: /Example/ })).toBeTruthy()
    expect(view.getByRole('heading', { name: /Trigger/ })).toBeTruthy()
    expect(view.queryByRole('heading', { name: /Example\.Trigger/ })).toBeNull()
    expect(view.queryByRole('navigation', { name: 'Component parts' })).toBeNull()
    expect(view.queryByText('Does not render a DOM element.')).toBeNull()
    expect(view.queryByText(/Access with/)).toBeNull()
    expect(view.queryByText(/Generic signature/)).toBeNull()
    expect(
      view.getByText(
        (_content, element) =>
          element?.tagName === 'P' &&
          element.textContent === 'Renders a <button> element by default.',
      ),
    ).toBeTruthy()
    expect(getDocsApiReferenceTocEntries(apiDoc)).toContainEqual({
      id: 'api-trigger',
      label: 'Trigger',
      level: 2,
    })
    view.unmount()
  })

  test('expands item arrays inline within Props', () => {
    const view = render(() => <DocsApiReference apiDoc={apiDoc} />)
    expect(view.queryByRole('heading', { name: /^Items/ })).toBeNull()
    const items = view.getByRole('button', { name: 'items, required, type: Item[]' })
    fireEvent.click(items)
    const details = view.getByRole('region', { name: /^items/ })
    expect(within(details).getByText('(string | { value: string; })[]')).toBeTruthy()
    expect(view.getByRole('link', { name: 'items' }).getAttribute('href')).toBe(
      '#api-example-items',
    )
    view.unmount()
  })

  test('aggregates attributes and filters row visibility without truncating slots', () => {
    const view = render(() => <DocsApiReference apiDoc={apiDoc} />)
    expect(view.getByRole('heading', { name: /^Attributes/, level: 2 })).toBeTruthy()
    expect(view.getAllByRole('heading', { level: 2 }).map((heading) => heading.id)).toEqual([
      'api-attributes',
      'api-reference',
    ])
    expect(view.queryByRole('heading', { name: /DOM & State/ })).toBeNull()
    expect(view.queryByRole('heading', { name: /^Slots/ })).toBeNull()
    expect(view.getByRole('columnheader', { name: 'Attributes' })).toBeTruthy()
    expect(view.getByRole('columnheader', { name: 'Slot' })).toBeTruthy()
    expect(view.getByRole('columnheader', { name: 'Description' })).toBeTruthy()
    expect(view.getAllByText('data-disabled')).toHaveLength(1)

    const filter = view.getByRole('combobox', { name: 'Filter attributes by slot' })
    expect(filter.textContent).toBe('All slots')
    expect(filter.parentElement?.parentElement?.className).toContain('justify-start')
    fireEvent.click(filter)
    expect(within(document.body).getByRole('option', { name: 'empty', hidden: true })).toBeTruthy()
    fireEvent.click(within(document.body).getByRole('option', { name: 'content 2', hidden: true }))

    expect(view.queryByText('data-disabled')).toBeNull()
    const expanded = view.getByText('data-expanded')
    expect(expanded).toBeTruthy()
    expect(expanded.closest('button')).toBeNull()
    const expandedRow = expanded.closest('[data-attribute="data-expanded"]')!
    expect(expandedRow.textContent).toContain('trigger, content')
    expect(view.getByText('trigger, content').className).not.toContain('font-mono')
    expect(view.getByText('data-unknown')).toBeTruthy()

    fireEvent.click(filter)
    fireEvent.click(within(document.body).getByRole('option', { name: 'empty', hidden: true }))
    expect(view.getByRole('status').textContent).toContain('No attributes')
    expect(view.getByRole('status').textContent).toContain(
      'This slot does not expose any public data attributes.',
    )
    view.unmount()
  })

  test('uses one Props heading for a single component', () => {
    const single: ComponentApi = {
      ...apiDoc,
      kind: 'single',
      parts: [apiDoc.parts[1]!],
      item: undefined,
      dataAttributes: [],
    }
    const view = render(() => <DocsApiReference apiDoc={single} />)
    expect(view.getAllByRole('heading', { name: /^Props/, level: 2 })).toHaveLength(1)
    expect(view.queryByRole('heading', { name: /^API/ })).toBeNull()
    expect(view.getByRole('columnheader', { name: 'Prop' })).toBeTruthy()
    view.unmount()
  })

  test('renders part sections for a single component with multiple parts', () => {
    const multiPartSingle: ComponentApi = {
      ...apiDoc,
      kind: 'single',
      dataAttributes: [],
    }
    const view = render(() => <DocsApiReference apiDoc={multiPartSingle} />)
    expect(view.getByRole('heading', { name: /Example/, level: 3 })).toBeTruthy()
    expect(view.getByRole('heading', { name: /Trigger/, level: 3 })).toBeTruthy()
    view.unmount()
  })
})

test('renders pre-highlighted types only in expanded details', () => {
  const highlighted: ComponentApi = {
    ...apiDoc,
    parts: [
      {
        ...apiDoc.parts[0]!,
        props: [
          {
            name: 'onChange',
            optional: true,
            type: '(value: string) => void',
            typeHtml:
              '<pre class="shiki"><code><span style="color: red">(value: string) =&gt; void</span></code></pre>',
          },
        ],
      },
    ],
  }
  const view = render(() => <DocsApiReference apiDoc={highlighted} />)
  const trigger = view.getByRole('button', { name: 'onChange, type: Function' })
  expect(trigger.querySelector('.shiki')).toBeNull()
  fireEvent.click(trigger)
  const details = view.getByRole('region', { name: /^onChange/ })
  expect(details.querySelector('.shiki code')?.textContent).toBe('(value: string) => void')
  expect(details.querySelector('span')?.style.color).toBe('red')
  fireEvent.click(trigger)
  expect(trigger.getAttribute('aria-expanded')).toBe('false')
  view.unmount()
})
