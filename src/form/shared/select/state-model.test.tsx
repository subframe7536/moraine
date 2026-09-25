import { fireEvent, render, within } from '@solidjs/testing-library'
import { For } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { BaseSelect, useSelectState } from '../../base-select/base-select.tsx'
import { Combobox } from '../../combobox/combobox.tsx'
import { MultiSelect } from '../../multi-select/multi-select.tsx'

const items = [
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
]

describe('Select family state ownership', () => {
  test('BaseSelect normalizes single selection and Control stays non-interactive', () => {
    const onValueChange = vi.fn()
    function Parts() {
      const state = useSelectState()
      return (
        <>
          <BaseSelect.Control data-testid="control">
            <BaseSelect.Trigger>{state.value().join(',')}</BaseSelect.Trigger>
          </BaseSelect.Control>
          <BaseSelect.Content>
            <BaseSelect.Listbox>
              <For each={items}>{(item) => <BaseSelect.Item item={item} />}</For>
            </BaseSelect.Listbox>
          </BaseSelect.Content>
        </>
      )
    }
    const screen = render(() => (
      <BaseSelect items={items} value={['US', 'GB']} onValueChange={onValueChange}>
        <Parts />
      </BaseSelect>
    ))
    const trigger = screen.getByRole('combobox')
    fireEvent.click(screen.getByTestId('control'))
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(trigger)
    fireEvent.click(within(document.body).getAllByRole('option', { hidden: true })[1]!)
    expect(onValueChange).toHaveBeenCalledWith(['GB'])
  })

  test('filtered navigation never changes committed form serialization', () => {
    const screen = render(() => (
      <form>
        <Combobox name="single" items={items} value="US" defaultOpen />
        <MultiSelect name="multiple" search items={items} value={['US', 'remote']} defaultOpen />
      </form>
    ))
    for (const input of screen.getAllByRole('combobox')) {
      fireEvent.input(input, { target: { value: 'Kingdom' } })
    }
    expect(new FormData(screen.container.querySelector('form')!).getAll('single')).toEqual(['US'])
    expect(new FormData(screen.container.querySelector('form')!).getAll('multiple')).toEqual([
      'US',
      'remote',
    ])
  })

  test('numeric and string values remain distinct', () => {
    const onValueChange = vi.fn()
    const values = [
      { value: 0, label: 'Number' },
      { value: '0', label: 'String' },
    ]
    render(() => <MultiSelect items={values} defaultOpen onValueChange={onValueChange} />)
    const options = within(document.body).getAllByRole('option', { hidden: true })
    fireEvent.click(options[0]!)
    fireEvent.click(options[1]!)
    expect(onValueChange).toHaveBeenLastCalledWith([0, '0'])
  })
})
