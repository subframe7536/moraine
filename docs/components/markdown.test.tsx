import { render } from '@solidjs/testing-library'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { Markdown } from './markdown'

vi.mock('../widgets', () => ({
  docsWidgetMap: {
    'docs-header': (props: Record<string, unknown>) => (
      <div data-testid="docs-header">
        <span>{String(props.componentKey ?? '')}</span>
        <span>
          {String(
            (props.apiDoc as { component?: { name?: string } } | undefined)?.component?.name ?? '',
          )}
        </span>
        <span>{String(props.kobalteHref ?? '')}</span>
      </div>
    ),
    'docs-api-reference': () => <div data-testid="docs-api-reference">API Widget</div>,
  },
}))

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = []

  callback: IntersectionObserverCallback
  observed: Element[] = []

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    MockIntersectionObserver.instances.push(this)
  }

  observe(target: Element) {
    this.observed.push(target)
  }

  disconnect() {}

  unobserve() {}

  takeRecords(): IntersectionObserverEntry[] {
    return []
  }

  trigger(targetId: string) {
    const target = this.observed.find((item) => item.id === targetId)
    if (!target) {
      return
    }

    this.callback(
      [
        {
          target,
          isIntersecting: true,
          boundingClientRect: target.getBoundingClientRect(),
          intersectionRatio: 1,
          intersectionRect: target.getBoundingClientRect(),
          rootBounds: null,
          time: Date.now(),
        } as IntersectionObserverEntry,
      ],
      this as unknown as IntersectionObserver,
    )
  }
}

const originalIntersectionObserver = globalThis.IntersectionObserver

afterEach(() => {
  MockIntersectionObserver.instances.length = 0
  if (originalIntersectionObserver) {
    globalThis.IntersectionObserver = originalIntersectionObserver
  } else {
    delete (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver
  }
  history.replaceState(null, '', '/')
})

describe('Markdown On This Page', () => {
  test('renders docs widgets and injects runtime context props', () => {
    const screen = render(() =>
      Markdown({
        componentKey: 'button',
        kobalteHref: 'https://kobalte.dev/docs/core/components/button',
        apiDoc: {
          component: {
            key: 'button',
            name: 'Button',
            category: 'Elements',
            polymorphic: false,
          },
          slots: [],
          props: {
            own: [],
            inherited: [],
          },
        },
        segments: [
          { type: 'widget', widgetName: 'docs-header' },
          { type: 'widget', widgetName: 'docs-api-reference' },
        ],
      }),
    )

    const header = screen.getByTestId('docs-header')
    expect(header.textContent).toContain('button')
    expect(header.textContent).toContain('Button')
    expect(header.textContent).toContain('https://kobalte.dev/docs/core/components/button')
    expect(screen.getByTestId('docs-api-reference').textContent).toBe('API Widget')
  })

  test('does not auto render header or api without widget segments', () => {
    const screen = render(() =>
      Markdown({
        componentKey: 'checkbox',
        apiDoc: {
          component: {
            key: 'checkbox',
            name: 'Checkbox',
            category: 'Form',
            polymorphic: false,
          },
          slots: ['root'],
          props: {
            own: [{ name: 'checked', required: false, type: 'boolean' }],
            inherited: [],
          },
        },
        segments: [{ type: 'markdown', html: '<p>Body</p>' }],
      }),
    )

    expect(screen.queryByTestId('docs-header')).toBeNull()
    expect(screen.container.querySelector('#api-reference')).toBeNull()
  })

  test('shows fallback when widget is missing', () => {
    const screen = render(() =>
      Markdown({
        segments: [{ type: 'widget', widgetName: 'missing-widget' }],
      }),
    )

    expect(screen.getByText('Widget not found: missing-widget')).toBeTruthy()
  })

  test('renders toc from compile-time entries', () => {
    const screen = render(() =>
      Markdown({
        onThisPageEntries: [
          { id: 'intro', label: 'Intro', level: 1 },
          { id: 'usage', label: 'Usage', level: 2 },
        ],
        segments: [{ type: 'markdown', html: '<p>Body</p>' }],
      }),
    )

    expect(screen.getByText('On This Page')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Intro' }).getAttribute('href')).toBe('#intro')
    expect(screen.getByRole('link', { name: 'Usage' }).getAttribute('href')).toBe('#usage')
  })

  test('does not collect runtime headings or inherited text into toc', () => {
    const screen = render(() =>
      Markdown({
        onThisPageEntries: [{ id: 'intro', label: 'Intro', level: 1 }],
        segments: [
          {
            type: 'markdown',
            html: '<h2 id="runtime-heading">Runtime Heading</h2><p>Inherited from Base</p>',
          },
        ],
      }),
    )

    expect(screen.queryByRole('link', { name: 'Runtime Heading' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Inherited from Base' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Intro' })).toBeTruthy()
  })

  test('updates active toc item for scrollspy and hash', () => {
    globalThis.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver

    const screen = render(() =>
      Markdown({
        onThisPageEntries: [
          { id: 'intro', label: 'Intro', level: 1 },
          { id: 'usage', label: 'Usage', level: 2 },
        ],
        segments: [
          {
            type: 'markdown',
            html: '<h1 id="intro">Intro</h1><h2 id="usage">Usage</h2>',
          },
        ],
      }),
    )

    const observer = MockIntersectionObserver.instances[0]
    observer?.trigger('usage')

    expect(screen.getByRole('link', { name: 'Usage' }).getAttribute('aria-current')).toBe(
      'location',
    )

    history.replaceState(null, '', '/#intro')
    window.dispatchEvent(new Event('hashchange'))

    expect(screen.getByRole('link', { name: 'Intro' }).getAttribute('aria-current')).toBe(
      'location',
    )
  })

  test('shows sticky toc container and empty fallback', () => {
    const screen = render(() =>
      Markdown({
        onThisPageEntries: [],
        segments: [{ type: 'markdown', html: '<p>No headings here.</p>' }],
      }),
    )

    expect(screen.getByText('No sections')).toBeTruthy()
    const tocTitle = screen.getByText('On This Page')
    const aside = tocTitle.closest('aside')
    expect(aside?.className).toContain('sticky')
    expect(aside?.className).toContain('overflow-y-auto')
  })
})
