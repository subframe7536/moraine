import { fireEvent } from '@solidjs/testing-library'
import { expect, test, vi } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test.ts'

import { StepperHydrationFixture } from './stepper.ssr.fixture.tsx'

test.each([false, true])(
  'hydrates step relationships and lazily selects another panel (vertical=%s)',
  (vertical) => {
    const read = vi.fn()
    const { container } = hydrateFixture(
      '/src/navigation/stepper/stepper.ssr.fixture.tsx',
      vertical ? 'renderVerticalStepperFixture' : 'renderStepperFixture',
      () => <StepperHydrationFixture vertical={vertical} onContentRead={read} />,
    )
    const triggers = container.querySelectorAll<HTMLElement>('[role="tab"]')
    const panel = container.querySelector('[role="tabpanel"]')!
    expect(panel.getAttribute('aria-labelledby')).toBe(triggers[0]!.id)
    expect(triggers[0]!.getAttribute('aria-controls')).toBe(panel.id)
    expect(panel.textContent).toBe('First panel')
    expect(read).not.toHaveBeenCalled()
    triggers[0]!.focus()
    fireEvent.keyDown(triggers[0]!, { key: vertical ? 'ArrowDown' : 'ArrowRight' })
    expect(document.activeElement).toBe(triggers[1])
    expect(container.querySelector('[role="tabpanel"]')?.textContent).toBe('Second panel')
    expect(read).toHaveBeenCalledTimes(1)
    expect(Array.from(container.querySelectorAll('[role="tab"]'))).toEqual(Array.from(triggers))
  },
)
