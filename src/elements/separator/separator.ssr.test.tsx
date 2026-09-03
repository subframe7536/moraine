import { createComponent, createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test'

import { Separator } from './separator'

describe('Separator SSR Hydration', () => {
  test('hydrates the single separator root without reordering nodes', () => {
    const [orientation, setOrientation] = createSignal<'horizontal' | 'vertical'>('horizontal')
    const reads = { orientation: 0 }

    const { container } = hydrateFixture(
      '/src/elements/separator/separator.ssr.fixture.tsx',
      'renderSeparatorFixture',
      () =>
        createComponent(Separator, {
          get orientation() {
            reads.orientation += 1
            return orientation()
          },
        }),
    )

    const root = container.querySelector('[data-slot="root"]')!
    expect(root).not.toBeNull()
    expect(root.children).toHaveLength(0)
    expect(reads.orientation).toBe(1)

    setOrientation('vertical')
    expect(root.getAttribute('aria-orientation')).toBe('vertical')
    expect(root.className).toContain('border-s')
    expect(reads.orientation).toBe(2)
  })
})
