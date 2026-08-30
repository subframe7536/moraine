import { fireEvent } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test.ts'

import { Tooltip } from './tooltip.tsx'

describe('Tooltip SSR Hydration', () => {
  test('hydrates closed JSX and opens it from keyboard focus', async () => {
    vi.useFakeTimers()
    try {
      const { container } = hydrateFixture(
        '/src/overlays/tooltip/tooltip.ssr.fixture.tsx',
        'renderTooltipFixture',
        () => (
          <Tooltip openDelay={50} text={<span>Hydrated tooltip</span>} kbds={['Ctrl', 'K']}>
            {(props) => (
              <button {...props} type="button">
                Trigger
              </button>
            )}
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
