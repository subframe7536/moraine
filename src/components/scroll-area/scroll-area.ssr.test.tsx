import { createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test'

import { ScrollArea } from './scroll-area'

describe('ScrollArea SSR hydration', () => {
  test('retains server nodes and reactive children, and measures after hydration', async () => {
    const [shadow, setShadow] = createSignal(true)
    const [text, setText] = createSignal('Server content')
    const { container } = hydrateFixture(
      '/src/components/scroll-area/scroll-area.ssr.fixture.tsx',
      'renderScrollAreaFixture',
      () => (
        <ScrollArea shadow={shadow()} orientation="both" aria-label="Activity">
          <span>{text()}</span>
        </ScrollArea>
      ),
    )
    const root = container.querySelector<HTMLElement>('[data-slot="scroll-area"]')!
    const viewport = root.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]')!
    const scrollbars = root.querySelectorAll('[data-slot="scroll-area-scrollbar"]')
    const child = root.querySelector('span')!
    expect(scrollbars).toHaveLength(2)
    expect(root.querySelector('[data-slot="scroll-area-corner"]')).not.toBeNull()
    expect(viewport.tabIndex).toBe(0)
    expect(child.textContent).toBe('Server content')

    Object.defineProperty(viewport, 'clientHeight', { configurable: true, value: 100 })
    Object.defineProperty(viewport, 'scrollHeight', { configurable: true, value: 300 })
    await Promise.resolve()
    expect(root.hasAttribute('data-overflow-y-end')).toBe(true)
    expect(scrollbars[0]!.hasAttribute('data-visible')).toBe(true)

    setText('Updated content')
    setShadow(false)
    expect(root.querySelector('span')).toBe(child)
    expect(child.textContent).toBe('Updated content')
    expect(container.firstElementChild).toBe(root)
  })
})
