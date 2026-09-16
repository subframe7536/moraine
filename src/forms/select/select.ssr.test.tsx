import { fireEvent } from '@solidjs/testing-library'
import { createComponent, createSignal } from 'solid-js'
import { expect, test } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test.ts'

import { Select } from './select.tsx'
import type { SelectT } from './select.types.ts'

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

test('hydrates and updates custom itemRender content without replacing the server item node', () => {
  const [appleLabel, setAppleLabel] = createSignal('Apple')
  const reads = { itemRender: 0, render: 0 }

  hydrateFixture('/src/forms/select/select.ssr.fixture.tsx', 'renderSelectItemRenderFixture', () =>
    createComponent(Select, {
      id: 'custom-render',
      defaultOpen: true,
      get items() {
        return [
          { value: 'apple', label: appleLabel() },
          { value: 'banana', label: 'Banana' },
        ]
      },
      get itemRender() {
        reads.itemRender += 1
        return (state: SelectT.ItemRenderProps) => {
          reads.render += 1
          return <span data-testid="custom-item">{state.item.label}</span>
        }
      },
    }),
  )

  const items = document.body.querySelectorAll<HTMLElement>('[data-testid="custom-item"]')
  expect(items).toHaveLength(2)
  const first = items[0]!
  expect(first.textContent).toBe('Apple')
  expect(reads.itemRender).toBe(1)
  expect(reads.render).toBe(2)

  setAppleLabel('Apricot')
  expect(first.textContent).toBe('Apricot')
  expect(document.body.querySelectorAll('[data-testid="custom-item"]')[0]).toBe(first)
})
