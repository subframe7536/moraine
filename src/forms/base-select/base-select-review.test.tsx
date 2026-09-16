import { fireEvent, render, within } from '@solidjs/testing-library'
import { expect, test, vi } from 'vitest'

import { BaseSelect } from './base-select.tsx'

test('uses the canonical item disabled state for equivalent rendered items', () => {
  const onChange = vi.fn()
  render(() => (
    <BaseSelect
      items={[{ value: 'locked', label: 'Canonical', disabled: true }]}
      defaultOpen
      onChange={onChange}
    >
      <BaseSelect.Trigger>Choose</BaseSelect.Trigger>
      <BaseSelect.Content>
        <BaseSelect.Listbox>
          <BaseSelect.Item item={{ value: 'locked', label: 'Rendered copy' }} />
        </BaseSelect.Listbox>
      </BaseSelect.Content>
    </BaseSelect>
  ))

  const option = within(document.body).getByRole('option', { hidden: true })
  expect(option.getAttribute('aria-disabled')).toBe('true')
  fireEvent.click(option)
  expect(onChange).not.toHaveBeenCalled()
})

test('does not serialize an empty single selection as a named value', () => {
  const screen = render(() => (
    <form>
      <BaseSelect name="choice" items={[{ value: 'apple', label: 'Apple' }]}>
        <BaseSelect.Trigger>Choose</BaseSelect.Trigger>
      </BaseSelect>
    </form>
  ))

  expect(new FormData(screen.container.querySelector('form')!).getAll('choice')).toEqual([])
})
