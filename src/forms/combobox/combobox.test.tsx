import { getInput } from '@formisch/solid'
import { fireEvent, render as baseRender, waitFor, within } from '@solidjs/testing-library'
import { createSignal, untrack } from 'solid-js'
import * as v from 'valibot'
import { describe, expect, test, vi } from 'vitest'

import { MoraineProvider } from '../../provider/index.ts'
import { renderWithOwner } from '../../test-utils/owner-render.tsx'
import { Field } from '../field/field.tsx'
import { createForm } from '../form/index.ts'

import { Combobox } from './combobox.tsx'

const render: typeof baseRender = (ui, options) =>
  baseRender(() => <MoraineProvider>{ui()}</MoraineProvider>, options)

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

  test('announces list autocomplete for an editable input', () => {
    const screen = render(() => <Combobox items={ITEMS} />)
    const input = screen.getByRole<HTMLInputElement>('combobox')
    expect(input.readOnly).toBe(false)
    expect(input.getAttribute('aria-readonly')).toBeNull()
    expect(input.getAttribute('aria-autocomplete')).toBe('list')
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

  test('keeps a read-only field browsable without promising autocomplete', () => {
    const screen = render(() => <Combobox items={ITEMS} readOnly />)
    const input = screen.getByRole<HTMLInputElement>('combobox')
    const trigger = screen.getByRole('button', { name: 'Toggle options' })
    expect(input.readOnly).toBe(true)
    expect(input.getAttribute('aria-readonly')).toBe('true')
    expect(input.getAttribute('aria-autocomplete')).toBe('none')
    expect(trigger.getAttribute('aria-controls')).toBe(input.getAttribute('aria-controls'))
    fireEvent.click(trigger)
    expect(input.getAttribute('aria-expanded')).toBe('true')
    const listbox = within(document.body).getByRole('listbox', { hidden: true })
    expect(listbox.id).toBe(input.getAttribute('aria-controls'))
    expect(listbox.getAttribute('aria-readonly')).toBe('true')
  })

  test('inherits read-only autocomplete semantics from Field', () => {
    const screen = render(() => (
      <Field readOnly>
        <Combobox items={ITEMS} />
      </Field>
    ))
    const input = screen.getByRole<HTMLInputElement>('combobox')
    expect(input.readOnly).toBe(true)
    expect(input.getAttribute('aria-readonly')).toBe('true')
    expect(input.getAttribute('aria-autocomplete')).toBe('none')
  })

  test('validates required selection and submits with the form', () => {
    const screen = render(() => (
      <form>
        <Combobox name="fruit" items={ITEMS} required />
      </form>
    ))
    const form = screen.container.querySelector('form')!
    const input = screen.getByRole<HTMLInputElement>('combobox')
    expect(form.checkValidity()).toBe(false)
    expect(document.activeElement).toBe(input)

    fireEvent.input(input, { target: { value: 'app' } })
    expect(form.checkValidity()).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: 'Toggle options' }))
    fireEvent.click(within(document.body).getByRole('option', { hidden: true, name: 'Apple' }))
    expect(form.checkValidity()).toBe(true)
    expect(new FormData(form).getAll('fruit')).toEqual(['apple'])
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

    expect(input.getAttribute('name')).toBeNull()
    expect(new FormData(form).getAll('fruit')).toEqual(['apple'])
    fireEvent.reset(form)
    expect(new FormData(form).getAll('fruit')).toEqual(['apple'])
  })

  test('keeps Form.Field selection values scalar across falsey changes and reset', async () => {
    const { screen, value: form } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ choice: v.nullable(v.union([v.string(), v.number()])) }),
          initialInput: { choice: null as string | number | null },
        }),
      (form) => (
        <MoraineProvider>
          <form.Form>
            <form.Field name="choice" label="Choice">
              <Combobox
                items={[
                  { label: 'Empty', value: '' },
                  { label: 'Zero', value: 0 },
                ]}
                closeOnSelect={false}
                defaultOpen
              />
            </form.Field>
          </form.Form>
        </MoraineProvider>
      ),
    )

    fireEvent.click(within(document.body).getByRole('option', { hidden: true, name: 'Empty' }))
    expect(getInput(form)).toEqual({ choice: '' })
    fireEvent.click(within(document.body).getByRole('option', { hidden: true, name: 'Zero' }))
    expect(getInput(form)).toEqual({ choice: 0 })
    screen.container.querySelector('form')!.reset()
    await Promise.resolve()
    expect(getInput(form)).toEqual({ choice: null })
  })

  test('synchronizes controlled scalar Form.Field values as primitives', () => {
    const [controlled, setControlled] = createSignal<string | number | null>('apple')
    const { value: form } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ choice: v.nullable(v.union([v.string(), v.number()])) }),
          initialInput: { choice: null as string | number | null },
        }),
      (form) => (
        <form.Form>
          <form.Field name="choice" label="Choice">
            <Combobox
              items={[...ITEMS, { label: 'Empty', value: '' }, { label: 'Zero', value: 0 }]}
              value={controlled()}
            />
          </form.Field>
        </form.Form>
      ),
    )

    expect(getInput(form)).toEqual({ choice: 'apple' })
    setControlled(0)
    expect(getInput(form)).toEqual({ choice: 0 })
    setControlled('')
    expect(getInput(form)).toEqual({ choice: '' })
    setControlled(null)
    expect(getInput(form)).toEqual({ choice: null })
  })

  test('has data-editable on control for search input focus ring', () => {
    const screen = render(() => <Combobox items={ITEMS} />)
    const control = screen.container.querySelector('[data-slot="control"]')!
    expect(control.hasAttribute('data-editable')).toBe(true)
  })
})

test('selects, submits, clears, and resets string shorthand values', async () => {
  const onChange = vi.fn()
  const screen = render(() => (
    <form>
      <Combobox
        name="string-fruit"
        items={['Apple', 'Banana']}
        defaultValue="Apple"
        defaultOpen
        allowClear
        onChange={onChange}
      />
    </form>
  ))
  const form = screen.container.querySelector('form')!
  fireEvent.click(within(document.body).getByRole('option', { name: 'Banana', hidden: true }))
  expect(onChange).toHaveBeenLastCalledWith('Banana')
  expect(new FormData(form).getAll('string-fruit')).toEqual(['Banana'])
  fireEvent.click(screen.container.querySelector<HTMLElement>('[data-slot="clear"]')!)
  expect(onChange).toHaveBeenLastCalledWith(null)
  form.reset()
  await Promise.resolve()
  expect(new FormData(form).getAll('string-fruit')).toEqual(['Apple'])
})

test('updates mixed string groups and passes normalized objects to row callbacks', () => {
  const object = { value: 1, label: 'One', extra: true }
  const [keys, setKeys] = createSignal(['Apple', 'Banana'])
  const seen: unknown[] = []
  const screen = render(() => (
    <Combobox<string | typeof object>
      items={[object, { type: 'group', label: 'Fruit', items: keys() }]}
      defaultOpen
      isItemDisabled={(item) => item.value === 'Banana'}
      itemRender={({ item }) => {
        seen.push(item)
        return item.label
      }}
      itemProps={({ item }) => ({ 'data-value': item.value })}
    />
  ))
  expect(seen).toContain(object)
  expect(seen).toContainEqual({ value: 'Apple', label: 'Apple' })
  expect(
    within(document.body)
      .getByRole('option', { name: 'Banana', hidden: true })
      .getAttribute('aria-disabled'),
  ).toBe('true')
  setKeys(['Cherry'])
  expect(within(document.body).queryByRole('option', { name: 'Apple', hidden: true })).toBeNull()
  expect(
    within(document.body)
      .getByRole('option', { name: 'Cherry', hidden: true })
      .getAttribute('data-value'),
  ).toBe('Cherry')
  expect(screen.getByRole('combobox')).toBeTruthy()
})

test('filters normalized string items and commits a keyboard selection', () => {
  const filterItem = vi.fn((query: string, item: { value: string; label: string }) =>
    item.label.toLowerCase().includes(query.toLowerCase()),
  )
  const onChange = vi.fn()
  const screen = render(() => (
    <Combobox items={['Apple', 'Banana']} defaultOpen filterItem={filterItem} onChange={onChange} />
  ))
  const input = screen.getByRole('combobox')
  fireEvent.input(input, { target: { value: 'ban' } })
  expect(within(document.body).getAllByRole('option', { hidden: true })).toHaveLength(1)
  expect(filterItem).toHaveBeenCalledWith('ban', { value: 'Banana', label: 'Banana' })
  fireEvent.keyDown(input, { key: 'ArrowDown' })
  fireEvent.keyDown(input, { key: 'Enter' })
  expect(onChange).toHaveBeenLastCalledWith('Banana')
})
