import { fireEvent, render as baseRender, waitFor, within } from '@solidjs/testing-library'
import { createSignal, untrack } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { MoraineProvider } from '../../shared/provider/index.ts'
import { defaultTheme } from '../../theme/default-theme.ts'

import { Combobox } from './combobox.tsx'

const render: typeof baseRender = (ui, options) =>
  baseRender(() => <MoraineProvider theme={defaultTheme}>{ui()}</MoraineProvider>, options)

const ITEMS = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry', disabled: true },
]

async function finishExit(): Promise<void> {
  await waitFor(() =>
    expect(document.body.querySelector('[data-slot="content"]')?.hasAttribute('data-closed')).toBe(
      true,
    ),
  )
  const content = document.body.querySelector('[data-slot="content"]')
  if (content) {
    fireEvent.animationEnd(content)
    fireEvent.transitionEnd(content)
  }
  await Promise.resolve()
}

describe('Combobox', () => {
  test('uses one input focus owner and a secondary non-tab-stop trigger', () => {
    const screen = render(() => <Combobox items={ITEMS} />)
    const input = screen.getByRole('combobox')
    const trigger = screen.getByRole('button', { name: 'Toggle options' })
    expect(input.tagName).toBe('INPUT')
    expect(trigger.getAttribute('data-slot')).toBe('trigger')
    expect(trigger.tabIndex).toBe(-1)
    expect(trigger.getAttribute('role')).toBeNull()
    expect(screen.container.querySelectorAll('input[data-slot="input"]')).toHaveLength(1)
  })

  test('control clicks do not open by default', () => {
    const screen = render(() => <Combobox items={ITEMS} />)
    const control = screen.container.querySelector<HTMLElement>('[data-slot="control"]')!
    const input = screen.getByRole('combobox')
    fireEvent.click(control)
    expect(input.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(input)
    expect(input.getAttribute('aria-expanded')).toBe('false')
  })

  test('openOnControlClick=true enables pointer-open', () => {
    const screen = render(() => <Combobox items={ITEMS} openOnControlClick />)
    const input = screen.getByRole('combobox')
    fireEvent.click(input)
    expect(input.getAttribute('aria-expanded')).toBe('true')
  })

  test('typing opens independently of openOnControlClick', () => {
    const screen = render(() => <Combobox items={ITEMS} openOnControlClick={false} />)
    const input = screen.getByRole('combobox') as HTMLInputElement
    fireEvent.input(input, { target: { value: 'ba' } })
    expect(input.getAttribute('aria-expanded')).toBe('true')
    expect(within(document.body).getAllByRole('option', { hidden: true })).toHaveLength(1)
  })

  test('secondary trigger toggles without bubbling into control open', () => {
    const screen = render(() => <Combobox items={ITEMS} />)
    const input = screen.getByRole('combobox')
    const trigger = screen.getByRole('button', { name: 'Toggle options' })
    fireEvent.click(trigger)
    expect(input.getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(trigger)
    expect(input.getAttribute('aria-expanded')).toBe('false')
  })

  test('keeps a read-only field browsable through its secondary trigger', () => {
    const screen = render(() => <Combobox items={ITEMS} readOnly />)
    const input = screen.getByRole('combobox')
    fireEvent.click(screen.getByRole('button', { name: 'Toggle options' }))
    expect(input.getAttribute('aria-expanded')).toBe('true')
  })

  test('clear and trigger coexist and clear does not open', () => {
    const onClear = vi.fn()
    const screen = render(() => (
      <Combobox items={ITEMS} defaultValue="apple" allowClear onClear={onClear} />
    ))
    expect(screen.getByRole('button', { name: 'Toggle options' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }))
    expect(onClear).toHaveBeenCalledOnce()
    expect(screen.getByRole('combobox').getAttribute('aria-expanded')).toBe('false')
  })

  test('keeps the trigger structurally present while loading', () => {
    const screen = render(() => <Combobox items={ITEMS} defaultValue="apple" allowClear loading />)
    const trigger = screen.getByRole('button', { name: 'Loading' })
    expect(trigger.getAttribute('data-slot')).toBe('trigger')
    expect(trigger.hasAttribute('data-loading')).toBe(true)
  })

  test('keeps query and committed value independent with exit-safe cleanup', async () => {
    const onSearch = vi.fn()
    const onChange = vi.fn()
    const screen = render(() => (
      <Combobox
        items={ITEMS}
        defaultValue="apple"
        defaultOpen
        onSearch={onSearch}
        onChange={onChange}
      />
    ))
    const input = screen.getByRole('combobox') as HTMLInputElement
    fireEvent.input(input, { target: { value: 'ba' } })
    expect(input.value).toBe('ba')
    fireEvent.click(within(document.body).getByRole('option', { hidden: true }))
    expect(onChange).toHaveBeenLastCalledWith('banana')
    expect(input.value).toBe('Banana')
    expect(onSearch).toHaveBeenLastCalledWith('ba')
    await finishExit()
    await waitFor(() => expect(onSearch).toHaveBeenLastCalledWith(''))
  })

  test('supports controlled query and external filtering', () => {
    const [query, setQuery] = createSignal('')
    const screen = render(() => (
      <Combobox
        items={ITEMS}
        searchValue={query()}
        onSearch={setQuery}
        filterItem={false}
        defaultOpen
      />
    ))
    fireEvent.input(screen.getByRole('combobox'), { target: { value: 'not-filtered' } })
    expect(untrack(query)).toBe('not-filtered')
    expect(within(document.body).getAllByRole('option', { hidden: true })).toHaveLength(3)
  })

  test('does not publish partial IME composition', () => {
    const onSearch = vi.fn()
    const screen = render(() => <Combobox items={ITEMS} onSearch={onSearch} />)
    const input = screen.getByRole('combobox')
    fireEvent.compositionStart(input)
    fireEvent.input(input, { target: { value: 'ば' }, isComposing: true })
    expect(onSearch).not.toHaveBeenCalled()
    fireEvent.compositionEnd(input, { data: 'ば' })
    expect(onSearch).toHaveBeenLastCalledWith('ば')
  })

  test('serializes and resets the committed value, not the query', () => {
    const screen = render(() => (
      <form>
        <Combobox name="fruit" items={ITEMS} defaultValue="apple" />
      </form>
    ))
    const form = screen.container.querySelector('form')!
    const input = screen.getByRole('combobox')
    fireEvent.input(input, { target: { value: 'ba' } })
    expect(new FormData(form).getAll('fruit')).toEqual(['apple'])
    fireEvent.reset(form)
    expect(new FormData(form).getAll('fruit')).toEqual(['apple'])
  })

  test('has data-editable on control for search input focus ring', () => {
    const screen = render(() => <Combobox items={ITEMS} />)
    const control = screen.container.querySelector('[data-slot="control"]')!
    expect(control.hasAttribute('data-editable')).toBe(true)
  })
})
