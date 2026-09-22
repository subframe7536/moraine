import { fireEvent, render } from '@solidjs/testing-library'
import { expect, test } from 'vitest'

import type { ComponentApi } from '../../../build/api-doc/types.ts'

import { DocsApiReference } from './docs-api-reference.tsx'

const apiDoc: ComponentApi = {
  key: 'example',
  name: 'Example',
  category: 'elements',
  kind: 'composite',
  parts: [
    {
      id: 'example',
      name: 'Example',
      access: { kind: 'export', name: 'Example', package: 'moraine' },
      rendering: { rendersDom: false },
      props: [],
    },
    {
      id: 'trigger',
      name: 'Example.Trigger',
      access: { kind: 'attached', root: 'Example', member: 'Trigger' },
      rendering: { rendersDom: true, defaultElement: 'button' },
      props: [
        {
          name: 'disabled',
          optional: true,
          type: { text: 'boolean' },
          description: 'Disables the trigger.',
        },
        { name: 'open', optional: false, type: { text: 'boolean' } },
        { name: 'class', optional: true, type: { text: 'string' } },
      ],
    },
  ],
  slots: ['trigger', 'content'],
  dataAttributes: [{ target: 'trigger', attributes: ['data-disabled', 'data-expanded'] }],
}

test('renders ungrouped searchable props and composite navigation', async () => {
  const view = render(() => <DocsApiReference apiDoc={apiDoc} />)
  expect(view.getByRole('navigation', { name: 'Component parts' })).toBeTruthy()
  expect(view.getByRole('link', { name: 'Example.Trigger' })).toBeTruthy()
  expect(view.getByText('open*')).toBeTruthy()
  expect(view.queryByText('State')).toBeNull()

  const search = view.getByRole('textbox', { name: 'Search Example.Trigger props' })
  fireEvent.input(search, { target: { value: 'disabled' } })
  expect(view.getByText('disabled')).toBeTruthy()
  expect(view.queryByText('open*')).toBeNull()
  view.unmount()
})

test('renders one component-level DOM and State contract', () => {
  const view = render(() => <DocsApiReference apiDoc={apiDoc} />)
  expect(view.getByRole('heading', { name: /DOM & State/ })).toBeTruthy()
  expect(view.getByRole('heading', { name: 'Data Attributes' })).toBeTruthy()
  expect(view.getByText('data-disabled')).toBeTruthy()
  expect(view.queryByRole('heading', { name: 'CSS Variables' })).toBeNull()
  expect(view.queryByRole('heading', { name: 'Accessibility' })).toBeNull()
  view.unmount()
})
