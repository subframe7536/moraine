import { getInput } from '@formisch/solid'
import { fireEvent, render as baseRender, within } from '@solidjs/testing-library'
import { createSignal, untrack } from 'solid-js'
import * as v from 'valibot'
import { describe, expect, test, vi } from 'vitest'

import { MoraineProvider } from '../../shared/provider/index.ts'
import { renderWithOwner } from '../../test-utils/owner-render.tsx'
import { createForm } from '../form/index.ts'

import { MultiSelect } from './multi-select.tsx'
import type { MultiSelectT } from './multi-select.types.ts'

const render: typeof baseRender = (ui, options) =>
  baseRender(() => <MoraineProvider>{ui()}</MoraineProvider>, options)

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

  test('control click opens by default when non-editable and trigger click toggles', () => {
    const screen = render(() => <MultiSelect items={ITEMS} />)
    const input = screen.getByRole('combobox')
    const control = screen.container.querySelector('[data-slot="control"]')!
    const trigger = screen.getByRole('button', { name: 'Toggle options' })
    expect(input.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(control)
    expect(input.getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(trigger)
    expect(input.getAttribute('aria-expanded')).toBe('false')
  })

  test('control click does not open by default when editable', () => {
    const screen = render(() => <MultiSelect items={ITEMS} search />)
    const input = screen.getByRole('combobox')
    const control = screen.container.querySelector('[data-slot="control"]')!
    fireEvent.click(control)
    fireEvent.click(input)
    expect(input.getAttribute('aria-expanded')).toBe('false')
  })

  test('openOnControlClick explicitly overrides default behavior', () => {
    // Non-editable with openOnControlClick={false} -> does not open
    const screenDisabled = render(() => <MultiSelect items={ITEMS} openOnControlClick={false} />)
    const controlDisabled = screenDisabled.container.querySelector('[data-slot="control"]')!
    const inputDisabled = screenDisabled.getByRole('combobox')
    fireEvent.click(controlDisabled)
    expect(inputDisabled.getAttribute('aria-expanded')).toBe('false')

    // Editable with openOnControlClick={true} -> opens
    const screenEnabled = render(() => <MultiSelect items={ITEMS} search openOnControlClick />)
    const controlEnabled = screenEnabled.container.querySelector('[data-slot="control"]')!
    const inputEnabled = screenEnabled.getByRole('combobox')
    fireEvent.click(controlEnabled)
    expect(inputEnabled.getAttribute('aria-expanded')).toBe('true')
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

  test('creates free-form items with Enter and the default comma separator', () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <MultiSelect createItem={(input) => ({ value: input, label: input })} onChange={onChange} />
    ))
    const input = screen.getByRole('combobox')
    fireEvent.input(input, { target: { value: 'alpha' } })
    expect(within(document.body).getByText('Press Enter to create “alpha”')).toBeTruthy()
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenLastCalledWith(['alpha'])
    fireEvent.input(input, { target: { value: 'beta,' } })
    expect(onChange).toHaveBeenLastCalledWith(['alpha', 'beta'])
  })

  test('tokenizes duplicate, multiple, and overlapping multi-character separators', () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <MultiSelect
        createItem={(input) => ({ value: input, label: input })}
        tokenSeparators={[':', '::', ',', '::']}
        onChange={onChange}
      />
    ))
    const input = screen.getByRole('combobox')
    fireEvent.input(input, { target: { value: 'alpha::beta,' } })
    expect(onChange).toHaveBeenLastCalledWith(['alpha', 'beta'])
  })

  test('deduplicates token commits and applies maxCount to created items', () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <MultiSelect
        defaultValue={['alpha']}
        createItem={(input) => ({ value: input, label: input })}
        maxCount={2}
        onChange={onChange}
      />
    ))
    const input = screen.getByRole('combobox')
    fireEvent.input(input, { target: { value: 'alpha,' } })
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.input(input, { target: { value: 'beta,gamma,' } })
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenLastCalledWith(['alpha', 'beta'])
  })

  test('pastes multiple tokens and leaves ordinary paste to the input', () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <MultiSelect
        createItem={(input) => ({ value: input, label: input })}
        tokenSeparators={[',', ';']}
        onChange={onChange}
      />
    ))
    const input = screen.getByRole('combobox')
    expect(fireEvent.paste(input, { clipboardData: { getData: () => 'alpha,beta;gamma' } })).toBe(
      false,
    )
    expect(onChange).toHaveBeenLastCalledWith(['alpha', 'beta', 'gamma'])
    expect(fireEvent.paste(input, { clipboardData: { getData: () => 'ordinary text' } })).toBe(true)
  })

  test('defers tokenization until IME composition ends', () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <MultiSelect
        createItem={(input) => ({ value: input, label: input })}
        tokenSeparators={[',']}
        onChange={onChange}
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

  test('resolves exact existing items before creation and rejects disabled items', () => {
    const createItem = vi.fn((input: string) => ({ value: input, label: input }))
    const onChange = vi.fn()
    const screen = render(() => (
      <MultiSelect items={ITEMS} createItem={createItem} onChange={onChange} />
    ))
    const input = screen.getByRole('combobox')
    fireEvent.input(input, { target: { value: 'Apple,' } })
    expect(onChange).toHaveBeenLastCalledWith(['apple'])
    expect(createItem).not.toHaveBeenCalled()
    fireEvent.input(input, { target: { value: 'Cherry,' } })
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(createItem).not.toHaveBeenCalled()
  })

  test('keeps controlled and uncontrolled query state on the shared input', () => {
    const [query, setQuery] = createSignal('controlled')
    const controlled = render(() => (
      <MultiSelect
        createItem={(input) => ({ value: input, label: input })}
        searchValue={query()}
        onSearch={setQuery}
      />
    ))
    const controlledInput = controlled.getByRole('combobox') as HTMLInputElement
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

  test('shares custom tag removal and keyboard focus behavior', async () => {
    const screen = render(() => (
      <MultiSelect
        items={ITEMS}
        defaultValue={['apple', 'banana']}
        tagRender={(tag) => (
          <button type="button" aria-label={`Custom ${tag.value}`} onClick={tag.onClose}>
            {tag.label}
          </button>
        )}
      />
    ))
    fireEvent.click(screen.getByRole('button', { name: 'Custom apple' }))
    expect(screen.queryByRole('button', { name: 'Custom apple' })).toBeNull()
    expect(document.activeElement).toBe(screen.getByRole('combobox'))

    const keyboard = render(() => <MultiSelect items={ITEMS} defaultValue={['apple', 'banana']} />)
    const input = keyboard.getByRole('combobox') as HTMLInputElement
    input.focus()
    input.setSelectionRange(0, 0)
    fireEvent.keyDown(input, { key: 'ArrowLeft' })
    const banana = keyboard.getByRole('button', { name: 'Remove Banana' })
    expect(document.activeElement).toBe(banana)
    fireEvent.keyDown(banana, { key: 'Backspace' })
    await Promise.resolve()
    expect(document.activeElement).toBe(keyboard.getByRole('button', { name: 'Remove Apple' }))
    input.focus()
    fireEvent.keyDown(input, { key: 'Backspace' })
    expect(keyboard.queryByRole('button', { name: 'Remove Apple' })).toBeNull()
  })

  test('hides the placeholder after a tag is committed', () => {
    const screen = render(() => (
      <MultiSelect items={ITEMS} placeholder="Choose fruit" defaultValue={['apple']} />
    ))
    expect(screen.getByRole('combobox').getAttribute('placeholder')).toBe('')
  })

  test('serializes created values and restores uncontrolled values on form reset', async () => {
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

  test('pressing Enter on a duplicate tag does not delete previously created tag', () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <MultiSelect createItem={(input) => ({ value: input, label: input })} onChange={onChange} />
    ))
    const input = screen.getByRole('combobox')
    // 1. Create first tag
    fireEvent.input(input, { target: { value: 'alpha' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenLastCalledWith(['alpha'])
    expect(screen.container.querySelectorAll('[data-slot="tag"]')).toHaveLength(1)

    // 2. Type duplicate tag
    fireEvent.input(input, { target: { value: 'alpha' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(screen.container.querySelectorAll('[data-slot="tag"]')).toHaveLength(1)
  })

  test('pressing Enter on a duplicate item from items collection does not delete the tag', () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <MultiSelect items={ITEMS} defaultValue={['apple']} onChange={onChange} />
    ))
    const input = screen.getByRole('combobox')
    fireEvent.input(input, { target: { value: 'apple' } })
    expect(input.hasAttribute('data-duplicate')).toBe(true)
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.container.querySelectorAll('[data-slot="tag"]')).toHaveLength(1)
  })

  test('entering duplicate tag via delimiter does not duplicate or delete existing tag', () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <MultiSelect
        createItem={(input) => ({ value: input, label: input })}
        defaultValue={['alpha']}
        onChange={onChange}
      />
    ))
    const input = screen.getByRole('combobox')
    fireEvent.input(input, { target: { value: 'alpha,' } })
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.container.querySelectorAll('[data-slot="tag"]')).toHaveLength(1)
  })

  test('pressing Enter on a highlighted already-selected option does not deselect it', () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <MultiSelect items={ITEMS} defaultValue={['apple']} onChange={onChange} defaultOpen />
    ))
    const input = screen.getByRole('combobox')
    // 'app' matches 'apple', which is already selected
    fireEvent.input(input, { target: { value: 'app' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.container.querySelectorAll('[data-slot="tag"]')).toHaveLength(1)
  })

  test('clear-all preserves selected items that are currently disabled', () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <MultiSelect
        items={[
          { value: 'apple', label: 'Apple' },
          { value: 'locked', label: 'Locked', disabled: true },
        ]}
        defaultValue={['apple', 'locked']}
        allowClear
        onChange={onChange}
      />
    ))

    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }))

    expect(onChange).toHaveBeenCalledExactlyOnceWith(['locked'])
    expect(screen.container.querySelectorAll('[data-slot="tag"]')).toHaveLength(1)
    expect(screen.container.querySelector('[data-slot="tagLabel"]')?.textContent).toBe('Locked')
  })
})
