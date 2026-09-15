import { fireEvent } from '@solidjs/testing-library'
import { createComponent } from 'solid-js'
import { expect, test } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test.ts'

import { Combobox } from './combobox.tsx'

test('hydrates Combobox with one input focus owner', () => {
  const { container } = hydrateFixture(
    '/src/forms/select/combobox.ssr.fixture.tsx',
    'renderComboboxFixture',
    () =>
      createComponent(Combobox, {
        id: 'fruit',
        name: 'fruit',
        value: 'banana',
        items: [
          { value: 'apple', label: 'Apple' },
          { value: 'banana', label: 'Banana' },
        ],
        allowClear: true,
      }),
  )
  const input = container.querySelector<HTMLInputElement>('[role="combobox"]')!
  const trigger = container.querySelector<HTMLButtonElement>('[data-slot="trigger"]')!
  expect(input.value).toBe('Banana')
  expect(trigger.tabIndex).toBe(-1)
  expect(container.querySelectorAll('input[data-slot="input"]')).toHaveLength(1)
  fireEvent.click(trigger)
  expect(input.getAttribute('aria-expanded')).toBe('true')
})
