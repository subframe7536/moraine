import { render } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { DocsHeader } from './docs-header'

describe('DocsHeader description html rendering', () => {
  test('renders component description html', () => {
    const screen = render(() => (
      <DocsHeader
        componentKey="select"
        apiDoc={{
          component: {
            key: 'select',
            name: 'Select',
            category: 'Form',
            polymorphic: false,
            description: 'Use <strong>keyboard</strong> and <code>search</code>.',
          },
          slots: [],
          props: { own: [], inherited: [] },
        }}
      />
    ))

    expect(screen.container.querySelector('strong')?.textContent).toBe('keyboard')
    expect(screen.container.querySelector('code')?.textContent).toBe('search')
  })
})

