import { fireEvent, render } from '@solidjs/testing-library'
import { expect, test } from 'vitest'

import type { ComponentDoc } from '../../../build/api-doc/types.ts'

import { DocsApiReference } from './docs-api-reference.tsx'

test('shows the selected slot attribute tables', () => {
  const apiDoc: ComponentDoc = {
    component: {
      key: 'example',
      name: 'Example',
      category: 'general',
      polymorphic: false,
    },
    slots: [
      {
        name: 'root',
        cssVariables: [],
        dataAttributes: [],
        ariaAttributes: [],
      },
      {
        name: 'track',
        cssVariables: [],
        dataAttributes: [
          {
            name: 'data-checked',
            required: false,
            type: 'string | undefined',
            description: 'Present when checked.',
          },
        ],
        ariaAttributes: [
          {
            name: 'aria-checked',
            required: false,
            type: 'boolean | string | undefined',
            description: 'Exposes the checked state.',
          },
        ],
      },
    ],
    props: { own: [], inherited: [] },
  }
  const view = render(() => <DocsApiReference apiDoc={apiDoc} />)

  fireEvent.click(view.getByText('track').closest('button')!)

  expect(view.getByRole('heading', { name: 'Data Attributes' })).toBeTruthy()
  expect(view.getByRole('heading', { name: 'ARIA Attributes' })).toBeTruthy()
  expect(view.getByText('data-checked')).toBeTruthy()
  expect(view.getByText('aria-checked')).toBeTruthy()
  view.unmount()
})
