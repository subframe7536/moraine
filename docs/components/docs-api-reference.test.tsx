// oxlint-disable class-methods-use-this
import { fireEvent, render } from '@solidjs/testing-library'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { DocsApiReference } from './docs-api-reference'

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock as typeof ResizeObserver

const originalMatchMedia = window.matchMedia

function createMatchMediaMock(matches = false) {
  return vi.fn().mockImplementation(() => ({
    matches,
    media: '',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }))
}

beforeEach(() => {
  window.matchMedia = createMatchMediaMock(false) as unknown as typeof window.matchMedia
})

afterEach(() => {
  window.matchMedia = originalMatchMedia
})

describe('DocsApiReference', () => {
  test('renders attributes as vertical tabs without type and default columns', async () => {
    const screen = render(() => (
      <DocsApiReference
        model={{
          sections: [
            {
              id: 'attributes',
              heading: 'Attributes',
              props: [],
              slots: [
                {
                  name: 'root',
                  cssVariables: [
                    {
                      name: '--command-palette-height',
                      required: false,
                      type: 'string',
                      description: 'Controls the rendered panel height.',
                    },
                  ],
                  dataAttributes: [
                    {
                      name: 'data-open',
                      required: false,
                      type: 'string | undefined',
                      description: 'Present when the panel is open.',
                    },
                  ],
                  ariaAttributes: [],
                },
                {
                  name: 'empty',
                  cssVariables: [],
                  dataAttributes: [],
                  ariaAttributes: [],
                },
              ],
            },
          ],
        }}
      />
    ))

    expect(screen.getByRole('tablist').getAttribute('aria-orientation')).toBe('vertical')
    expect(screen.getByText('Attributes')).toBeDefined()
    expect(screen.getByRole('tab', { name: 'root' })).toBeDefined()
    expect(screen.getByRole('tab', { name: 'empty' })).toBeDefined()
    expect(screen.getByText('CSS Variable')).toBeDefined()
    expect(screen.queryByText('Type')).toBeNull()
    expect(screen.queryByText('Default')).toBeNull()

    await fireEvent.click(screen.getByRole('tab', { name: 'empty' }))

    expect(screen.getByText('No attribute metadata for this slot.')).toBeDefined()
  })

  test('renders attributes header as select on mobile view', async () => {
    window.matchMedia = createMatchMediaMock(true) as unknown as typeof window.matchMedia

    const screen = render(() => (
      <DocsApiReference
        model={{
          sections: [
            {
              id: 'attributes',
              heading: 'Attributes',
              props: [],
              slots: [
                {
                  name: 'root',
                  cssVariables: [
                    {
                      name: '--command-palette-height',
                      required: false,
                      type: 'string',
                      description: 'Controls the rendered panel height.',
                    },
                  ],
                  dataAttributes: [],
                  ariaAttributes: [],
                },
                {
                  name: 'empty',
                  cssVariables: [],
                  dataAttributes: [],
                  ariaAttributes: [],
                },
              ],
            },
          ],
        }}
      />
    ))

    expect(screen.queryByRole('tablist')).toBeNull()

    const select = screen.getByRole('combobox')
    expect(select.textContent).toContain('root')
    expect(screen.getByText('CSS Variable')).toBeDefined()

    await fireEvent.click(select)
    await fireEvent.click(document.body.querySelectorAll('[data-slot="item"]')[1]!)

    expect(screen.getByText('No attribute metadata for this slot.')).toBeDefined()
  })
})
