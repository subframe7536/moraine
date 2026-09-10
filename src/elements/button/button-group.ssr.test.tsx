import { fireEvent, waitFor } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { expect, test } from 'vitest'

import { finishMenuExitMotion } from '../../test-utils/overlay-test.ts'
import { hydrateFixture, renderSsrFixture } from '../../test-utils/ssr-test.ts'

import { ButtonGroupHydrationFixture } from './button-group.ssr.fixture.tsx'

test.each([false, true])(
  'hydrates grouped controls and preserves separators through portal and child changes (vertical=%s)',
  async (vertical) => {
    const [separator, setSeparator] = createSignal(true)
    const [extra, setExtra] = createSignal(false)
    const fixture = vertical ? 'renderVerticalButtonGroupFixture' : 'renderButtonGroupFixture'
    const markup = renderSsrFixture('/src/elements/button/button-group.ssr.fixture.tsx', fixture)
    expect(markup.match(/<button\b/g)).toHaveLength(2)

    const { container } = hydrateFixture(
      '/src/elements/button/button-group.ssr.fixture.tsx',
      fixture,
      () => (
        <ButtonGroupHydrationFixture vertical={vertical} separator={separator()} extra={extra()} />
      ),
    )
    const group = container.querySelector('[role="group"]')!
    const buttons = Array.from(group.querySelectorAll('button'))
    expect(group.querySelectorAll('[data-slot="separator"]')).toHaveLength(1)
    expect(group.querySelector('[data-slot="separator"]')?.getAttribute('aria-hidden')).toBe('true')

    buttons[1]!.focus()
    fireEvent.keyDown(buttons[1]!, { key: 'ArrowDown' })
    await waitFor(() => expect(document.body.querySelector('[role="menu"]')).not.toBeNull())
    expect(group.querySelectorAll('[data-slot="separator"]')).toHaveLength(1)
    expect(group.lastElementChild).toBe(buttons[1])
    fireEvent.keyDown(document.body.querySelector('[role="menu"]')!, { key: 'Escape' })
    await finishMenuExitMotion()
    await waitFor(() => expect(document.activeElement).toBe(buttons[1]))

    setExtra(true)
    expect(group.querySelectorAll('[data-slot="separator"]')).toHaveLength(2)
    setSeparator(false)
    expect(group.querySelectorAll('[data-slot="separator"]')).toHaveLength(0)
    setSeparator(true)
    setExtra(false)
    expect(group.querySelectorAll('[data-slot="separator"]')).toHaveLength(1)
    expect(Array.from(group.querySelectorAll('button'))).toEqual(buttons)
  },
)
