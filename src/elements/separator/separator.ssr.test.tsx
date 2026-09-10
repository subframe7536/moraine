import { createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { MoraineProvider } from '../../shared/provider'
import { hydrateFixture } from '../../test-utils/ssr-test'
import { defaultTheme } from '../../theme/default-theme'

import { Separator } from './separator'

describe('Separator SSR Hydration', () => {
  test('hydrates the single separator root without reordering nodes', () => {
    const [orientation, setOrientation] = createSignal<'horizontal' | 'vertical'>('horizontal')

    const { container } = hydrateFixture(
      '/src/elements/separator/separator.ssr.fixture.tsx',
      'renderSeparatorFixture',
      () => (
        <MoraineProvider theme={defaultTheme}>
          <Separator orientation={orientation()} />
        </MoraineProvider>
      ),
    )

    const root = container.querySelector('[data-slot="root"]')!
    expect(root).not.toBeNull()
    expect(root.children).toHaveLength(0)
    expect(root.getAttribute('aria-orientation')).toBe('horizontal')
    expect(root.className).toContain('h-px')
    expect(root.className).toContain('w-full')

    setOrientation('vertical')
    expect(root.getAttribute('aria-orientation')).toBe('vertical')
    expect(root.className).toContain('bg-border')
    expect(root.className).toContain('w-px')
    expect(root.className).toContain('h-full')
    expect(container.querySelector('[data-slot="root"]')).toBe(root)
  })
})
