import { render } from '@solidjs/testing-library'
import type { Component, JSX } from 'solid-js'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { createDocsMdxComponents } from './mdx-components'

vi.mock('./intro-components', () => ({
  IntroComponents: () => null,
}))

vi.mock('./docs-code-block', () => ({
  DocsCodeBlock: (props: { html: string; variant?: string }) => (
    <div data-code-variant={props.variant}>{props.html}</div>
  ),
}))

interface TestProps {
  children?: JSX.Element
  package?: string
  path?: string
}

class ResizeObserverMock {
  observe = vi.fn()
  disconnect = vi.fn()
}

const renderMdxComponent = (
  name: string,
  props: TestProps = {},
  examples: Parameters<typeof createDocsMdxComponents>[0]['examples'] = {},
  codeTabs: Parameters<typeof createDocsMdxComponents>[0]['codeTabs'] = {},
) => {
  const components = createDocsMdxComponents({
    pageKey: 'test',
    frontmatter: {
      title: 'Test',
      description: 'Test page.',
      sidebar: { order: 10 },
      search: { tags: ['test'] },
    },
    Content: () => null,
    examples,
    codeTabs,
  })
  const Comp = components[name as keyof typeof components] as Component<TestProps>

  return render(() => <Comp {...props} />)
}

describe('createDocsMdxComponents', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test.each(['h1', 'p', 'strong', 'div', 'table'])(
    'renders mdx intrinsic component %s as an element',
    (tag) => {
      const screen = renderMdxComponent(tag, { children: 'Content' })

      expect(screen.container.querySelector(tag)?.textContent).toBe('Content')
    },
  )

  test('renders a compiled example descriptor', () => {
    const screen = renderMdxComponent(
      'Example',
      { path: './basic' },
      {
        './basic': {
          component: () => <div>Example preview</div>,
          source: '<pre><code>Example source</code></pre>',
        },
      },
    )

    expect(screen.getByText('Example preview')).toBeDefined()
    expect(screen.getByText('<pre><code>Example source</code></pre>')).toBeDefined()
  })

  test('throws when a compiled example descriptor is missing', () => {
    expect(() => renderMdxComponent('Example', { path: './missing' })).toThrow(
      'compiled example not found for path: ./missing',
    )
  })

  test('renders install commands as one compact tabbed surface', () => {
    const screen = renderMdxComponent(
      'CodeTabs',
      { package: 'moraine' },
      {},
      {
        moraine: [
          { label: 'bun', value: 'bun', html: '<pre>bun add moraine</pre>' },
          { label: 'pnpm', value: 'pnpm', html: '<pre>pnpm add moraine</pre>' },
        ],
      },
    )

    expect(screen.getByRole('tablist').className).toContain('border-b')
    expect(screen.getByRole('tab', { name: 'bun' }).className).toContain('text-sm')
    expect(screen.getByRole('tab', { name: 'bun' }).className).toContain('py-1')
    expect(
      screen.getByRole('tabpanel').querySelector('[data-code-variant="install"]'),
    ).not.toBeNull()
    expect(screen.container.querySelector('[data-slot="indicator"]')?.className).toContain('hidden')
  })
})
