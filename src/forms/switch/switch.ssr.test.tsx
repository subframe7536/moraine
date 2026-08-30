import { createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test.ts'

import { Switch } from './switch.tsx'

function expectSwitchChecked(element: Element, checked: boolean): void {
  expect(element.getAttribute('aria-checked')).toBe(String(checked))
}

describe('Switch SSR Hydration', () => {
  test('hydrates checked conditional content without replacing server nodes', () => {
    const [checked, setChecked] = createSignal(true)

    const { container } = hydrateFixture(
      '/src/forms/switch/switch.ssr.fixture.tsx',
      'renderSwitchFixture',
      () => (
        <Switch
          id="ssr-switch"
          checked={checked()}
          label={0}
          description="Server description"
          checkedIcon={<span data-testid="checked-icon">Checked</span>}
        />
      ),
    )

    const serverRoot = container.querySelector('[data-slot="root"]') as HTMLElement
    const serverTrack = container.querySelector('[data-slot="track"]') as HTMLElement
    const serverInput = container.querySelector('[data-slot="input"]') as HTMLInputElement

    expect(serverRoot).not.toBeNull()
    expect(serverTrack).not.toBeNull()
    expect(serverInput).not.toBeNull()
    expectSwitchChecked(serverTrack, true)
    expect(container.querySelector('[data-testid="checked-icon"]')).not.toBeNull()

    setChecked(false)
    expectSwitchChecked(serverTrack, false)
    expect(container.querySelector('[data-testid="checked-icon"]')).toBeNull()
  })
})
