import { fireEvent } from '@solidjs/testing-library'
import { createComponent } from 'solid-js'
import { expect, test } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test.ts'

import { Select } from './select.tsx'

test('hydrates Select Control/Trigger/Value anatomy in place', () => {
  const { container } = hydrateFixture(
    '/src/forms/select/select.ssr.fixture.tsx',
    'renderSelectFixture',
    () =>
      createComponent(Select, {
        id: 'fruit',
        name: 'fruit',
        value: 'banana',
        allowClear: true,
        items: [
          { value: 'apple', label: 'Apple', description: 'Crisp' },
          { value: 'banana', label: 'Banana', description: 'Sweet' },
        ],
        leadingIcon: 'icon-search',
        trailingIcon: 'icon-chevron-down',
        closeIcon: 'icon-close',
      }),
  )
  const control = container.querySelector('[data-slot="control"]')!
  const trigger = container.querySelector<HTMLElement>('[data-slot="trigger"]')!
  expect(control.tagName).toBe('DIV')
  expect(trigger.tagName).toBe('BUTTON')
  expect(control.querySelector('[data-slot="value"]')?.textContent).toBe('Banana')
  expect(container.querySelectorAll('input[data-slot="input"]')).toHaveLength(0)
  expect(container.querySelector<HTMLInputElement>('input[name="fruit"]')?.value).toBe('banana')
  fireEvent.keyDown(trigger, { key: 'ArrowDown' })
  expect(trigger.getAttribute('aria-expanded')).toBe('true')
})
