import { render } from '@solidjs/testing-library'
import type { Component, JSX } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { createDocsMdxComponents } from './mdx-components'

vi.mock('./intro-components', () => ({
  IntroComponents: () => null,
}))

vi.mock('./shiki-code-block', () => ({
  ShikiCodeBlock: (props: { html?: string }) => <div>{props.html}</div>,
}))

interface TestProps {
  children?: JSX.Element
  path?: string
}

const renderMdxComponent = (
  name: string,
  props: TestProps = {},
  examples: Parameters<typeof createDocsMdxComponents>[0]['examples'] = {},
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
    codeTabs: {},
  })
  const Comp = components[name as keyof typeof components] as Component<TestProps>

  return render(() => <Comp {...props} />)
}

describe('createDocsMdxComponents', () => {
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
})
