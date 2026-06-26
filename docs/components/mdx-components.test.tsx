import { render } from '@solidjs/testing-library'
import type { Component, JSX } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { createDocsMdxComponents } from './mdx-components'

vi.mock('./intro-components', () => ({
  IntroComponents: () => null,
}))

const renderMdxComponent = (name: string, props: { children?: JSX.Element } = {}) => {
  const components = createDocsMdxComponents({ Content: () => null, codeTabs: {} })
  const Comp = components[name as keyof typeof components] as Component<typeof props>

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
})
