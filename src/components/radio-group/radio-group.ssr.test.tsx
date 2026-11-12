import { fireEvent } from '@solidjs/testing-library'
import { createComponent, createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test'

import { RadioGroup } from './radio-group'

const FIXTURE_PATH = '/src/components/radio-group/radio-group.ssr.fixture.tsx'

describe('RadioGroup SSR Hydration', () => {
  test('hydrates item identity, descriptions, checked state, and the first keyboard action', () => {
    const [value, setValue] = createSignal('pro')

    const { container } = hydrateFixture(FIXTURE_PATH, 'renderRadioGroupFixture', () =>
      createComponent(RadioGroup, {
        id: 'plans',
        name: 'plan',
        get value() {
          return value()
        },
        items: [
          { value: 'basic', label: 'Basic', description: 'Basic description' },
          { value: 'pro', label: 'Pro', description: 'Pro description' },
          { value: 'enterprise', label: 'Enterprise', description: 'Enterprise description' },
        ],
        orientation: 'vertical',
        variant: 'list',
        indicator: 'start',
        onValueChange: setValue,
      }),
    )

    const root = container.querySelector('#plans')!
    const items = Array.from(container.querySelectorAll('[data-slot="radio-group-item"]'))
    const inputs = Array.from(
      container.querySelectorAll<HTMLInputElement>('[data-slot="radio-group-input"]'),
    )

    expect(root).not.toBeNull()
    expect(items.length).toBe(3)
    expect(inputs.map((input) => input.checked)).toEqual([false, true, false])
    expect(inputs.map((input) => input.getAttribute('tabindex'))).toEqual(['-1', '0', '-1'])

    inputs[1]?.focus()
    fireEvent.keyDown(inputs[1]!, { key: 'ArrowDown' })
    expect(inputs.map((input) => input.checked)).toEqual([false, false, true])
    expect(document.activeElement).toBe(inputs[2])
  })

  test('hydrates items that have a label or description on only some entries without mismatch', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    try {
      const [value, setValue] = createSignal('pro')
      const { container } = hydrateFixture(FIXTURE_PATH, 'renderSparseRadioGroupFixture', () =>
        createComponent(RadioGroup, {
          id: 'plans',
          name: 'plan',
          get value() {
            return value()
          },
          items: [
            {
              value: 'basic',
              get description() {
                return 'Basic description'
              },
            },
            {
              value: 'pro',
              get label() {
                return 'Pro'
              },
            },
            { value: 'enterprise' },
          ],
          onValueChange: setValue,
        }),
      )

      const inputs = Array.from(
        container.querySelectorAll<HTMLInputElement>('[data-slot="radio-group-input"]'),
      )
      const labels = Array.from(container.querySelectorAll('[data-slot="radio-group-label"]'))
      const descriptions = Array.from(
        container.querySelectorAll('[data-slot="radio-group-description"]'),
      )

      expect(inputs.map((input) => input.checked)).toEqual([false, true, false])
      expect(labels.map((label) => label.textContent)).toEqual(['Pro'])
      expect(descriptions.map((description) => description.textContent)).toEqual([
        'Basic description',
      ])

      inputs[1]?.focus()
      fireEvent.keyDown(inputs[1]!, { key: 'ArrowDown' })
      expect(inputs.map((input) => input.checked)).toEqual([false, false, true])

      expect(consoleError).not.toHaveBeenCalled()
      expect(consoleWarn).not.toHaveBeenCalled()
    } finally {
      consoleError.mockRestore()
      consoleWarn.mockRestore()
    }
  })
})
