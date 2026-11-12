import { createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { MoraineProvider } from '../../provider'
import { hydrateFixture } from '../../test-util/ssr-test'

import { Separator } from './separator'

describe('Separator SSR Hydration', () => {
  test('hydrates the single separator root without reordering nodes', () => {
    const [orientation, setOrientation] = createSignal<'horizontal' | 'vertical'>('horizontal')

    const { container } = hydrateFixture(
      '/src/components/separator/separator.ssr.fixture.tsx',
      'renderSeparatorFixture',
      () => (
        <MoraineProvider>
          <Separator orientation={orientation()} />
        </MoraineProvider>
      ),
    )

    const root = container.querySelector('[data-slot="separator"]')!
    expect(root).not.toBeNull()
    expect(root.children).toHaveLength(0)
    expect(root.getAttribute('data-orientation')).toBe('horizontal')
    expect(root.getAttribute('aria-orientation')).toBe('horizontal')

    setOrientation('vertical')
    expect(root.getAttribute('data-orientation')).toBe('vertical')
    expect(root.getAttribute('aria-orientation')).toBe('vertical')
    expect(container.querySelector('[data-slot="separator"]')).toBe(root)
  })
})
