import { fireEvent } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test'

import { Popover } from './popover'

describe('Popover SSR Hydration', () => {
  test('hydrates closed hover markup and opens it from keyboard focus', async () => {
    vi.useFakeTimers()
    try {
      const { container } = hydrateFixture(
        '/src/overlays/popover/popover.ssr.fixture.tsx',
        'renderPopoverFixture',
        () => (
          <Popover
            mode="hover"
            openDelay={50}
            ariaLabel="Hydrated popover"
            content={<span>Hydrated content</span>}
          >
            {(props) => (
              <button {...props} type="button">
                Trigger
              </button>
            )}
          </Popover>
        ),
      )

      const trigger = container.querySelector<HTMLButtonElement>('[data-slot="trigger"]')!

      expect(trigger).not.toBeNull()
      expect(document.body.querySelector('[role="dialog"]')).toBeNull()

      fireEvent.focus(trigger)
      await vi.advanceTimersByTimeAsync(50)
      expect(document.body.querySelector('[role="dialog"]')?.textContent).toContain(
        'Hydrated content',
      )
    } finally {
      vi.useRealTimers()
    }
  })
})
