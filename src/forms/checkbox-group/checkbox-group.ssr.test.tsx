import { createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test'

import { CheckboxGroup } from './checkbox-group'

describe('CheckboxGroup SSR Hydration', () => {
  test('hydrates duplicate items with stable ids and DOM order before interaction', () => {
    const [value, setValue] = createSignal<string[]>(['same'])

    const { container } = hydrateFixture(
      '/src/forms/checkbox-group/checkbox-group.ssr.fixture.tsx',
      'renderCheckboxGroupFixture',
      () => (
        <CheckboxGroup
          legend="Server options"
          items={[
            { value: 'same', label: 'First' },
            { value: 'same', label: 'Second' },
          ]}
          value={value()}
        />
      ),
    )

    const root = container.querySelector('[data-slot="root"]')!
    const controls = Array.from(container.querySelectorAll<HTMLElement>('[data-slot="control"]'))

    expect(root).not.toBeNull()
    expect(new Set(controls.map((control) => control.id)).size).toBe(2)
    expect(controls.map((control) => control.getAttribute('aria-checked'))).toEqual([
      'true',
      'true',
    ])

    setValue([])
    expect(controls.map((control) => control.getAttribute('aria-checked'))).toEqual([
      'false',
      'false',
    ])
    expect(
      Array.from(container.querySelector('[data-slot="fieldset"]')!.children).map((child) =>
        child.getAttribute('data-slot'),
      ),
    ).toEqual(['legend', 'root', 'root'])
  })
})
