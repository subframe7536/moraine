import { describe, expect, test } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test'

import { Badge } from './badge'

describe('Badge SSR Hydration', () => {
  test('hydrates stable slot order', () => {
    const { container } = hydrateFixture(
      '/src/elements/badge/badge.ssr.fixture.tsx',
      'renderBadgeFixture',
      () => (
        <Badge leading="i-lucide-check" trailing="i-lucide-x">
          Server label
        </Badge>
      ),
    )

    const root = container.querySelector('[data-slot="badge"]')
    expect(root).not.toBeNull()
    expect(
      Array.from(root?.children ?? []).map((element) => element.getAttribute('data-slot')),
    ).toEqual(['badge-leading', 'badge-label', 'badge-trailing'])
    expect(container.querySelector('[data-slot="badge-trailing"]')?.tagName).toBe('DIV')
  })
})
