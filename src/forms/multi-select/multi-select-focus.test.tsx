import { fireEvent, render as baseRender } from '@solidjs/testing-library'
import { expect, test } from 'vitest'

import { MoraineProvider } from '../../provider/index.ts'

import { MultiSelect } from './multi-select.tsx'
import type { MultiSelectT } from './multi-select.types.ts'

const render: typeof baseRender = (ui, options) =>
  baseRender(() => <MoraineProvider>{ui()}</MoraineProvider>, options)

const ITEMS: MultiSelectT.Item[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
]

test('secondary trigger restores the non-editable focus surface', () => {
  const screen = render(() => (
    <>
      <button type="button">Outside</button>
      <MultiSelect items={ITEMS} />
    </>
  ))
  const outside = screen.getByRole('button', { name: 'Outside' })
  const focus = screen.getByRole('combobox')
  const trigger = screen.getByRole('button', { name: 'Toggle options' })

  outside.focus()
  expect(document.activeElement).toBe(outside)

  fireEvent.pointerDown(trigger, { pointerType: 'mouse' })
  fireEvent.click(trigger)

  expect(document.activeElement).toBe(focus)
  expect(focus.getAttribute('aria-expanded')).toBe('true')

  fireEvent.keyDown(document.activeElement!, { key: 'b' })
  fireEvent.keyDown(document.activeElement!, { key: 'Enter' })
  expect(screen.container.querySelector('[data-slot="tagLabel"]')?.textContent).toBe('Banana')
})
