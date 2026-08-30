import { describe, expect, test } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test.ts'

import { Badge } from './badge.tsx'

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

    const root = container.querySelector('[data-slot="root"]')
    expect(root).not.toBeNull()
    expect(root?.getAttribute('data-hk')).toBe('00')
    expect(
      Array.from(root?.children ?? []).map((element) => element.getAttribute('data-slot')),
    ).toEqual(['leading', 'label', 'trailing'])
    expect(container.querySelector('[data-slot="trailing"]')?.tagName).toBe('DIV')
  })
})
