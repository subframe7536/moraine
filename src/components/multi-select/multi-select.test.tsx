import { getInput, setInput } from '@formisch/solid/v2'
import { fireEvent, render, within } from '@solidjs/testing-library'
import { For, createSignal, flush, untrack } from 'solid-js'
import * as v from 'valibot'
import { describe, expect, vi, it } from 'vitest'

import { MoraineProvider } from '../../provider/index'
import { renderWithOwner } from '../../test-util/owner-render'
import { Field } from '../field/field'
import { createForm } from '../index'

import { MultiSelect } from './multi-select'
import type { MultiSelectT } from './multi-select.types'
const ITEMS: Array<MultiSelectT.Item> = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry', disabled: true },
]

describe('multiSelect', () => {
  it('uses BaseSelect.Trigger as the non-editable focus owner without a physical input', () => {
    const screen = render(() => <MultiSelect items={ITEMS} defaultValue={['apple']} />)
    const control = screen.container.querySelector('[data-slot="multi-select-control"]')!
    const trigger = screen.getByRole('combobox')

    expect(trigger.tagName).toBe('BUTTON')
    expect(trigger.getAttribute('data-slot')).toBe('multi-select-trigger')
    expect(trigger.tabIndex).toBe(0)
    expect(control.querySelectorAll('input[data-slot="multi-select-input"]')).toHaveLength(0)
    expect(control.querySelector('[data-slot="multi-select-tags-container"]')).toBeTruthy()
    expect(control.querySelector('[data-slot="multi-select-tag"]')?.textContent).toContain('Apple')
  })

  it('accepts string shorthand items', () => {
    const onChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <MultiSelect
        items={['Apple', 'Pear']}
        defaultValue={['Apple']}
        onValueChange={onChange}
        defaultOpen
      />
    ))
    expect(screen.container.querySelector('[data-slot="multi-select-tag"]')?.textContent).toContain(
      'Apple',
    )
    fireEvent.click(within(document.body).getByRole('option', { hidden: true, name: 'Pear' }))
    expect(onChange).toHaveBeenCalledWith(['Apple', 'Pear'])
  })

  it('non-editable BaseSelect.Trigger owns focus and disclosure', () => {
    const screen = render(() => (
      <>
        <button type="button">Outside</button>
        <MultiSelect items={ITEMS} />
      </>
    ))
    const outside = screen.getByRole('button', { name: 'Outside' })
    const trigger = screen.getByRole('combobox')

    outside.focus()
    expect(document.activeElement).toBe(outside)

    fireEvent.pointerDown(trigger, { pointerType: 'mouse' })
    fireEvent.click(trigger)

    expect(document.activeElement).toBe(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')

    fireEvent.keyDown(document.activeElement!, { key: 'b' })
    fireEvent.keyDown(document.activeElement!, { key: 'Enter' })
    expect(
      screen.container.querySelector('[data-slot="multi-select-tag-label"]')?.textContent,
    ).toBe('Banana')
  })

  it('keeps typeahead navigation on the non-editable trigger', () => {
    const screen = render(() => <MultiSelect items={ITEMS} defaultSearchValue="hidden" />)
    const trigger = screen.getByRole('combobox')
    fireEvent.keyDown(trigger, { key: 'b' })
    expect(
      screen.container.querySelector('[data-slot="multi-select-tag-label"]')?.textContent,
    ).toBe('Banana')
  })

  it.each([
    { searchable: true, createItem: undefined },
    { searchable: false, createItem: (value: string) => ({ value, label: value }) },
  ])('is editable when search or createItem enables it', (props) => {
    const screen = render(() => <MultiSelect items={ITEMS} {...props} />)
    const input = screen.getByRole<HTMLInputElement>('combobox')
    expect(input.readOnly).toBe(false)
  })

  it('matches autocomplete semantics to editable read-only state', () => {
    const editable = render(() => <MultiSelect items={ITEMS} searchable />)
    const editableInput = editable.getByRole<HTMLInputElement>('combobox')
    expect(editableInput.getAttribute('aria-autocomplete')).toBe('list')
    expect(editableInput.getAttribute('autocomplete')).toBe('off')

    const readOnly = render(() => <MultiSelect items={ITEMS} searchable readOnly />)
    const readOnlyInput = readOnly.getByRole<HTMLInputElement>('combobox')
    expect(readOnlyInput.readOnly).toBe(true)
    expect(readOnlyInput.getAttribute('aria-readonly')).toBe('true')
    expect(readOnlyInput.getAttribute('aria-autocomplete')).toBe('none')
    expect(readOnlyInput.getAttribute('autocomplete')).toBe('off')
  })

  it('supports custom autocomplete attribute on editable input', () => {
    const screen = render(() => <MultiSelect items={ITEMS} searchable autoComplete="off email" />)
    const input = screen.getByRole<HTMLInputElement>('combobox')
    expect(input.getAttribute('autocomplete')).toBe('off email')
  })

  it('control click opens by default and the non-editable trigger toggles', () => {
    const screen = render(() => <MultiSelect items={ITEMS} />)
    const trigger = screen.getByRole('combobox')
    const control = screen.container.querySelector('[data-slot="multi-select-control"]')!
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(control)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('control click does not open by default when editable', () => {
    const screen = render(() => <MultiSelect items={ITEMS} searchable />)
    const input = screen.getByRole('combobox')
    const control = screen.container.querySelector('[data-slot="multi-select-control"]')!
    fireEvent.click(control)
    fireEvent.click(input)
    expect(input.getAttribute('aria-expanded')).toBe('false')
  })

  it('openOnControlClick explicitly overrides default behavior', () => {
    // Non-editable with openOnControlClick={false} -> does not open
    const screenDisabled = render(() => <MultiSelect items={ITEMS} openOnControlClick={false} />)
    const controlDisabled = screenDisabled.container.querySelector(
      '[data-slot="multi-select-control"]',
    )!
    const inputDisabled = screenDisabled.getByRole('combobox')
    fireEvent.click(controlDisabled)
    expect(inputDisabled.getAttribute('aria-expanded')).toBe('false')

    // Editable with openOnControlClick={true} -> opens
    const screenEnabled = render(() => <MultiSelect items={ITEMS} searchable openOnControlClick />)
    const controlEnabled = screenEnabled.container.querySelector(
      '[data-slot="multi-select-control"]',
    )!
    const inputEnabled = screenEnabled.getByRole('combobox')
    fireEvent.click(controlEnabled)
    expect(inputEnabled.getAttribute('aria-expanded')).toBe('true')
  })

  it('clear and trigger coexist without accidental opening', () => {
    const onClear = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <MultiSelect items={ITEMS} defaultValue={['apple']} clearable onClear={onClear} />
    ))
    expect(screen.getByRole('combobox')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }))
    expect(onClear).toHaveBeenCalledOnce()
    expect(screen.getByRole('combobox').getAttribute('aria-expanded')).toBe('false')
  })

  it('tag removal changes once and does not open', () => {
    const onChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <MultiSelect items={ITEMS} defaultValue={['apple', 'banana']} onValueChange={onChange} />
    ))
    fireEvent.click(screen.getByRole('button', { name: 'Remove Apple' }))
    expect(onChange).toHaveBeenCalledExactlyOnceWith(['banana'])
    expect(screen.getByRole('combobox').getAttribute('aria-expanded')).toBe('false')
  })

  it('normal selection stays open and clears query', () => {
    const onSearchValueChange = vi.fn<(...args: Array<any>) => void>()
    const onChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <MultiSelect
        searchable
        items={ITEMS}
        defaultOpen
        onSearchValueChange={onSearchValueChange}
        onValueChange={onChange}
      />
    ))
    const input = screen.getByRole<HTMLInputElement>('combobox')
    fireEvent.input(input, { target: { value: 'ba' } })
    fireEvent.click(within(document.body).getByRole('option', { hidden: true }))
    expect(onChange).toHaveBeenLastCalledWith(['banana'])
    expect(onSearchValueChange).toHaveBeenLastCalledWith('')
    expect(input.getAttribute('aria-expanded')).toBe('true')
  })

  it('createItem adds a canonical item and selects its value', () => {
    const createItem = vi.fn<(input: string) => any>((input) => ({
      label: input.toUpperCase(),
      value: input,
    }))
    const onChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <MultiSelect items={ITEMS} createItem={createItem} onValueChange={onChange} defaultOpen />
    ))
    const input = screen.getByRole('combobox')
    fireEvent.input(input, { target: { value: 'dragonfruit' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(createItem).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenLastCalledWith(['dragonfruit'])
    expect(
      screen.container.querySelector('[data-slot="multi-select-tag-label"]')?.textContent,
    ).toBe('DRAGONFRUIT')
  })

  it('active existing option wins Enter over createItem', () => {
    const createItem = vi.fn<(input: string) => any>((input) => ({
      label: input,
      value: input,
    }))
    const onChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <MultiSelect items={ITEMS} createItem={createItem} onValueChange={onChange} defaultOpen />
    ))
    const input = screen.getByRole('combobox')
    fireEvent.input(input, { target: { value: 'ba' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(createItem).not.toHaveBeenCalled()
    expect(onChange).toHaveBeenLastCalledWith(['banana'])
  })

  it('reuses a canonical value returned by createItem', () => {
    const createItem = vi.fn<() => any>(() => ({ label: 'Duplicate', value: 'apple' }))
    const onChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <MultiSelect items={ITEMS} createItem={createItem} onValueChange={onChange} defaultOpen />
    ))
    const input = screen.getByRole('combobox')
    fireEvent.input(input, { target: { value: 'new label' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenLastCalledWith(['apple'])
    expect(
      screen.container.querySelector('[data-slot="multi-select-tag-label"]')?.textContent,
    ).toBe('Apple')
  })

  it('rejects an invalid item returned by an untyped createItem implementation', () => {
    const onChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <MultiSelect
        items={ITEMS}
        createItem={() => null as unknown as MultiSelectT.Item}
        onValueChange={onChange}
        defaultOpen
      />
    ))
    const input = screen.getByRole('combobox')
    fireEvent.input(input, { target: { value: 'invalid' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('maxValues blocks additions but allows removal', () => {
    const onChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <MultiSelect
        searchable
        items={ITEMS}
        defaultValue={['apple']}
        maxValues={1}
        defaultOpen
        onValueChange={onChange}
      />
    ))
    const options = within(document.body).getAllByRole('option', { hidden: true })
    fireEvent.click(options[1]!)
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Remove Apple' }))
    expect(onChange).toHaveBeenLastCalledWith([])
  })

  it('renders the default overflow count without changing the field description', () => {
    const items = [
      { label: 'Apple', value: 'apple' },
      { label: 'Banana', value: 'banana' },
      { label: 'Cherry', value: 'cherry' },
    ]
    const [values, setValues] = createSignal(['apple', 'banana', 'cherry'])
    const [maxVisible, setMaxVisible] = createSignal(1)
    const screen = render(() => (
      <form>
        <Field id="fruits" description="Choose every fruit you want">
          <MultiSelect
            searchable
            name="fruit"
            items={items}
            value={values()}
            onValueChange={setValues}
            maxVisible={maxVisible()}
          />
        </Field>
      </form>
    ))
    const input = screen.getByRole<HTMLInputElement>('combobox')
    const overflow = () => screen.container.querySelector('[data-slot="multi-select-tag-overflow"]')
    expect(overflow()?.textContent).toBe('+2')
    expect(overflow()?.getAttribute('aria-label')).toBe('2 additional selections')
    expect(input.getAttribute('aria-describedby')).toBe('fruits-description')
    expect(new FormData(screen.container.querySelector('form')!).getAll('fruit')).toEqual([
      'apple',
      'banana',
      'cherry',
    ])

    input.focus()
    input.setSelectionRange(0, 0)
    fireEvent.keyDown(input, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remove Apple' }))
    input.focus()
    fireEvent.keyDown(input, { key: 'Backspace' })
    expect(untrack(values)).toEqual(['apple', 'banana'])
    expect(overflow()?.textContent).toBe('+1')
    flush(() => setMaxVisible(2))
    expect(overflow()).toBeNull()
    expect(input.getAttribute('aria-describedby')).toBe('fruits-description')
    flush(() => setMaxVisible(1))
    expect(overflow()?.textContent).toBe('+1')
  })

  it('exposes reactive hidden tags to a custom overflow renderer', () => {
    const [items, setItems] = createSignal([
      { label: 'Apple', value: 'apple' },
      { label: 'Banana', value: 'banana' },
      { label: 'Cherry', value: 'cherry' },
    ])
    const [maxVisible, setMaxVisible] = createSignal(1)
    const screen = render(() => (
      <MultiSelect
        items={items()}
        defaultValue={['apple', 'banana', 'cherry']}
        maxVisible={maxVisible()}
        tagOverflowRender={(props) => (
          <span data-testid="custom-overflow">
            {props.count}:
            <For each={props.tags}>
              {(tag) => (
                <span>
                  {tag.label}/{tag.item?.label}/{tag.value};
                </span>
              )}
            </For>
          </span>
        )}
      />
    ))
    const overflow = () => screen.getByTestId('custom-overflow')
    expect(overflow().textContent).toBe('2:Banana/Banana/banana;Cherry/Cherry/cherry;')
    expect(screen.container.querySelector('[data-slot="multi-select-tag-overflow"]')).toBeNull()

    flush(() =>
      setItems([
        { label: 'Apple', value: 'apple' },
        { label: 'Plantain', value: 'banana' },
        { label: 'Cherry', value: 'cherry' },
      ]),
    )
    expect(overflow().textContent).toBe('2:Plantain/Plantain/banana;Cherry/Cherry/cherry;')

    flush(() => setMaxVisible(2))
    expect(overflow().textContent).toBe('1:Cherry/Cherry/cherry;')
    flush(() => setMaxVisible(3))
    expect(screen.queryByTestId('custom-overflow')).toBeNull()
  })

  it('loading keeps the non-editable trigger mounted', () => {
    const screen = render(() => (
      <MultiSelect items={ITEMS} defaultValue={['apple']} clearable loading />
    ))
    const trigger = screen.getByRole('combobox')
    expect(trigger.getAttribute('data-slot')).toBe('multi-select-trigger')
    expect(trigger.hasAttribute('data-loading')).toBe(true)
    expect(trigger.getAttribute('aria-busy')).toBe('true')
  })

  it('keeps a read-only field browsable through its non-editable trigger', () => {
    const screen = render(() => <MultiSelect items={ITEMS} readOnly />)
    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(
      within(document.body).getByRole('listbox', { hidden: true }).getAttribute('aria-readonly'),
    ).toBe('true')
  })

  it('creates free-form items with Enter and the default comma separator', () => {
    const onChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <MultiSelect
        createItem={(input) => ({ value: input, label: input })}
        onValueChange={onChange}
      />
    ))
    const input = screen.getByRole('combobox')
    fireEvent.input(input, { target: { value: 'alpha' } })
    expect(within(document.body).getByText('Press Enter to create “alpha”')).toBeTruthy()
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenLastCalledWith(['alpha'])
    fireEvent.input(input, { target: { value: 'beta,' } })
    expect(onChange).toHaveBeenLastCalledWith(['alpha', 'beta'])
  })

  it('tokenizes duplicate, multiple, and overlapping multi-character separators', () => {
    const onChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <MultiSelect
        createItem={(input) => ({ value: input, label: input })}
        tokenSeparators={[':', '::', ',', '::']}
        onValueChange={onChange}
      />
    ))
    const input = screen.getByRole('combobox')
    fireEvent.input(input, { target: { value: 'alpha::beta,' } })
    expect(onChange).toHaveBeenLastCalledWith(['alpha', 'beta'])
  })

  it('deduplicates token commits and applies maxValues to created items', () => {
    const onChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <MultiSelect
        defaultValue={['alpha']}
        createItem={(input) => ({ value: input, label: input })}
        maxValues={2}
        onValueChange={onChange}
      />
    ))
    const input = screen.getByRole('combobox')
    fireEvent.input(input, { target: { value: 'alpha,' } })
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.input(input, { target: { value: 'beta,gamma,' } })
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenLastCalledWith(['alpha', 'beta'])
  })

  it('pastes multiple tokens and leaves ordinary paste to the input', () => {
    const onChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <MultiSelect
        createItem={(input) => ({ value: input, label: input })}
        tokenSeparators={[',', ';']}
        onValueChange={onChange}
      />
    ))
    const input = screen.getByRole('combobox')
    expect(fireEvent.paste(input, { clipboardData: { getData: () => 'alpha,beta;gamma' } })).toBe(
      false,
    )
    expect(onChange).toHaveBeenLastCalledWith(['alpha', 'beta', 'gamma'])
    expect(fireEvent.paste(input, { clipboardData: { getData: () => 'ordinary text' } })).toBe(true)
  })

  it('defers tokenization until IME composition ends', () => {
    const onChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <MultiSelect
        createItem={(input) => ({ value: input, label: input })}
        tokenSeparators={[',']}
        onValueChange={onChange}
      />
    ))
    const input = screen.getByRole('combobox')
    fireEvent.compositionStart(input)
    fireEvent.input(input, { target: { value: '未,完' }, isComposing: true })
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.compositionEnd(input, { data: '未,完' })
    expect(onChange).toHaveBeenLastCalledWith(['未'])
    expect((input as HTMLInputElement).value).toBe('完')
  })

  it('resolves exact existing items before creation and rejects disabled items', () => {
    const createItem = vi.fn<(input: string) => any>((input) => ({
      value: input,
      label: input,
    }))
    const onChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <MultiSelect items={ITEMS} createItem={createItem} onValueChange={onChange} />
    ))
    const input = screen.getByRole('combobox')
    fireEvent.input(input, { target: { value: 'Apple,' } })
    expect(onChange).toHaveBeenLastCalledWith(['apple'])
    expect(createItem).not.toHaveBeenCalled()
    fireEvent.input(input, { target: { value: 'Cherry,' } })
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(createItem).not.toHaveBeenCalled()
  })

  it('keeps controlled and uncontrolled query state on the shared input', () => {
    const [query, setQuery] = createSignal('controlled')
    const controlled = render(() => (
      <MultiSelect
        createItem={(input) => ({ value: input, label: input })}
        searchValue={query()}
        onSearchValueChange={setQuery}
      />
    ))
    const controlledInput = controlled.getByRole<HTMLInputElement>('combobox')
    expect(controlledInput.value).toBe('controlled')
    fireEvent.input(controlledInput, { target: { value: 'next' } })
    expect(untrack(query)).toBe('next')

    const uncontrolled = render(() => (
      <MultiSelect
        createItem={(input) => ({ value: input, label: input })}
        defaultSearchValue="draft"
      />
    ))
    const uncontrolledInput = uncontrolled.getByRole<HTMLInputElement>('combobox')
    expect(uncontrolledInput.value).toBe('draft')
  })

  it('shares custom tag removal and keyboard focus behavior', async () => {
    const screen = render(() => (
      <MultiSelect
        items={ITEMS}
        defaultValue={['apple', 'banana']}
        tagRender={(tag) => (
          <button type="button" aria-label={`Custom ${tag.value}`} onClick={tag.remove}>
            {tag.label}
          </button>
        )}
      />
    ))
    fireEvent.click(screen.getByRole('button', { name: 'Custom apple' }))
    expect(screen.queryByRole('button', { name: 'Custom apple' })).toBeNull()
    expect(document.activeElement).toBe(screen.getByRole('combobox'))

    const keyboard = render(() => <MultiSelect items={ITEMS} defaultValue={['apple', 'banana']} />)
    const focus = keyboard.getByRole('combobox')
    focus.focus()
    fireEvent.keyDown(focus, { key: 'ArrowLeft' })
    const banana = keyboard.getByRole('button', { name: 'Remove Banana' })
    expect(document.activeElement).toBe(banana)
    fireEvent.keyDown(banana, { key: 'Backspace' })
    await Promise.resolve()
    expect(document.activeElement).toBe(keyboard.getByRole('button', { name: 'Remove Apple' }))
    focus.focus()
    fireEvent.keyDown(focus, { key: 'Backspace' })
    expect(keyboard.queryByRole('button', { name: 'Remove Apple' })).toBeNull()
  })

  it('renders a non-editable placeholder and hides it after a tag is committed', () => {
    const empty = render(() => <MultiSelect items={ITEMS} placeholder="Choose fruit" />)
    expect(
      empty.container.querySelector('[data-slot="multi-select-placeholder"]')?.textContent,
    ).toBe('Choose fruit')

    const selected = render(() => (
      <MultiSelect items={ITEMS} placeholder="Choose fruit" defaultValue={['apple']} />
    ))
    expect(selected.container.querySelector('[data-slot="multi-select-placeholder"]')).toBeNull()
  })

  it('shows the placeholder translation when no placeholder is set', () => {
    const fallback = render(() => <MultiSelect items={ITEMS} />)
    expect(
      fallback.container.querySelector('[data-slot="multi-select-placeholder"]')?.textContent,
    ).toBe('Select options')

    const translated = render(() => (
      <MultiSelect items={ITEMS} translations={{ placeholder: 'Pick fruit' }} />
    ))
    expect(
      translated.container.querySelector('[data-slot="multi-select-placeholder"]')?.textContent,
    ).toBe('Pick fruit')

    const editable = render(() => (
      <MultiSelect items={ITEMS} searchable translations={{ placeholder: 'Search fruit' }} />
    ))
    const input = editable.container.querySelector<HTMLInputElement>(
      'input[data-slot="multi-select-input"]',
    )!
    expect(input.placeholder).toBe('Search fruit')

    const explicit = render(() => (
      <MultiSelect
        items={ITEMS}
        searchable
        placeholder="Choose fruit"
        translations={{ placeholder: 'Search fruit' }}
      />
    ))
    expect(
      explicit.container.querySelector<HTMLInputElement>('input[data-slot="multi-select-input"]')!
        .placeholder,
    ).toBe('Choose fruit')
  })

  it('serializes created values and restores uncontrolled values on form reset', async () => {
    const screen = render(() => (
      <form>
        <MultiSelect
          name="tag"
          defaultValue={['alpha']}
          createItem={(input) => ({ value: input, label: input })}
        />
      </form>
    ))
    const form = screen.container.querySelector('form')!
    fireEvent.input(screen.getByRole('combobox'), { target: { value: 'beta,' } })
    expect(new FormData(form).getAll('tag')).toEqual(['alpha', 'beta'])
    form.reset()
    await Promise.resolve()
    expect(new FormData(form).getAll('tag')).toEqual(['alpha'])
  })

  it('keeps controlled values authoritative', () => {
    const [value, setValue] = createSignal<Array<string>>(['missing'])
    const screen = render(() => (
      <MultiSelect items={ITEMS} value={value()} onValueChange={setValue} />
    ))
    expect(
      screen.container.querySelector('[data-slot="multi-select-tag-label"]')?.textContent,
    ).toBe('missing')
    flush(() => setValue(['apple']))
    expect(
      screen.container.querySelector('[data-slot="multi-select-tag-label"]')?.textContent,
    ).toBe('Apple')
  })

  it('treats value undefined as uncontrolled and applies defaultValue', () => {
    const onChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <MultiSelect
        items={ITEMS}
        value={undefined}
        defaultValue={['banana']}
        defaultOpen
        onValueChange={onChange}
      />
    ))
    const tagLabels = () =>
      Array.from(screen.container.querySelectorAll('[data-slot="multi-select-tag-label"]')).map(
        (label) => label.textContent,
      )

    expect(tagLabels()).toEqual(['Banana'])
    fireEvent.click(within(document.body).getByRole('option', { hidden: true, name: 'Apple' }))
    expect(onChange).toHaveBeenLastCalledWith(['banana', 'apple'])
    expect(tagLabels()).toEqual(['Banana', 'Apple'])
  })

  it('keeps a defined value authoritative over defaultValue and user selection', () => {
    const [value, setValue] = createSignal<Array<string> | undefined>(['apple'])
    const onChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <MultiSelect
        items={ITEMS}
        value={value()}
        defaultValue={['banana']}
        defaultOpen
        onValueChange={onChange}
      />
    ))
    const tagLabels = () =>
      Array.from(screen.container.querySelectorAll('[data-slot="multi-select-tag-label"]')).map(
        (label) => label.textContent,
      )

    expect(tagLabels()).toEqual(['Apple'])
    fireEvent.click(within(document.body).getByRole('option', { hidden: true, name: 'Banana' }))
    expect(onChange).toHaveBeenLastCalledWith(['apple', 'banana'])
    expect(tagLabels()).toEqual(['Apple'])
    flush(() => setValue(['apple', 'banana']))
    expect(tagLabels()).toEqual(['Apple', 'Banana'])
  })

  it('hands back to the initial default when a defined value becomes undefined', () => {
    const [value, setValue] = createSignal<Array<string> | undefined>(['apple'])
    const screen = render(() => (
      <MultiSelect items={ITEMS} value={value()} defaultValue={['banana']} defaultOpen />
    ))
    const tagLabels = () =>
      Array.from(screen.container.querySelectorAll('[data-slot="multi-select-tag-label"]')).map(
        (label) => label.textContent,
      )

    expect(tagLabels()).toEqual(['Apple'])
    flush(() => setValue(undefined))
    expect(tagLabels()).toEqual(['Banana'])
    fireEvent.click(within(document.body).getByRole('option', { hidden: true, name: 'Apple' }))
    expect(tagLabels()).toEqual(['Banana', 'Apple'])
  })

  it('falls back to the Form.Field value while value is undefined', () => {
    const { screen, value: form } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ choices: v.optional(v.array(v.string())) }),
          initialInput: { choices: ['banana'] },
        }),
      (form) => (
        <MoraineProvider>
          <form.Form>
            <form.Field name="choices" label="Choices">
              <MultiSelect items={ITEMS} value={undefined} defaultOpen />
            </form.Field>
          </form.Form>
        </MoraineProvider>
      ),
    )

    expect(
      screen.container.querySelector('[data-slot="multi-select-tag-label"]')?.textContent,
    ).toBe('Banana')
    fireEvent.click(within(document.body).getByRole('option', { hidden: true, name: 'Apple' }))
    expect(getInput(form)).toEqual({ choices: ['banana', 'apple'] })
  })

  it('clears the selection when the Form.Field value is reset to null or undefined', () => {
    const { screen, value: form } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ choices: v.nullish(v.array(v.string())) }),
          initialInput: { choices: ['apple'] },
        }),
      (form) => (
        <MoraineProvider>
          <form.Form>
            <form.Field name="choices" label="Choices">
              <MultiSelect items={ITEMS} />
            </form.Field>
          </form.Form>
        </MoraineProvider>
      ),
    )
    const tags = () => screen.container.querySelectorAll('[data-slot="multi-select-tag"]')

    expect(tags()).toHaveLength(1)
    flush(() => setInput(form, { path: ['choices'], input: null }))
    expect(tags()).toHaveLength(0)
    flush(() => setInput(form, { path: ['choices'], input: ['banana'] }))
    expect(tags()).toHaveLength(1)
    flush(() => setInput(form, { path: ['choices'], input: undefined }))
    expect(tags()).toHaveLength(0)
  })

  it('updates a collection array owned by Form.Field', () => {
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
        <MoraineProvider>
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
    expect(screen.container.querySelectorAll('[data-slot="multi-select-tag"]')).toHaveLength(2)
  })

  it('a pointer press on the non-editable control focuses its trigger', () => {
    const screen = render(() => <MultiSelect items={ITEMS} />)
    const control = screen.container.querySelector('[data-slot="multi-select-control"]')!
    const trigger = screen.getByRole('combobox')

    expect(control.hasAttribute('data-editable')).toBe(false)
    expect(trigger.tagName).toBe('BUTTON')
    expect(trigger.getAttribute('data-slot')).toBe('multi-select-trigger')
    expect(control.querySelector('input[data-slot="multi-select-input"]')).toBeNull()

    fireEvent.pointerDown(control, { pointerType: 'mouse' })
    expect(document.activeElement).toBe(trigger)
  })

  it('an editable MultiSelect is a single text input inside the control', () => {
    const screen = render(() => <MultiSelect items={ITEMS} searchable />)
    const control = screen.container.querySelector('[data-slot="multi-select-control"]')!
    const input = screen.getByRole('combobox')

    expect(control.hasAttribute('data-editable')).toBe(true)
    expect(input.tagName).toBe('INPUT')
    expect(control.querySelectorAll('input[data-slot="multi-select-input"]')).toHaveLength(1)
  })

  it('pressing Enter on a duplicate tag does not delete previously created tag', () => {
    const onChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <MultiSelect
        createItem={(input) => ({ value: input, label: input })}
        onValueChange={onChange}
      />
    ))
    const input = screen.getByRole('combobox')
    // 1. Create first tag
    fireEvent.input(input, { target: { value: 'alpha' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenLastCalledWith(['alpha'])
    expect(screen.container.querySelectorAll('[data-slot="multi-select-tag"]')).toHaveLength(1)

    // 2. Type duplicate tag
    fireEvent.input(input, { target: { value: 'alpha' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(screen.container.querySelectorAll('[data-slot="multi-select-tag"]')).toHaveLength(1)
  })

  it('pressing Enter on a duplicate item from items collection does not delete the tag', () => {
    const onChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <MultiSelect searchable items={ITEMS} defaultValue={['apple']} onValueChange={onChange} />
    ))
    const input = screen.getByRole('combobox')
    fireEvent.input(input, { target: { value: 'apple' } })
    expect(input.hasAttribute('data-duplicate')).toBe(true)
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.container.querySelectorAll('[data-slot="multi-select-tag"]')).toHaveLength(1)
  })

  it('entering duplicate tag via delimiter does not duplicate or delete existing tag', () => {
    const onChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <MultiSelect
        createItem={(input) => ({ value: input, label: input })}
        defaultValue={['alpha']}
        onValueChange={onChange}
      />
    ))
    const input = screen.getByRole('combobox')
    fireEvent.input(input, { target: { value: 'alpha,' } })
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.container.querySelectorAll('[data-slot="multi-select-tag"]')).toHaveLength(1)
  })

  it('pressing Enter on a highlighted already-selected option does not deselect it', () => {
    const onChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <MultiSelect
        searchable
        items={ITEMS}
        defaultValue={['apple']}
        onValueChange={onChange}
        defaultOpen
      />
    ))
    const input = screen.getByRole('combobox')
    // 'app' matches 'apple', which is already selected
    fireEvent.input(input, { target: { value: 'app' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.container.querySelectorAll('[data-slot="multi-select-tag"]')).toHaveLength(1)
  })

  it('clear-all preserves selected items that are currently disabled', () => {
    const onChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <MultiSelect
        items={[
          { value: 'apple', label: 'Apple' },
          { value: 'locked', label: 'Locked', disabled: true },
        ]}
        defaultValue={['apple', 'locked']}
        clearable
        onValueChange={onChange}
      />
    ))

    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }))

    expect(onChange).toHaveBeenCalledExactlyOnceWith(['locked'])
    expect(screen.container.querySelectorAll('[data-slot="multi-select-tag"]')).toHaveLength(1)
    expect(
      screen.container.querySelector('[data-slot="multi-select-tag-label"]')?.textContent,
    ).toBe('Locked')
  })

  it('keeps existing tag DOM nodes stable when adding a new value', () => {
    const [value, setValue] = createSignal(['apple'])
    const screen = render(() => (
      <MultiSelect
        value={value()}
        items={[
          { value: 'apple', label: 'Apple' },
          { value: 'banana', label: 'Banana' },
        ]}
      />
    ))

    const firstTag = screen.container.querySelector('[data-slot="multi-select-tag"]')
    expect(firstTag).not.toBeNull()

    flush(() => setValue(['apple', 'banana']))
    const tags = screen.container.querySelectorAll('[data-slot="multi-select-tag"]')
    expect(tags).toHaveLength(2)
    expect(tags[0]).toBe(firstTag)
  })

  it('clear button is non-tabbable with no focus ring', () => {
    const screen = render(() => (
      <MultiSelect items={ITEMS} defaultValue={['apple']} searchable clearable />
    ))
    const clear = screen.container.querySelector<HTMLElement>('[data-slot="multi-select-clear"]')!
    expect(clear.tabIndex).toBe(-1)
    expect(clear.className).toContain('outline-none')
    expect(clear.className).not.toContain('focus-visible:ring-')
  })
})
