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
      props: [],
    },
    {
      id: 'trigger',
      name: 'Example.Trigger',
      access: { kind: 'attached', root: 'Example', member: 'Trigger' },
      defaultElement: 'button',
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
  slots: ['root', 'trigger', 'content'],
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
    expect(columnHeaders.slice(0, 3)).toEqual(['Prop', 'Type', 'Default'])
    expect(columnHeaders.slice(0, 3)).not.toContain('Description')
    expect(view.queryByRole('textbox')).toBeNull()
    expect(view.queryByRole('button', { name: 'Copy permalink' })).toBeNull()

    const disabled = view.getByRole('button', {
      name: 'disabled, type: boolean | (() => Boolean)',
    })
    expect(disabled.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(disabled)
    expect(disabled.getAttribute('aria-expanded')).toBe('true')
    expect(view.getByText('Disables the trigger.')).toBeTruthy()
    expect(
      within(view.getByRole('region', { name: /^disabled/ })).getByText(
        'boolean | (() => Boolean)',
      ),
    ).toBeTruthy()
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
    expect(view.getByText('Does not render a DOM element.')).toBeTruthy()
    expect(view.getByText(/Renders a/)).toBeTruthy()
    expect(getDocsApiReferenceTocEntries(apiDoc)).toContainEqual({
      id: 'api-trigger',
      label: 'Trigger',
      level: 2,
    })
    view.unmount()
  })

  test('renders item fields through the same expandable reference rows', () => {
    const view = render(() => <DocsApiReference apiDoc={apiDoc} />)
    expect(view.getByRole('columnheader', { name: 'Field' })).toBeTruthy()
    expect(view.getByText('<Value extends string | number>')).toBeTruthy()

    const value = view.getByRole('button', { name: 'value, required, type: Value' })
    fireEvent.click(value)
    expect(view.getByText('The item value.')).toBeTruthy()
    expect(view.getByRole('link', { name: 'value' }).getAttribute('href')).toBe('#api-items-value')
    view.unmount()
  })

  test('aggregates attributes and filters row visibility without truncating slots', () => {
    const view = render(() => <DocsApiReference apiDoc={apiDoc} />)
    expect(view.getByRole('heading', { name: /Attributes/ })).toBeTruthy()
    expect(view.queryByRole('heading', { name: /DOM & State/ })).toBeNull()
    expect(view.queryByRole('heading', { name: /^Slots/ })).toBeNull()
    expect(view.getByRole('columnheader', { name: 'Attributes' })).toBeTruthy()
    expect(view.getByRole('columnheader', { name: 'Slot' })).toBeTruthy()
    expect(view.getByRole('columnheader', { name: 'Description' })).toBeTruthy()
    expect(view.getAllByText('data-disabled')).toHaveLength(1)

    const filter = view.getByRole('combobox', { name: 'Filter attributes by slot' })
    expect(filter.textContent).toContain('All slots')
    fireEvent.click(filter)
    fireEvent.click(within(document.body).getByRole('option', { name: 'content', hidden: true }))

    expect(view.queryByText('data-disabled')).toBeNull()
    const expanded = view.getByText('data-expanded')
    expect(expanded).toBeTruthy()
    const expandedButton = expanded.closest('button')!
    expect(expandedButton.textContent).toContain('trigger')
    expect(expandedButton.textContent).toContain('content')
    expect(view.getByText('data-unknown')).toBeTruthy()
    view.unmount()
  })

  test('does not add a Props heading for a single component', () => {
    const single: ComponentApi = {
      ...apiDoc,
      kind: 'single',
      parts: [apiDoc.parts[1]!],
      item: undefined,
      dataAttributes: [],
    }
    const view = render(() => <DocsApiReference apiDoc={single} />)
    expect(view.getByRole('heading', { name: /API/ })).toBeTruthy()
    expect(view.queryByRole('heading', { name: /Props/ })).toBeNull()
    expect(view.getByRole('columnheader', { name: 'Prop' })).toBeTruthy()
    view.unmount()
  })
})
