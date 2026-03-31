import { render } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { PropsTable } from './props-table'

describe('PropsTable description html rendering', () => {
  test('renders prop and section/group descriptions as html', () => {
    const screen = render(() => (
      <PropsTable
        sections={[
          {
            id: 'api-props',
            heading: 'Props',
            description: 'Section <strong>markdown</strong>',
            props: [
              {
                name: 'value',
                required: false,
                type: 'string',
                description: 'Inline <code>code</code>',
              },
            ],
          },
          {
            id: 'api-inherited',
            heading: 'Inherited',
            props: [
              { name: 'placeholder', required: false, type: 'string' },
            ],
            groups: [
              {
                description: 'From <code>@kobalte/core/button</code>',
                props: [
                  {
                    name: 'disabled',
                    required: false,
                    type: 'boolean',
                    description: 'Inherited <em>desc</em>',
                  },
                ],
              },
            ],
          },
        ]}
      />
    ))

    expect(screen.container.innerHTML).toContain('<strong>markdown</strong>')
    expect(screen.container.innerHTML).toContain('<code>code</code>')
    expect(screen.container.innerHTML).toContain('<code>@kobalte/core/button</code>')
    expect(screen.container.innerHTML).toContain('<em>desc</em>')
  })

  test('keeps fallback when description is missing', () => {
    const screen = render(() => (
      <PropsTable
        sections={[
          {
            id: 'api-props',
            heading: 'Props',
            props: [{ name: 'value', required: false, type: 'string' }],
          },
        ]}
      />
    ))

    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })
})
