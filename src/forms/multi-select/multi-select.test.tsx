import { getInput } from '@formisch/solid'
import { fireEvent, render as baseRender, within } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import * as v from 'valibot'
import { describe, expect, test, vi } from 'vitest'

import { MoraineProvider } from '../../shared/provider/index.ts'
import { renderWithOwner } from '../../test-utils/owner-render.tsx'
import { defaultTheme } from '../../theme/default-theme.ts'
import { createForm } from '../form/index.ts'

import { MultiSelect } from './multi-select.tsx'
import type { MultiSelectT } from './multi-select.types.ts'

const render: typeof baseRender = (ui, options) =>
  baseRender(() => <MoraineProvider theme={defaultTheme}>{ui()}</MoraineProvider>, options)

const ITEMS: MultiSelectT.Item[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry', disabled: true },
]

describe('MultiSelect', () => {
  test('keeps stable control/tag/input/trigger anatomy and one physical input', () => {
    const screen = render(() => <MultiSelect items={ITEMS} defaultValue={['apple']} />)
    const control = screen.container.querySelector('[data-slot="control"]')!
    expect(control.querySelectorAll('input[data-slot="input"]')).toHaveLength(1)
    expect(control.querySelector('[data-slot="tagsContainer"]')).toBeTruthy()
    expect(control.querySelector('[data-slot="tag"]')?.textContent).toContain('Apple')
    expect(screen.getByRole('button', { name: 'Toggle options' }).tabIndex).toBe(-1)
  })

  test('uses a read-only focus owner in non-editable mode with typeahead navigation', () => {
    const screen = render(() => <MultiSelect items={ITEMS} defaultSearchValue="hidden" />)
    const input = screen.getByRole('combobox') as HTMLInputElement
    expect(input.readOnly).toBe(true)
    expect(input.value).toBe('')
    fireEvent.keyDown(input, { key: 'b' })
    expect(screen.container.querySelector('[data-slot="tagLabel"]')?.textContent).toBe('Banana')
  })

  test.each([
    { search: true, createItem: undefined },
    { search: false, createItem: (value: string) => ({ value, label: value }) },
  ])('is editable when search or createItem enables it', (props) => {
    const screen = render(() => <MultiSelect items={ITEMS} {...props} />)
    const input = screen.getByRole('combobox') as HTMLInputElement
    expect(input.readOnly).toBe(false)
  })

  test('control click does not open by default and trigger click toggles', () => {
    const screen = render(() => <MultiSelect items={ITEMS} />)
    const input = screen.getByRole('combobox')
    const control = screen.container.querySelector('[data-slot="control"]')!
    const trigger = screen.getByRole('button', { name: 'Toggle options' })
    fireEvent.click(control)
    fireEvent.click(input)
    expect(input.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(trigger)
    expect(input.getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(trigger)
    expect(input.getAttribute('aria-expanded')).toBe('false')
  })

  test('openOnControlClick=true enables pointer opening', () => {
    const screen = render(() => <MultiSelect items={ITEMS} openOnControlClick />)
    const input = screen.getByRole('combobox')
    fireEvent.click(input)
    expect(input.getAttribute('aria-expanded')).toBe('true')
  })

  test('clear and trigger coexist without accidental opening', () => {
    const onClear = vi.fn()
    const screen = render(() => (
      <MultiSelect items={ITEMS} defaultValue={['apple']} allowClear onClear={onClear} />
    ))
    expect(screen.getByRole('button', { name: 'Toggle options' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }))
    expect(onClear).toHaveBeenCalledOnce()
    expect(screen.getByRole('combobox').getAttribute('aria-expanded')).toBe('false')
  })

  test('tag removal changes once and does not open', () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <MultiSelect items={ITEMS} defaultValue={['apple', 'banana']} onChange={onChange} />
    ))
    fireEvent.click(screen.getByRole('button', { name: 'Remove Apple' }))
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith(['banana'])
    expect(screen.getByRole('combobox').getAttribute('aria-expanded')).toBe('false')
  })

  test('normal selection stays open and clears query', () => {
    const onSearch = vi.fn()
    const onChange = vi.fn()
    const screen = render(() => (
      <MultiSelect search items={ITEMS} defaultOpen onSearch={onSearch} onChange={onChange} />
    ))
    const input = screen.getByRole('combobox') as HTMLInputElement
    fireEvent.input(input, { target: { value: 'ba' } })
    fireEvent.click(within(document.body).getByRole('option', { hidden: true }))
    expect(onChange).toHaveBeenLastCalledWith(['banana'])
    expect(onSearch).toHaveBeenLastCalledWith('')
    expect(input.getAttribute('aria-expanded')).toBe('true')
  })

  test('createItem adds a canonical item and selects its value', () => {
    const createItem = vi.fn((input: string) => ({
      label: input.toUpperCase(),
      value: input,
    }))
    const onChange = vi.fn()
    const screen = render(() => (
      <MultiSelect items={ITEMS} createItem={createItem} onChange={onChange} defaultOpen />
    ))
    const input = screen.getByRole('combobox')
    fireEvent.input(input, { target: { value: 'dragonfruit' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(createItem).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenLastCalledWith(['dragonfruit'])
    expect(screen.container.querySelector('[data-slot="tagLabel"]')?.textContent).toBe(
      'DRAGONFRUIT',
    )
  })

  test('active existing option wins Enter over createItem', () => {
    const createItem = vi.fn((input: string) => ({ label: input, value: input }))
    const onChange = vi.fn()
    const screen = render(() => (
      <MultiSelect items={ITEMS} createItem={createItem} onChange={onChange} defaultOpen />
    ))
    const input = screen.getByRole('combobox')
    fireEvent.input(input, { target: { value: 'ba' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(createItem).not.toHaveBeenCalled()
    expect(onChange).toHaveBeenLastCalledWith(['banana'])
  })

  test('reuses a canonical value returned by createItem', () => {
    const createItem = vi.fn(() => ({ label: 'Duplicate', value: 'apple' }))
    const onChange = vi.fn()
    const screen = render(() => (
      <MultiSelect items={ITEMS} createItem={createItem} onChange={onChange} defaultOpen />
    ))
    const input = screen.getByRole('combobox')
    fireEvent.input(input, { target: { value: 'new label' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenLastCalledWith(['apple'])
    expect(screen.container.querySelector('[data-slot="tagLabel"]')?.textContent).toBe('Apple')
  })

  test('rejects an invalid item returned by an untyped createItem implementation', () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <MultiSelect
        items={ITEMS}
        createItem={() => null as unknown as MultiSelectT.Item}
        onChange={onChange}
        defaultOpen
      />
    ))
    const input = screen.getByRole('combobox')
    fireEvent.input(input, { target: { value: 'invalid' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).not.toHaveBeenCalled()
  })

  test('maxCount blocks additions but allows removal', () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <MultiSelect
        search
        items={ITEMS}
        defaultValue={['apple']}
        maxCount={1}
        defaultOpen
        onChange={onChange}
      />
    ))
    const options = within(document.body).getAllByRole('option', { hidden: true })
    fireEvent.click(options[1]!)
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Remove Apple' }))
    expect(onChange).toHaveBeenLastCalledWith([])
  })

  test('maxTagCount is visual only and unresolved values stay removable', () => {
    const screen = render(() => (
      <form>
        <MultiSelect
          name="fruit"
          items={ITEMS}
          defaultValue={['apple', 'missing', 'banana']}
          maxTagCount={1}
        />
      </form>
    ))
    expect(screen.container.querySelector('[data-slot="tagOverflow"]')?.textContent).toBe('+2')
    expect(new FormData(screen.container.querySelector('form')!).getAll('fruit')).toEqual([
      'apple',
      'missing',
      'banana',
    ])
  })

  test('loading never removes the secondary trigger', () => {
    const screen = render(() => (
      <MultiSelect items={ITEMS} defaultValue={['apple']} allowClear loading />
    ))
    expect(screen.getByRole('button', { name: 'Loading' }).getAttribute('data-slot')).toBe(
      'trigger',
    )
  })

  test('keeps a read-only field browsable through its secondary trigger', () => {
    const screen = render(() => <MultiSelect items={ITEMS} readOnly />)
    const input = screen.getByRole('combobox')
    fireEvent.click(screen.getByRole('button', { name: 'Toggle options' }))
    expect(input.getAttribute('aria-expanded')).toBe('true')
  })

  test('has no tokenSeparators API', () => {
    // @ts-expect-error tokenization belongs to TagsInput.
    const invalid = <MultiSelect items={ITEMS} tokenSeparators={[',']} />
    expect(invalid).toBeTruthy()
  })

  test('keeps controlled values authoritative', () => {
    const [value, setValue] = createSignal<string[]>(['missing'])
    const screen = render(() => <MultiSelect items={ITEMS} value={value()} onChange={setValue} />)
    expect(screen.container.querySelector('[data-slot="tagLabel"]')?.textContent).toBe('missing')
    setValue(['apple'])
    expect(screen.container.querySelector('[data-slot="tagLabel"]')?.textContent).toBe('Apple')
  })

  test('updates a collection array owned by Form.Field', () => {
    const { screen, value: form } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({
            choices: v.pipe(v.array(v.string()), v.minLength(2, 'Choose two')),
          }),
          initialInput: { choices: ['apple'] },
          validate: 'input',
        }),
      (form) => (
        <MoraineProvider theme={defaultTheme}>
          <form.Form>
            <form.Field name="choices" label="Choices">
              <MultiSelect items={ITEMS} defaultOpen />
            </form.Field>
          </form.Form>
        </MoraineProvider>
      ),
    )

    fireEvent.click(within(document.body).getByRole('option', { hidden: true, name: 'Banana' }))
    expect(getInput(form)).toEqual({ choices: ['apple', 'banana'] })
    expect(screen.container.querySelectorAll('[data-slot="tag"]')).toHaveLength(2)
  })

  test('control focus ring highlights only when search input is enabled', () => {
    const screenNoSearch = render(() => <MultiSelect items={ITEMS} />)
    const controlNoSearch = screenNoSearch.container.querySelector('[data-slot="control"]')!
    expect(controlNoSearch.hasAttribute('data-editable')).toBe(false)

    const screenSearch = render(() => <MultiSelect items={ITEMS} search />)
    const controlSearch = screenSearch.container.querySelector('[data-slot="control"]')!
    expect(controlSearch.hasAttribute('data-editable')).toBe(true)
  })
})
