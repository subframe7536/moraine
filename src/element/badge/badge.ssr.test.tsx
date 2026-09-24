import { fireEvent } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test'

import { Badge } from './badge'

describe('Badge SSR Hydration', () => {
  test('hydrates stable slot order', () => {
    const { container } = hydrateFixture(
      '/src/element/badge/badge.ssr.fixture.tsx',
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

  test('hydrates a button root and preserves its activation', () => {
    const onClick = vi.fn()
    const { container } = hydrateFixture(
      '/src/element/badge/badge.ssr.fixture.tsx',
      'renderButtonBadgeFixture',
      () => (
        <Badge as="button" type="button" aria-pressed={false} onClick={onClick}>
          Slot
        </Badge>
      ),
    )

    const button = container.querySelector<HTMLButtonElement>('[data-slot="badge"]')!
    expect(button.tagName).toBe('BUTTON')
    expect(button.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
