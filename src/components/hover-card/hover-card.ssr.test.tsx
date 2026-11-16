import { fireEvent } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test'

import { HoverCard } from './hover-card'

describe('HoverCard SSR Hydration', () => {
  test('hydrates closed markup and opens it from hover', async () => {
    vi.useFakeTimers()
    try {
      const { container } = hydrateFixture(
        '/src/components/hover-card/hover-card.ssr.fixture.tsx',
        'renderHoverCardFixture',
        () => (
          <HoverCard openDelay={50}>
            <HoverCard.Trigger href="/u/solid">@solidjs</HoverCard.Trigger>
            <HoverCard.Content>
              <span>Hydrated card</span>
            </HoverCard.Content>
          </HoverCard>
        ),
      )

      const trigger = container.querySelector<HTMLAnchorElement>(
        '[data-slot="hover-card-trigger"]',
      )!

      expect(trigger).not.toBeNull()
      expect(document.body.querySelector('[data-slot="hover-card-content"]')).toBeNull()

      fireEvent.pointerEnter(trigger, { pointerType: 'mouse' })
      await vi.advanceTimersByTimeAsync(50)
      expect(
        document.body.querySelector('[data-slot="hover-card-content"]')?.textContent,
      ).toContain('Hydrated card')
    } finally {
      vi.useRealTimers()
    }
  })

  test('hydrates force-mounted content', () => {
    const { container } = hydrateFixture(
      '/src/components/hover-card/hover-card.ssr.fixture.tsx',
      'renderHoverCardForceMountFixture',
      () => (
        <HoverCard forceMount openDelay={50}>
          <HoverCard.Trigger href="/u/solid">@solidjs</HoverCard.Trigger>
          <HoverCard.Content>
            <span>Mounted card</span>
          </HoverCard.Content>
        </HoverCard>
      ),
    )

    expect(
      container.querySelector<HTMLAnchorElement>('[data-slot="hover-card-trigger"]'),
    ).not.toBeNull()
    expect(document.body.querySelector('[data-slot="hover-card-content"]')?.textContent).toContain(
      'Mounted card',
    )
  })
})
