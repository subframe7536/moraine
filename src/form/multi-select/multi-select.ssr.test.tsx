import { fireEvent } from '@solidjs/testing-library'
import { createComponent } from 'solid-js'
import { expect, test, vi } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test.ts'

import { MultiSelect } from './multi-select.tsx'

test('hydrates MultiSelect with one input and stable secondary trigger', () => {
  const onChange = vi.fn()
  const { container } = hydrateFixture(
    '/src/form/multi-select/multi-select.ssr.fixture.tsx',
    'renderMultiSelectFixture',
    () =>
      createComponent(MultiSelect, {
        id: 'fruits',
        name: 'fruits',
        search: true,
        defaultValue: ['apple'],
        onChange,
        items: [
          { value: 'apple', label: 'Apple', description: 'Crisp' },
          { value: 'banana', label: 'Banana', description: 'Sweet' },
        ],
        leadingIcon: 'icon-search',
        trailingIcon: 'icon-chevron-down',
        closeIcon: 'icon-close',
      }),
  )
  const control = container.querySelector('[data-slot="multi-select-control"]')!
  const input = container.querySelector<HTMLInputElement>('[role="combobox"]')!
  const trigger = container.querySelector<HTMLButtonElement>('[data-slot="multi-select-trigger"]')!
  expect(control).toBeTruthy()
  expect(container.querySelectorAll('input[data-slot="multi-select-input"]')).toHaveLength(1)
  expect(input.getAttribute('autocomplete')).toBe('off')
  expect(trigger.tabIndex).toBe(-1)
  expect(container.querySelector<HTMLInputElement>('input[name="fruits"]')?.value).toBe('apple')
  fireEvent.click(container.querySelector('[aria-label="Remove Apple"]')!)
  expect(onChange).toHaveBeenCalledWith([])
  fireEvent.keyDown(input, { key: 'ArrowDown' })
  expect(input.getAttribute('aria-expanded')).toBe('true')
})
