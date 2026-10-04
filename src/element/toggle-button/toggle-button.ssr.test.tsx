import { fireEvent } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test'

import { ToggleButton } from './toggle-button'

describe('ToggleButton SSR hydration', () => {
  test('preserves roots, icons, JSX children and reactive render functions while toggling', () => {
    const [text, setText] = createSignal('Server content')
    const [loading, setLoading] = createSignal(false)
    const { container } = hydrateFixture(
      '/src/element/toggle-button/toggle-button.ssr.fixture.tsx',
      'renderToggleButtonFixture',
      () => (
        <>
          <ToggleButton defaultPressed leading="icon-check">
            <span>{text()}</span>
          </ToggleButton>
          <ToggleButton aria-label="Bookmark" leading="icon-check" loading={loading()}>
            {(state) => (
              <span>
                {state.pressed ? 'Saved' : 'Unsaved'} / {state.loading ? 'Pending' : 'Ready'}
              </span>
            )}
          </ToggleButton>
        </>
      ),
    )
    const buttons = container.querySelectorAll<HTMLButtonElement>('button')
    const plain = buttons[0]!
    const renderProp = buttons[1]!
    const plainChild = plain.querySelector('span[data-slot="button-label"] > span')!
    const stateChild = renderProp.querySelector('span[data-slot="button-label"] > span')!
    expect(plain.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(plain)
    setText('Updated content')
    expect(plain.getAttribute('aria-pressed')).toBe('false')
    expect(plainChild.textContent).toBe('Updated content')
    expect(plain.contains(plainChild)).toBe(true)
    fireEvent.click(renderProp)
    expect(stateChild.textContent).toBe('Saved / Ready')
    setLoading(true)
    expect(stateChild.textContent).toBe('Saved / Pending')
    expect(renderProp.contains(stateChild)).toBe(true)
    expect(container.querySelectorAll('[data-slot="toggle-button"]')).toHaveLength(2)
  })
})
