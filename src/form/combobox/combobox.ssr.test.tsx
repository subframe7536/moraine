import { fireEvent } from '@solidjs/testing-library'
import { createComponent } from 'solid-js'
import { expect, test } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test.ts'

import { Combobox } from './combobox.tsx'

test('hydrates Combobox with one input focus owner', () => {
  const { container } = hydrateFixture(
    '/src/form/combobox/combobox.ssr.fixture.tsx',
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
  const trigger = container.querySelector<HTMLButtonElement>('[data-slot="combobox-trigger"]')!
  expect(input.value).toBe('Banana')
  expect(input.getAttribute('aria-autocomplete')).toBe('list')
  expect(input.getAttribute('autocomplete')).toBe('off')
  expect(trigger.tabIndex).toBe(-1)
  expect(container.querySelectorAll('input[data-slot="combobox-input"]')).toHaveLength(1)
  fireEvent.click(trigger)
  expect(input.getAttribute('aria-expanded')).toBe('true')
})

test('hydrates a read-only Combobox without list autocomplete', () => {
  const { container } = hydrateFixture(
    '/src/form/combobox/combobox.ssr.fixture.tsx',
    'renderReadOnlyComboboxFixture',
    () =>
      createComponent(Combobox, {
        id: 'read-only-fruit',
        name: 'read-only-fruit',
        value: 'banana',
        readOnly: true,
        items: [
          { value: 'apple', label: 'Apple' },
          { value: 'banana', label: 'Banana' },
        ],
      }),
  )
  const input = container.querySelector<HTMLInputElement>('[role="combobox"]')!
  const trigger = container.querySelector<HTMLButtonElement>('[data-slot="combobox-trigger"]')!
  expect(input.readOnly).toBe(true)
  expect(input.getAttribute('aria-readonly')).toBe('true')
  expect(input.getAttribute('aria-autocomplete')).toBe('none')
  expect(trigger.getAttribute('aria-controls')).toBe(input.getAttribute('aria-controls'))
  fireEvent.click(trigger)
  expect(input.getAttribute('aria-expanded')).toBe('true')
  expect(document.body.querySelector('[role="listbox"]')?.getAttribute('aria-readonly')).toBe(
    'true',
  )
})

test('hydrates string and grouped shorthand without replacing server elements', () => {
  const { container } = hydrateFixture(
    '/src/form/combobox/combobox.ssr.fixture.tsx',
    'renderStringItemsFixture',
    () => (
      <Combobox
        id="string-fruit"
        name="string-fruit"
        items={['Apple', { type: 'group', label: 'More', items: ['Banana'] }]}
        defaultValue="Banana"
      />
    ),
  )
  expect(container.querySelector<HTMLInputElement>('input[name="string-fruit"]')?.value).toBe(
    'Banana',
  )
  const control = container.querySelector<HTMLElement>('[role="combobox"]')!
  fireEvent.keyDown(control, { key: 'ArrowDown' })
  expect(control.getAttribute('aria-expanded')).toBe('true')
})
