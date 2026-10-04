import { createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test'

import { ScrollArea } from './scroll-area'

describe('ScrollArea SSR hydration', () => {
  test('retains server nodes and reactive children while toggling shadows', () => {
    const [shadow, setShadow] = createSignal(true)
    const [text, setText] = createSignal('Server content')
    const { container } = hydrateFixture(
      '/src/element/scroll-area/scroll-area.ssr.fixture.tsx',
      'renderScrollAreaFixture',
      () => (
        <ScrollArea shadow={shadow()} aria-label="Activity">
          <span>{text()}</span>
        </ScrollArea>
      ),
    )
    const root = container.querySelector<HTMLElement>('[data-slot="scroll-area"]')!
    const child = root.querySelector('span')!
    expect(root.tabIndex).toBe(0)
    expect(child.textContent).toBe('Server content')
    setText('Updated content')
    setShadow(false)
    expect(root.querySelector('span')).toBe(child)
    expect(child.textContent).toBe('Updated content')
    expect(root.className).not.toContain('mask-image')
    expect(container.firstElementChild).toBe(root)
  })
})
