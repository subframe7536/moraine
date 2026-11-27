import { describe, expect, it } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test'

import { KbdGroup } from './kbd-group'

describe('kbdGroup SSR Hydration', () => {
  it('hydrates keycaps and separators without replacing nodes', () => {
    const { container } = hydrateFixture(
      '/src/components/kbd-group/kbd-group.ssr.fixture.tsx',
      'renderKbdGroupFixture',
      () => <KbdGroup items={['meta', 'shift', 'K']} separator="+" />,
    )

    expect(container.querySelector('[data-slot="kbd-group"]')).not.toBeNull()
    expect(container.querySelectorAll('[data-slot="kbd-group-item"]')).toHaveLength(3)
  })
})
