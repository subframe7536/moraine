import { fireEvent } from '@solidjs/testing-library'
import { createSignal, Show } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test'

import { Button } from './button'

describe('Button SSR Hydration', () => {
  test('hydrates render children and preserves activation across loading updates', () => {
    const [loading, setLoading] = createSignal(false)
    const onClick = vi.fn()

    const { container } = hydrateFixture(
      '/src/elements/button/button.ssr.fixture.tsx',
      'renderButtonFixture',
      () => (
        <Button
          loading={loading()}
          leading="i-lucide-save"
          trailing="i-lucide-arrow-right"
          onClick={onClick}
        >
          {(state) => (
            <Show when={state.loading} fallback="Save">
              Saving
            </Show>
          )}
        </Button>
      ),
    )

    const button = container.querySelector('[data-slot="root"]')!
    expect(button).not.toBeNull()
    expect(button.textContent).toBe('Save')

    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)

    setLoading(true)
    expect(button.textContent).toBe('Saving')
    const pointerDown = new PointerEvent('pointerdown', { bubbles: true, cancelable: true })
    button.dispatchEvent(pointerDown)
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)

    setLoading(false)
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(2)
  })
})
