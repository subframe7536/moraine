import { fireEvent } from '@solidjs/testing-library'
import { createComponent, createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test'

import { RadioGroup } from './radio-group'

describe('RadioGroup SSR Hydration', () => {
  test('hydrates item identity, descriptions, checked state, and the first keyboard action', () => {
    const [value, setValue] = createSignal('pro')
    const reads = { items: 0, orientation: 0, variant: 0, indicator: 0, label: 0, description: 0 }

    const { container } = hydrateFixture(
      '/src/forms/radio-group/radio-group.ssr.fixture.tsx',
      'renderRadioGroupFixture',
      () =>
        createComponent(RadioGroup, {
          id: 'plans',
          name: 'plan',
          get value() {
            return value()
          },
          get items() {
            reads.items += 1
            return [
              {
                value: 'basic',
                get label() {
                  reads.label += 1
                  return 'Basic'
                },
                get description() {
                  reads.description += 1
                  return 'Basic description'
                },
              },
              {
                value: 'pro',
                get label() {
                  reads.label += 1
                  return 'Pro'
                },
                get description() {
                  reads.description += 1
                  return 'Pro description'
                },
              },
              {
                value: 'enterprise',
                get label() {
                  reads.label += 1
                  return 'Enterprise'
                },
                get description() {
                  reads.description += 1
                  return 'Enterprise description'
                },
              },
            ]
          },
          get orientation() {
            reads.orientation += 1
            return 'vertical' as const
          },
          get variant() {
            reads.variant += 1
            return 'list' as const
          },
          get indicator() {
            reads.indicator += 1
            return 'start' as const
          },
          onChange: setValue,
        }),
    )

    const root = container.querySelector('#plans')!
    const items = Array.from(container.querySelectorAll('[data-slot="item"]'))
    const inputs = Array.from(container.querySelectorAll<HTMLInputElement>('[data-slot="input"]'))

    expect(root).not.toBeNull()
    expect(items.length).toBe(3)
    expect(inputs.map((input) => input.checked)).toEqual([false, true, false])
    expect(inputs.map((input) => input.getAttribute('tabindex'))).toEqual(['-1', '0', '-1'])
    expect(reads).toEqual({
      items: 1,
      orientation: 1,
      variant: 1,
      indicator: 1,
      label: 3,
      description: 3,
    })

    inputs[1]?.focus()
    fireEvent.keyDown(inputs[1]!, { key: 'ArrowDown' })
    expect(inputs.map((input) => input.checked)).toEqual([false, false, true])
    expect(document.activeElement).toBe(inputs[2])
  })
})
