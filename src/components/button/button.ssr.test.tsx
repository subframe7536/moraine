import { fireEvent } from '@solidjs/testing-library'
import { Show, createSignal, flush } from 'solid-js'
import { describe, expect, vi, it } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test'

import { Button } from './button'
describe('button SSR Hydration', () => {
  it('hydrates render children and preserves activation across loading updates', () => {
    const [loading, setLoading] = createSignal(false)
    const onClick = vi.fn<(...args: Array<any>) => void>()

    const { container } = hydrateFixture(
      '/src/components/button/button.ssr.fixture.tsx',
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

    const button = container.querySelector('[data-slot="button"]')!
    expect(button).not.toBeNull()
    expect(button.textContent).toBe('Save')

    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)

    flush(() => setLoading(true))
    expect(button.textContent).toBe('Saving')
    const pointerDown = new PointerEvent('pointerdown', { bubbles: true, cancelable: true })
    button.dispatchEvent(pointerDown)
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)

    flush(() => setLoading(false))
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(2)
  })
})
