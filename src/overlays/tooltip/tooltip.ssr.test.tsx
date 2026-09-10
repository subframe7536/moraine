import { fireEvent } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test'

import { Tooltip } from './tooltip'

describe('Tooltip SSR Hydration', () => {
  test('hydrates closed JSX and opens it from keyboard focus', async () => {
    vi.useFakeTimers()
    try {
      const { container } = hydrateFixture(
        '/src/overlays/tooltip/tooltip.ssr.fixture.tsx',
        'renderTooltipFixture',
        () => (
          <Tooltip openDelay={50}>
            <Tooltip.Trigger as="button" type="button">
              Trigger
            </Tooltip.Trigger>
            <Tooltip.Content text={<span>Hydrated tooltip</span>} kbds={['Ctrl', 'K']} />
          </Tooltip>
        ),
      )

      const trigger = container.querySelector<HTMLButtonElement>('[data-slot="trigger"]')!

      expect(trigger).not.toBeNull()
      expect(document.body.querySelector('[role="tooltip"]')).toBeNull()

      fireEvent.focus(trigger)
      await vi.advanceTimersByTimeAsync(50)
      expect(document.body.querySelector('[role="tooltip"]')?.textContent).toContain(
        'Hydrated tooltip',
      )
      expect(document.body.querySelector('[role="tooltip"]')?.textContent).toContain('Ctrl')
    } finally {
      vi.useRealTimers()
    }
  })
})
