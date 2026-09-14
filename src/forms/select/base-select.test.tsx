import { getInput, setInput } from '@formisch/solid'
import type { FieldStore } from '@formisch/solid'
import { fireEvent, render, waitFor, within } from '@solidjs/testing-library'
import { createSignal, For, Show } from 'solid-js'
import * as v from 'valibot'
import { describe, expect, test, vi } from 'vitest'

import { Button } from '../../elements/button/index.ts'
import { renderWithOwner } from '../../test-utils/owner-render.tsx'
import { FormFieldProvider } from '../form/form-context.ts'
import { createForm } from '../form/index.ts'

import { BaseSelect } from './base-select.tsx'
import { MultiSelect } from './multi-select.tsx'
import { Select } from './select.tsx'

const items = [
  { value: 1, label: 'Alpha', extra: 'first' },
  { value: 2, label: 'Beta', extra: 'second' },
  { value: 3, label: 'Disabled', disabled: true, extra: 'third' },
]
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
              <BaseSelect.Item item={item}>
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
})
describe('canonical collection and search view', () => {
  test.each([false, true])(
    'filtered selection still displays and serializes, multiple=%s',
    (multiple) => {
      const screen = render(() => (
        <form>
          <Show
            when={multiple}
            fallback={<Select search items={items} defaultValue={1} name="choice" defaultOpen />}
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
        expect(screen.container.querySelector('[data-slot="tag"]')?.textContent).toContain('Alpha')
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
  expect(screen.container.querySelector('[data-slot="tag"]')?.textContent).toContain('Item 3999')
  expect(new FormData(screen.container.querySelector('form')!).getAll('virtual')).toEqual(['3999'])
  expect(screen.container.querySelectorAll('input[type="hidden"]')).toHaveLength(1)
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

test('normalizes controlled multiple values before synchronizing Form.Field', () => {
  const [controlled, setControlled] = createSignal<readonly string[]>(['a', 'a'], {
    equals: false,
  })
  const [fieldValue, setFieldValue] = createSignal<unknown>(['a', 'a'])
  const onInput = vi.fn((value: unknown) => setFieldValue(value))
  const field = {
    get input() {
      return fieldValue()
    },
    onInput,
    props: {
      name: 'choices',
      ref: () => undefined,
      onBlur: () => undefined,
      onChange: () => undefined,
      onFocus: () => undefined,
    },
  } as unknown as FieldStore
  const screen = render(() => (
    <FormFieldProvider value={{ ariaId: 'choices', field }}>
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
    </FormFieldProvider>
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
