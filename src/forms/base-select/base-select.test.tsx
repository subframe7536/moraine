import { getInput, setInput } from '@formisch/solid'
import { fireEvent, render, waitFor, within } from '@solidjs/testing-library'
import { createSignal, For, Show } from 'solid-js'
import * as v from 'valibot'
import { describe, expect, test, vi } from 'vitest'

import { Button } from '../../elements/button/index.ts'
import { renderWithOwner } from '../../test-utils/owner-render.tsx'
import { Combobox } from '../combobox/combobox.tsx'
import type { FieldBinding } from '../field/field-context.ts'
import { FieldProvider } from '../field/field-context.ts'
import { createForm } from '../form/index.ts'
import { MultiSelect } from '../multi-select/multi-select.tsx'
import { Select } from '../select/select.tsx'

import { BaseSelect, useSelectState } from './base-select.tsx'
import { useBaseSelectSearchInput, useSearchValue } from './utils.ts'

const items = [
  { value: 1, label: 'Alpha', extra: 'first' },
  { value: 2, label: 'Beta', extra: 'second' },
  { value: 3, label: 'Disabled', disabled: true, extra: 'third' },
]

test('keeps an independent BaseSelect owner inside a Select item render', () => {
  render(() => (
    <Select
      items={[{ value: 'outer', label: 'Outer' }]}
      defaultOpen
      itemRender={() => (
        <BaseSelect items={items}>
          <BaseSelect.Control>
            <BaseSelect.Trigger>Inner</BaseSelect.Trigger>
          </BaseSelect.Control>
        </BaseSelect>
      )}
    />
  ))

  expect(document.body.querySelector('[data-slot="select-control"]')).not.toBeNull()
  expect(document.body.querySelector('[data-slot="base-select-control"]')).not.toBeNull()
  expect(document.body.querySelector('[data-slot="base-select-trigger"]')).not.toBeNull()
})

test('separates the Control anchor from the Trigger focus owner and cleans both refs', () => {
  let anchor = (): HTMLElement | undefined => undefined
  let focusOwner = (): HTMLElement | undefined => undefined
  function Anatomy() {
    const state = useSelectState()
    anchor = state.anchor
    focusOwner = state.focusOwner
    return (
      <BaseSelect.Control>
        <BaseSelect.Trigger>Choose</BaseSelect.Trigger>
      </BaseSelect.Control>
    )
  }
  const screen = render(() => (
    <BaseSelect items={items}>
      <Anatomy />
    </BaseSelect>
  ))
  const control = screen.container.querySelector<HTMLElement>('[data-slot="base-select-control"]')!
  const trigger = screen.getByRole('combobox')
  expect(control.tabIndex).toBe(-1)
  expect(control.getAttribute('role')).toBeNull()
  expect(anchor()).toBe(control)
  expect(focusOwner()).toBe(trigger)
  expect(anchor()).not.toBe(focusOwner())
  fireEvent.click(control)
  expect(trigger.getAttribute('aria-expanded')).toBe('false')
  fireEvent.click(trigger)
  expect(trigger.getAttribute('aria-expanded')).toBe('true')
  screen.unmount()
  expect(anchor()).toBeUndefined()
  expect(focusOwner()).toBeUndefined()
})

test('falls back to the focus owner when Control is omitted', () => {
  let anchor = (): HTMLElement | undefined => undefined
  let focusOwner = (): HTMLElement | undefined => undefined
  function Anatomy() {
    const state = useSelectState()
    anchor = state.anchor
    focusOwner = state.focusOwner
    return <BaseSelect.Trigger>Choose</BaseSelect.Trigger>
  }
  const screen = render(() => (
    <BaseSelect items={items}>
      <Anatomy />
    </BaseSelect>
  ))
  expect(anchor()).toBeUndefined()
  expect(focusOwner()).toBe(screen.getByRole('combobox'))
})

test('BaseSelect.Control exposes inherited field state attributes', () => {
  const screen = render(() => (
    <FieldProvider
      value={{
        disabled: true,
        readOnly: true,
        required: true,
        error: 'Required',
      }}
    >
      <BaseSelect items={items}>
        <BaseSelect.Control data-testid="control" />
      </BaseSelect>
    </FieldProvider>
  ))
  const control = screen.getByTestId('control')
  expect(control.getAttribute('data-disabled')).toBe('')
  expect(control.getAttribute('data-readonly')).toBe('')
  expect(control.getAttribute('data-required')).toBe('')
  expect(control.getAttribute('data-invalid')).toBe('')
})

test('uses completed primary presses for outside dismissal', () => {
  const screen = render(() => (
    <>
      <button type="button" data-testid="outside">
        Outside
      </button>
      <BaseSelect items={items} defaultOpen>
        <Parts />
      </BaseSelect>
    </>
  ))
  const trigger = screen.getByRole('combobox')
  const outside = screen.getByTestId('outside')

  fireEvent.pointerDown(outside, { button: 2, pointerType: 'mouse' })
  expect(trigger.getAttribute('aria-expanded')).toBe('true')

  fireEvent.pointerDown(outside, { pointerId: 1, pointerType: 'touch' })
  expect(trigger.getAttribute('aria-expanded')).toBe('true')

  fireEvent.pointerUp(outside, { pointerId: 1, pointerType: 'touch' })
  expect(trigger.getAttribute('aria-expanded')).toBe('false')
})

test('supports a custom searchable Control without BaseSelect.Trigger', () => {
  function SearchControl() {
    const state = useSelectState()
    const search = useSearchValue()
    const input = useBaseSelectSearchInput(state, {}, () => true, search)
    return (
      <BaseSelect.Control>
        <input {...input.binding} />
        <button type="button" onClick={() => state.setOpen(!state.open())}>
          Toggle
        </button>
      </BaseSelect.Control>
    )
  }
  const screen = render(() => (
    <BaseSelect items={items}>
      <SearchControl />
      <BaseSelect.Content>
        <BaseSelect.Listbox />
      </BaseSelect.Content>
    </BaseSelect>
  ))
  const input = screen.getByRole('combobox')
  expect(input.getAttribute('autocomplete')).toBe('off')
  expect(
    screen.container.querySelector('[data-slot="base-select-control"]')?.getAttribute('role'),
  ).toBeNull()
  fireEvent.input(input, { target: { value: 'be' } })
  expect(input.getAttribute('aria-expanded')).toBe('true')
  fireEvent.click(screen.getByRole('button', { name: 'Toggle' }))
  expect(input.getAttribute('aria-expanded')).toBe('false')
})
function Parts() {
  return (
    <>
      <BaseSelect.Trigger>
        {(state) => (
          <span>{items.find((item) => item.value === state.value[0])?.label ?? 'Choose'}</span>
        )}
      </BaseSelect.Trigger>
      <BaseSelect.Content>
        <BaseSelect.Listbox>
          <For each={items}>
            {(item) => (
              <BaseSelect.Item<typeof item> item={item}>
                {(state) => `${state.item.extra}:${state.selected}`}
              </BaseSelect.Item>
            )}
          </For>
        </BaseSelect.Listbox>
        <BaseSelect.Empty>No items</BaseSelect.Empty>
      </BaseSelect.Content>
    </>
  )
}
describe('BaseSelect selection and form', () => {
  test.each([false, true])('owns uncontrolled selection, multiple=%s', (multiple) => {
    const change = vi.fn()
    const screen = render(() =>
      multiple ? (
        <form>
          <BaseSelect items={items} multiple name="choice" defaultOpen onChange={change}>
            <Parts />
          </BaseSelect>
        </form>
      ) : (
        <form>
          <BaseSelect items={items} name="choice" defaultOpen onChange={change}>
            <Parts />
          </BaseSelect>
        </form>
      ),
    )
    fireEvent.click(within(document.body).getAllByRole('option', { hidden: true })[0]!)
    expect(change).toHaveBeenLastCalledWith([1])
    expect(new FormData(screen.container.querySelector('form')!).getAll('choice')).toEqual(['1'])
    expect(screen.getByRole('combobox').getAttribute('aria-expanded')).toBe(String(multiple))
    if (multiple) {
      fireEvent.click(within(document.body).getAllByRole('option', { hidden: true })[0]!)
      expect(change).toHaveBeenLastCalledWith([])
    }
  })
  test.each([false, true])('controlled values remain authoritative, multiple=%s', (multiple) => {
    const change = vi.fn()
    const screen = render(() =>
      multiple ? (
        <BaseSelect items={items} multiple value={[1]} defaultOpen onChange={change}>
          <Parts />
        </BaseSelect>
      ) : (
        <BaseSelect items={items} value={[1]} defaultOpen onChange={change}>
          <Parts />
        </BaseSelect>
      ),
    )
    fireEvent.click(within(document.body).getAllByRole('option', { hidden: true })[1]!)
    expect(change).toHaveBeenLastCalledWith(multiple ? [1, 2] : [2])
    expect(screen.getByRole('combobox').textContent).toBe('Alpha')
  })
  test.each(['disabled', 'readOnly'] as const)('blocks root %s mutations', (key) => {
    const change = vi.fn()
    const screen = render(() => (
      <BaseSelect items={items} {...{ [key]: true }} defaultOpen onChange={change}>
        <Parts />
      </BaseSelect>
    ))
    fireEvent.click(within(document.body).getAllByRole('option', { hidden: true })[0]!)
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' })
    expect(change).not.toHaveBeenCalled()
  })
  test.each([
    [false, false],
    [false, true],
    [true, false],
    [true, true],
  ])('exposes listbox read-only semantics, multiple=%s readOnly=%s', (multiple, readOnly) => {
    render(() => (
      <BaseSelect items={items} defaultOpen multiple={multiple} readOnly={readOnly}>
        <Parts />
      </BaseSelect>
    ))
    const listbox = within(document.body).getByRole('listbox', { hidden: true })
    expect(listbox.getAttribute('aria-readonly')).toBe(readOnly ? 'true' : null)
    expect(listbox.getAttribute('aria-multiselectable')).toBe(multiple ? 'true' : null)
  })
  test('disabled items cannot be selected and closeOnSelect can be overridden', () => {
    const change = vi.fn()
    const screen = render(() => (
      <BaseSelect items={items} defaultOpen closeOnSelect={false} onChange={change}>
        <Parts />
      </BaseSelect>
    ))
    fireEvent.click(within(document.body).getAllByRole('option', { hidden: true })[2]!)
    expect(change).not.toHaveBeenCalled()
    fireEvent.click(within(document.body).getAllByRole('option', { hidden: true })[0]!)
    expect(screen.getByRole('combobox').getAttribute('aria-expanded')).toBe('true')
    const second = within(document.body).getAllByRole('option', { hidden: true })[1]!
    fireEvent.click(second)
    expect(second.getAttribute('data-highlighted')).toBe('')
  })
  test('resolves unknown controlled values without inventing raw items', () => {
    const screen = render(() => (
      <BaseSelect items={items} value={[99]}>
        <Parts />
      </BaseSelect>
    ))
    expect(screen.getByRole('combobox').textContent).toBe('Choose')
  })
  test('validates required and focuses the trigger', () => {
    const screen = render(() => (
      <form>
        <BaseSelect items={items} required name="choice">
          <Parts />
        </BaseSelect>
      </form>
    ))
    const form = screen.container.querySelector('form')!
    expect(form.checkValidity()).toBe(false)
    expect(document.activeElement).toBe(screen.getByRole('combobox'))
  })
  test('resets uncontrolled values and omits disabled controls from submission', async () => {
    const [disabled, setDisabled] = createSignal(false)
    const screen = render(() => (
      <form>
        <BaseSelect
          items={items}
          name="choice"
          defaultValue={[1]}
          defaultOpen
          disabled={disabled()}
          closeOnSelect={false}
        >
          <Parts />
        </BaseSelect>
      </form>
    ))
    const form = screen.container.querySelector('form')!
    fireEvent.click(within(document.body).getAllByRole('option', { hidden: true })[1]!)
    expect(new FormData(form).get('choice')).toBe('2')
    form.reset()
    await waitFor(() => expect(new FormData(form).get('choice')).toBe('1'))
    setDisabled(true)
    expect(new FormData(form).has('choice')).toBe(false)
  })
})
describe('BaseSelect composition', () => {
  test('renders an unstyled button without a layout wrapper', () => {
    const screen = render(() => (
      <BaseSelect items={items}>
        <BaseSelect.Trigger>Choose</BaseSelect.Trigger>
      </BaseSelect>
    ))
    const trigger = screen.getByRole('combobox')
    expect(trigger.tagName).toBe('BUTTON')
    expect(trigger.getAttribute('data-slot')).toBe('base-select-trigger')
    expect(trigger.getAttribute('type')).toBe('button')
    expect(trigger.className).toBe('')
    expect(trigger.parentElement).toBe(screen.container)
  })
  test('composes consumer refs and events with a Moraine Button', () => {
    const ref = vi.fn()
    const screen = render(() => (
      <BaseSelect items={items}>
        <BaseSelect.Trigger as={Button} ref={ref} onClick={(event) => event.preventDefault()}>
          Choose
        </BaseSelect.Trigger>
      </BaseSelect>
    ))
    const trigger = screen.getByRole('combobox')
    expect(ref.mock.calls[0]?.[0]).toBe(trigger)
    fireEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })
  test('listbox is composition-only and empty groups do not suppress Empty', () => {
    const screen = render(() => (
      <BaseSelect items={[]} defaultOpen>
        <BaseSelect.Trigger>Choose</BaseSelect.Trigger>
        <BaseSelect.Content>
          <BaseSelect.Listbox />
          <BaseSelect.Empty>Empty</BaseSelect.Empty>
        </BaseSelect.Content>
      </BaseSelect>
    ))
    const listbox = within(document.body).getByRole('listbox', { hidden: true })
    expect(listbox.children).toHaveLength(0)
    expect(listbox.contains(within(document.body).getByText('Empty'))).toBe(false)
    expect(screen.getByRole('combobox').getAttribute('aria-controls')).toBe(listbox.id)
  })
  test('connects group headings and excludes decorative separators from navigation', () => {
    const screen = render(() => (
      <BaseSelect items={items} multiple defaultOpen>
        <BaseSelect.Trigger as="div">Choose</BaseSelect.Trigger>
        <BaseSelect.Content>
          <BaseSelect.Listbox>
            <BaseSelect.Group>
              <BaseSelect.GroupLabel>Letters</BaseSelect.GroupLabel>
              <BaseSelect.Item item={items[0]!} />
              <BaseSelect.Separator />
              <BaseSelect.Item item={items[1]!} />
            </BaseSelect.Group>
          </BaseSelect.Listbox>
        </BaseSelect.Content>
      </BaseSelect>
    ))
    const group = within(document.body).getByRole('group', { hidden: true })
    expect(group.getAttribute('aria-labelledby')).toBe(
      within(document.body).getByText('Letters').id,
    )
    const separator = group.querySelector('[role="presentation"]')!
    expect(separator.getAttribute('aria-hidden')).toBe('true')
    expect(
      within(document.body)
        .getByRole('listbox', { hidden: true })
        .getAttribute('aria-multiselectable'),
    ).toBe('true')
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'End' })
    expect(
      document.getElementById(screen.getByRole('combobox').getAttribute('aria-activedescendant')!)
        ?.textContent,
    ).toBe('Beta')
  })
  test('only associates groups with an existing nested label and preserves explicit labels', () => {
    render(() => (
      <BaseSelect items={items} defaultOpen>
        <BaseSelect.Trigger>Choose</BaseSelect.Trigger>
        <BaseSelect.Content>
          <BaseSelect.Listbox>
            <BaseSelect.Group data-testid="nested-group" aria-labelledby="consumer-label">
              <BaseSelect.GroupLabel>Nested label</BaseSelect.GroupLabel>
            </BaseSelect.Group>
            <BaseSelect.Group data-testid="unlabelled-group" />
            <BaseSelect.Group data-testid="consumer-group" aria-labelledby="consumer-label" />
            <BaseSelect.Group data-testid="named-group" aria-label="Named options" />
          </BaseSelect.Listbox>
        </BaseSelect.Content>
      </BaseSelect>
    ))

    const nested = within(document.body).getByTestId('nested-group')
    const nestedLabel = within(nested).getByText('Nested label')
    expect(nested.getAttribute('aria-labelledby')).toBe(nestedLabel.id)
    expect(
      within(document.body).getByTestId('unlabelled-group').hasAttribute('aria-labelledby'),
    ).toBe(false)
    expect(
      within(document.body).getByTestId('consumer-group').getAttribute('aria-labelledby'),
    ).toBe('consumer-label')
    const named = within(document.body).getByTestId('named-group')
    expect(named.getAttribute('aria-label')).toBe('Named options')
    expect(named.hasAttribute('aria-labelledby')).toBe(false)
  })
  test.each(['ArrowDown', 'ArrowUp', 'Enter', ' '])('%s opens the trigger', (key) => {
    const screen = render(() => (
      <BaseSelect items={items}>
        <Parts />
      </BaseSelect>
    ))
    fireEvent.keyDown(screen.getByRole('combobox'), { key })
    expect(screen.getByRole('combobox').getAttribute('aria-expanded')).toBe('true')
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' })
    expect(screen.getByRole('combobox').getAttribute('aria-expanded')).toBe('false')
  })
  test('typeahead uses the raw label resolver', () => {
    const change = vi.fn()
    const screen = render(() => (
      <BaseSelect items={items} itemToLabelString={(item) => item.extra} onChange={change}>
        <Parts />
      </BaseSelect>
    ))
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 's' })
    expect(change).toHaveBeenCalledWith([2])
  })
  test('arrow navigation respects loop=false', () => {
    const screen = render(() => (
      <BaseSelect items={items} loop={false} defaultOpen>
        <Parts />
      </BaseSelect>
    ))
    const combobox = screen.getByRole('combobox')
    // Highlight first item
    fireEvent.keyDown(combobox, { key: 'Home' })
    expect(within(document.body).getAllByRole('option')[0]?.getAttribute('data-highlighted')).toBe(
      '',
    )

    // Up arrow at first item should NOT wrap to last item when loop=false
    fireEvent.keyDown(combobox, { key: 'ArrowUp' })
    expect(within(document.body).getAllByRole('option')[0]?.getAttribute('data-highlighted')).toBe(
      '',
    )

    // Down arrow should move to next item
    fireEvent.keyDown(combobox, { key: 'ArrowDown' })
    expect(within(document.body).getAllByRole('option')[1]?.getAttribute('data-highlighted')).toBe(
      '',
    )
  })
  test('arrow navigation does not crash when items array is empty', () => {
    const screen = render(() => (
      <BaseSelect items={[]} defaultOpen>
        <BaseSelect.Trigger>Choose</BaseSelect.Trigger>
        <BaseSelect.Content>
          <BaseSelect.Listbox />
        </BaseSelect.Content>
      </BaseSelect>
    ))
    const combobox = screen.getByRole('combobox')
    expect(() => {
      fireEvent.keyDown(combobox, { key: 'ArrowDown' })
      fireEvent.keyDown(combobox, { key: 'ArrowUp' })
    }).not.toThrow()
  })
})
describe('canonical collection and search view', () => {
  test.each([false, true])(
    'filtered selection still displays and serializes, multiple=%s',
    (multiple) => {
      const screen = render(() => (
        <form>
          <Show
            when={multiple}
            fallback={<Combobox items={items} defaultValue={1} name="choice" defaultOpen />}
          >
            <MultiSelect search items={items} defaultValue={[1]} name="choice" defaultOpen />
          </Show>
        </form>
      ))
      fireEvent.input(screen.getByRole('combobox'), { target: { value: 'Beta' } })
      expect(within(document.body).getAllByRole('option', { hidden: true })).toHaveLength(1)
      expect(
        within(document.body).getAllByRole('option', { hidden: true })[0]!.textContent,
      ).toContain('Beta')
      expect(new FormData(screen.container.querySelector('form')!).getAll('choice')).toEqual(['1'])
      if (multiple) {
        expect(
          screen.container.querySelector('[data-slot="multi-select-tag"]')?.textContent,
        ).toContain('Alpha')
      }
      fireEvent.input(screen.getByRole('combobox'), { target: { value: 'missing' } })
      expect(within(document.body).getByText('No items')).not.toBeNull()
      expect(within(document.body).getByRole('listbox', { hidden: true })).not.toBeNull()
      expect(new FormData(screen.container.querySelector('form')!).getAll('choice')).toEqual(['1'])
    },
  )
})

test('virtual rows remain a small view of canonical selection and compose both refs', () => {
  const leaves = Array.from({ length: 4000 }, (_, value) => ({ value, label: `Item ${value}` }))
  const userRef = vi.fn()
  const virtualRef = vi.fn()
  const scroll = vi.fn()
  const screen = render(() => (
    <form>
      <MultiSelect
        search
        name="virtual"
        items={[{ type: 'group', label: 'All items', items: leaves }]}
        defaultValue={[3999]}
        defaultOpen
        scrollToItem={scroll}
        itemProps={() => ({ ref: userRef })}
        virtualRender={(context) => (
          <For each={context.entries.slice(0, 4)}>
            {(entry, index) => <>{context.render(entry, index(), { ref: virtualRef })}</>}
          </For>
        )}
      />
    </form>
  ))
  const rows = within(document.body).getAllByRole('option', { hidden: true })
  expect(rows).toHaveLength(3)
  expect(rows[0]!.getAttribute('aria-posinset')).toBe('1')
  expect(rows[0]!.getAttribute('aria-setsize')).toBe('4000')
  expect(
    within(document.body).getByRole('group', { hidden: true }).getAttribute('aria-labelledby'),
  ).toBe(within(document.body).getByText('All items').id)
  expect(scroll).toHaveBeenCalledWith(leaves[3999], 4000)
  expect(userRef).toHaveBeenCalledWith(rows[0])
  expect(virtualRef).toHaveBeenCalledWith(rows[0])
  fireEvent.input(screen.getByRole('combobox'), { target: { value: 'Item 2' } })
  expect(within(document.body).getAllByRole('option', { hidden: true })).toHaveLength(3)
  expect(
    within(document.body).getAllByRole('option', { hidden: true })[0]!.getAttribute('aria-setsize'),
  ).toBe(String(leaves.filter((item) => item.label.includes('Item 2')).length))
  expect(screen.container.querySelector('[data-slot="multi-select-tag"]')?.textContent).toContain(
    'Item 3999',
  )
  expect(new FormData(screen.container.querySelector('form')!).getAll('virtual')).toEqual(['3999'])
  expect(screen.container.querySelectorAll('input[type="hidden"]')).toHaveLength(0)
})

test('owns Form context synchronization and treats an unmatched empty field as no selection', () => {
  const change = vi.fn()
  const { screen, value: form } = renderWithOwner(
    () =>
      createForm({
        schema: v.object({ choice: v.union([v.string(), v.number()]) }),
        initialInput: { choice: '' },
      }),
    (form) => (
      <form.Form>
        <form.Field name="choice" label="Choice">
          <BaseSelect items={items} defaultOpen onChange={change}>
            <Parts />
          </BaseSelect>
        </form.Field>
      </form.Form>
    ),
  )
  expect(screen.getByRole('combobox').textContent).toBe('Choose')
  fireEvent.click(within(document.body).getAllByRole('option', { hidden: true })[1]!)
  expect(getInput(form)).toEqual({ choice: 2 })
  expect(change).toHaveBeenCalledWith([2])
  setInput(form, { path: ['choice'], input: '' })
  expect(screen.getByRole('combobox').textContent).toBe('Choose')
  expect(change).toHaveBeenCalledOnce()
})

test('uses raw BaseSelect items to recognize an empty-string Form.Field value', () => {
  const { screen } = renderWithOwner(
    () =>
      createForm({
        schema: v.object({ choice: v.string() }),
        initialInput: { choice: '' },
      }),
    (form) => (
      <form.Form>
        <form.Field name="choice" label="Choice">
          <BaseSelect items={[{ value: '', label: 'Empty value' }]}>
            <BaseSelect.Trigger>{(state) => state.value.length}</BaseSelect.Trigger>
          </BaseSelect>
        </form.Field>
      </form.Form>
    ),
  )

  expect(screen.getByRole('combobox').textContent).toBe('1')
})

test('normalizes controlled multiple values before synchronizing Form.Field', () => {
  const [controlled, setControlled] = createSignal<readonly string[]>(['a', 'a'], {
    equals: false,
  })
  const [fieldValue, setFieldValue] = createSignal<unknown>(['a', 'a'])
  const onInput = vi.fn((value: unknown) => setFieldValue(value))
  const binding: FieldBinding = {
    name: 'choices',
    path: ['choices'],
    get value() {
      return fieldValue()
    },
    setValue: onInput,
    emit: () => undefined,
  }
  const screen = render(() => (
    <FieldProvider value={{ binding }}>
      <BaseSelect
        multiple
        items={[
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ]}
        value={controlled()}
      >
        <BaseSelect.Trigger>{(state) => state.value.join(',')}</BaseSelect.Trigger>
      </BaseSelect>
    </FieldProvider>
  ))

  expect(screen.getByRole('combobox').textContent).toBe('a')
  expect(onInput).toHaveBeenCalledExactlyOnceWith(['a'])
  onInput.mockClear()

  setControlled(['a', 'a'])
  setControlled(['a'])
  expect(onInput).not.toHaveBeenCalled()

  setControlled(['a', 'b'])
  expect(onInput).toHaveBeenCalledExactlyOnceWith(['a', 'b'])
  onInput.mockClear()

  setControlled(['b', 'a'])
  expect(onInput).toHaveBeenCalledExactlyOnceWith(['b', 'a'])
})

test('diagnoses raw BaseSelect duplicate values once without filtering or throwing', () => {
  const duplicate = { value: 'raw-base-duplicate', label: 'Duplicate' }
  const [source, setSource] = createSignal([duplicate, { ...duplicate }], { equals: false })
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)

  expect(() => {
    render(() => (
      <BaseSelect items={source()} defaultOpen>
        <BaseSelect.Content>
          <BaseSelect.Listbox>
            <For each={source()}>{(item) => <BaseSelect.Item item={item} />}</For>
          </BaseSelect.Listbox>
        </BaseSelect.Content>
      </BaseSelect>
    ))
  }).not.toThrow()
  expect(within(document.body).getAllByRole('option', { hidden: true })).toHaveLength(2)
  expect(error).toHaveBeenCalledOnce()
  expect(error).toHaveBeenCalledWith(expect.stringContaining('invalid consumer input'))

  setSource([duplicate, { ...duplicate }])
  expect(error).toHaveBeenCalledOnce()
  error.mockRestore()
})

test('enforces explicit item boundary, prevents DOM leakage, and keeps item prop reactive', () => {
  const initialItem = {
    value: 'alpha',
    label: 'Alpha',
    extra: 'private-data',
    description: 'Custom description',
    customField: 123,
    disabled: false,
  }
  const [item, setItem] = createSignal(initialItem)
  const onChange = vi.fn()
  let renderStateItem: typeof initialItem | undefined
  render(() => (
    <BaseSelect items={[item()]} defaultOpen closeOnSelect={false} onChange={onChange}>
      <BaseSelect.Trigger>Choose</BaseSelect.Trigger>
      <BaseSelect.Content>
        <BaseSelect.Listbox>
          <BaseSelect.Item item={item()} data-testid="option-item">
            {(state) => (
              <span>
                {(() => {
                  renderStateItem = state.item
                  return `${state.item.label}:${state.item.extra}`
                })()}
              </span>
            )}
          </BaseSelect.Item>
        </BaseSelect.Listbox>
      </BaseSelect.Content>
    </BaseSelect>
  ))
  const option = within(document.body).getByRole('option', { hidden: true })
  const initialElement = option
  const initialId = option.id

  expect(option.textContent).toBe('Alpha:private-data')
  expect(renderStateItem).toBe(initialItem)

  for (const name of [
    'item',
    'value',
    'label',
    'disabled',
    'extra',
    'description',
    'customField',
  ]) {
    expect(option.hasAttribute(name)).toBe(false)
  }

  const updatedItem = {
    value: 'beta',
    label: 'Beta',
    extra: 'updated-data',
    description: 'New description',
    customField: 456,
    disabled: true,
  }
  setItem(updatedItem)

  // DOM node must not be replaced
  expect(within(document.body).getByTestId('option-item')).toBe(initialElement)
  expect(option.textContent).toBe('Beta:updated-data')
  expect(renderStateItem).toBe(updatedItem)
  expect(option.id).not.toBe(initialId)
  expect(option.getAttribute('aria-disabled')).toBe('true')

  fireEvent.click(option)
  expect(onChange).not.toHaveBeenCalled()

  setItem({ ...updatedItem, disabled: false })
  fireEvent.click(option)
  expect(onChange).toHaveBeenCalledWith(['beta'])
  expect(option.getAttribute('aria-selected')).toBe('true')
})

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

test('reuses the validation control as the single-select form input', () => {
  const screen = render(() => (
    <form>
      <BaseSelect
        name="choice"
        items={[{ value: 'apple', label: 'Apple' }]}
        defaultValue={['apple']}
        required
      >
        <BaseSelect.Trigger>Choose</BaseSelect.Trigger>
      </BaseSelect>
    </form>
  ))

  const form = screen.container.querySelector('form')!
  const inputs = form.querySelectorAll('input')
  expect(inputs).toHaveLength(1)
  expect(inputs[0]?.type).toBe('checkbox')
  expect(inputs[0]?.checked).toBe(true)
  expect(inputs[0]?.name).toBe('choice')
  expect(inputs[0]?.value).toBe('apple')
  expect(form.checkValidity()).toBe(true)
  expect(new FormData(form).getAll('choice')).toEqual(['apple'])
})

test('only adds hidden inputs for additional multi-select values', () => {
  const screen = render(() => (
    <form>
      <BaseSelect
        multiple
        name="choice"
        items={[
          { value: 'apple', label: 'Apple' },
          { value: 'orange', label: 'Orange' },
          { value: 'pear', label: 'Pear' },
        ]}
        defaultValue={['apple', 'orange', 'pear']}
        required
      >
        <BaseSelect.Trigger>Choose</BaseSelect.Trigger>
      </BaseSelect>
    </form>
  ))

  const form = screen.container.querySelector('form')!
  expect(form.querySelectorAll('input')).toHaveLength(3)
  expect(form.querySelectorAll('input[type="hidden"]')).toHaveLength(2)
  expect(new FormData(form).getAll('choice')).toEqual(['apple', 'orange', 'pear'])
})

test('supports an empty-string value with required validation and form submission', () => {
  const screen = render(() => (
    <form>
      <BaseSelect
        name="choice"
        items={[{ value: '', label: 'Empty value' }]}
        defaultValue={['']}
        required
      >
        <BaseSelect.Trigger>Choose</BaseSelect.Trigger>
      </BaseSelect>
    </form>
  ))

  const form = screen.container.querySelector('form')!
  const input = form.querySelector<HTMLInputElement>('input')!
  expect(input.type).toBe('checkbox')
  expect(input.checked).toBe(true)
  expect(input.value).toBe('')
  expect(form.checkValidity()).toBe(true)
  expect(new FormData(form).getAll('choice')).toEqual([''])
})

test('supports getItemByValue to recognize canonical selection when navigation items omit it', () => {
  const canonical = [
    { value: '', label: 'Empty' },
    { value: 'apple', label: 'Apple' },
  ]
  const visible = [{ value: 'apple', label: 'Apple' }]

  const { screen: screenWithResolver } = renderWithOwner(
    () =>
      createForm({
        schema: v.object({ choice: v.string() }),
        initialInput: { choice: '' },
      }),
    (form) => (
      <form.Form>
        <form.Field name="choice" label="Choice">
          <BaseSelect
            items={visible}
            getItemByValue={(value) => canonical.find((item) => item.value === value)}
          >
            <BaseSelect.Trigger>{(state) => state.value.length}</BaseSelect.Trigger>
          </BaseSelect>
        </form.Field>
      </form.Form>
    ),
  )
  expect(screenWithResolver.getByRole('combobox').textContent).toBe('1')

  const { screen: screenWithoutResolver } = renderWithOwner(
    () =>
      createForm({
        schema: v.object({ choice: v.string() }),
        initialInput: { choice: '' },
      }),
    (form) => (
      <form.Form>
        <form.Field name="choice" label="Choice">
          <BaseSelect items={visible}>
            <BaseSelect.Trigger>{(state) => state.value.length}</BaseSelect.Trigger>
          </BaseSelect>
        </form.Field>
      </form.Form>
    ),
  )
  expect(screenWithoutResolver.getByRole('combobox').textContent).toBe('0')
})

test('resolves canonical item disabled state and passes canonical item to isItemDisabled', () => {
  const onChange = vi.fn()
  const isItemDisabled = vi.fn((item: any, _values) => item.customFlag === true)
  const canonicalItem1 = {
    value: 'target-1',
    label: 'Canonical Target 1',
    disabled: true,
    extra: 'canonical-1',
  }
  const navigationItem1 = {
    value: 'target-1',
    label: 'Nav Target 1',
    disabled: false,
    extra: 'navigation-1',
  }
  const canonicalItem2 = {
    value: 'target-2',
    label: 'Canonical Target 2',
    disabled: false,
    customFlag: true,
    extra: 'canonical-2',
  }
  const navigationItem2 = {
    value: 'target-2',
    label: 'Nav Target 2',
    disabled: false,
    customFlag: false,
    extra: 'navigation-2',
  }

  render(() => (
    <BaseSelect
      items={[navigationItem1, navigationItem2]}
      getItemByValue={(value) => {
        if (value === 'target-1') {
          return canonicalItem1
        }
        if (value === 'target-2') {
          return canonicalItem2
        }
        return undefined
      }}
      isItemDisabled={isItemDisabled}
      defaultOpen
      onChange={onChange}
    >
      <BaseSelect.Trigger>Choose</BaseSelect.Trigger>
      <BaseSelect.Content>
        <BaseSelect.Listbox>
          <BaseSelect.Item item={navigationItem1} />
          <BaseSelect.Item item={navigationItem2} />
        </BaseSelect.Listbox>
      </BaseSelect.Content>
    </BaseSelect>
  ))

  const options = within(document.body).getAllByRole('option', { hidden: true })
  // Option 1: disabled from canonicalItem1.disabled
  expect(options[0]!.getAttribute('aria-disabled')).toBe('true')
  expect(options[0]!.hasAttribute('data-disabled')).toBe(true)

  // Option 2: disabled via isItemDisabled receiving canonicalItem2
  expect(options[1]!.getAttribute('aria-disabled')).toBe('true')
  expect(options[1]!.hasAttribute('data-disabled')).toBe(true)
  expect(isItemDisabled).toHaveBeenCalledWith(canonicalItem2, [])

  fireEvent.click(options[0]!)
  expect(onChange).not.toHaveBeenCalled()
  fireEvent.click(options[1]!)
  expect(onChange).not.toHaveBeenCalled()
})
