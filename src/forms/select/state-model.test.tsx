import { getInput } from '@formisch/solid'
import { fireEvent, render, waitFor, within } from '@solidjs/testing-library'
import { createSignal, For } from 'solid-js'
import * as v from 'valibot'
import { describe, expect, test, vi } from 'vitest'

import { renderWithOwner } from '../../test-utils/owner-render.tsx'
import { createForm } from '../form/index.ts'

import { BaseSelect, useSelectState } from './base-select.tsx'
import { MultiSelect } from './multi-select.tsx'
import type { MultiSelectT } from './multi-select.types.ts'
import { Select } from './select.tsx'
import type { SelectT } from './select.types.ts'

const countries = [
  { value: 'US', label: 'United States', department: 'America' },
  { value: 'GB', label: 'United Kingdom', department: 'Europe' },
  { value: 'JP', label: 'Japan', department: 'Asia' },
]
const options = () => within(document.body).queryAllByRole('option', { hidden: true })
async function finishExit() {
  await Promise.resolve()
  const content = document.querySelector('[data-slot="content"]')
  if (content) {
    fireEvent.animationEnd(content)
  }
  await waitFor(() => expect(document.querySelector('[data-slot="content"]')).toBeNull())
}

describe('BaseSelect array and lifecycle contracts', () => {
  test('normalizes controlled single selection and exposes only value-owned trigger state', () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <BaseSelect items={countries} value={['US', 'GB']} defaultOpen onChange={onChange}>
        <BaseSelect.Trigger>
          {(state) => {
            expect('selectedItems' in state).toBe(false)
            return JSON.stringify(state.value)
          }}
        </BaseSelect.Trigger>
        <BaseSelect.Content>
          <BaseSelect.Listbox>
            <For each={countries}>{(item) => <BaseSelect.Item item={item} />}</For>
          </BaseSelect.Listbox>
        </BaseSelect.Content>
      </BaseSelect>
    ))
    expect(screen.getByRole('combobox').textContent).toBe('["US"]')
    fireEvent.click(options()[1]!)
    expect(onChange).toHaveBeenCalledWith(['GB'])
    expect(screen.getByRole('combobox').textContent).toBe('["US"]')
  })

  test('uses raw numeric/string values for highlight and dynamic disabled policy', () => {
    const items = [
      { value: 0, label: 'Zero' },
      { value: '0', label: 'String zero' },
    ]
    const [blocked, setBlocked] = createSignal(true)
    const onChange = vi.fn()
    function Parts() {
      const state = useSelectState()
      return (
        <>
          <output>
            {typeof state.highlightedValue()}:{String(state.highlightedValue())}
          </output>
          <BaseSelect.Trigger>Choose</BaseSelect.Trigger>
          <BaseSelect.Content>
            <BaseSelect.Listbox>
              <For each={items}>{(item) => <BaseSelect.Item item={item} />}</For>
            </BaseSelect.Listbox>
          </BaseSelect.Content>
        </>
      )
    }
    const screen = render(() => (
      <BaseSelect
        items={items}
        multiple
        defaultOpen
        isItemDisabled={(item) => blocked() && item.value === '0'}
        onChange={onChange}
      >
        <Parts />
      </BaseSelect>
    ))
    expect(screen.getByText('number:0')).toBeTruthy()
    expect(
      document.getElementById(screen.getByRole('combobox').getAttribute('aria-activedescendant')!)
        ?.textContent,
    ).toBe('Zero')
    fireEvent.click(options()[1]!)
    expect(onChange).not.toHaveBeenCalled()
    setBlocked(false)
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'End' })
    expect(screen.getByText('string:0')).toBeTruthy()
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' })
    expect(onChange).toHaveBeenLastCalledWith(['0'])
    fireEvent.click(options()[0]!)
    expect(onChange).toHaveBeenLastCalledWith(['0', 0])
  })

  test('notifies reset after restoring uncontrolled state, and respects prevention', async () => {
    const reset = vi.fn()
    const screen = render(() => (
      <form>
        <BaseSelect
          items={countries}
          defaultValue={['US']}
          defaultOpen
          closeOnSelect={false}
          onReset={() =>
            reset(new FormData(screen.container.querySelector('form')!).get('country'))
          }
          name="country"
        >
          <BaseSelect.Trigger>Choose</BaseSelect.Trigger>
          <BaseSelect.Content>
            <BaseSelect.Listbox>
              <For each={countries}>{(item) => <BaseSelect.Item item={item} />}</For>
            </BaseSelect.Listbox>
          </BaseSelect.Content>
        </BaseSelect>
      </form>
    ))
    const form = screen.container.querySelector('form')!
    fireEvent.click(options()[1]!)
    form.reset()
    await waitFor(() => expect(reset).toHaveBeenCalledWith('US'))
    form.addEventListener('reset', (event) => event.preventDefault(), { once: true })
    form.reset()
    await Promise.resolve()
    expect(reset).toHaveBeenCalledOnce()
  })

  test('exit callback skips initial absence and interrupted exits', async () => {
    const exit = vi.fn()
    const [open, setOpen] = createSignal(false)
    render(() => (
      <BaseSelect items={countries} open={open()}>
        <BaseSelect.Trigger>Choose</BaseSelect.Trigger>
        <BaseSelect.Content onExitComplete={exit}>
          <BaseSelect.Listbox />
        </BaseSelect.Content>
      </BaseSelect>
    ))
    expect(exit).not.toHaveBeenCalled()
    setOpen(true)
    setOpen(false)
    await Promise.resolve()
    setOpen(true)
    fireEvent.animationEnd(document.querySelector('[data-slot="content"]')!)
    expect(exit).not.toHaveBeenCalled()
    setOpen(false)
    await finishExit()
    expect(exit).toHaveBeenCalledOnce()
    setOpen(true)
    setOpen(false)
    await finishExit()
    expect(exit).toHaveBeenCalledTimes(2)
  })
})

describe('query ownership', () => {
  test.each(['selection', 'Escape', 'outside'] as const)(
    'single %s preserves filtering through exit, then clears query',
    async (reason) => {
      const search = vi.fn()
      const change = vi.fn()
      const screen = render(() => (
        <Select items={countries} search defaultValue="US" onSearch={search} onChange={change} />
      ))
      const input = screen.getByRole<HTMLInputElement>('combobox')
      expect(input.value).toBe('United States')
      fireEvent.click(input)
      expect(input.value).toBe('')
      fireEvent.input(input, { target: { value: 'uni' } })
      expect(options()).toHaveLength(2)
      if (reason === 'selection') {
        fireEvent.click(options()[1]!)
      } else if (reason === 'Escape') {
        fireEvent.keyDown(input, { key: 'Escape' })
      } else {
        fireEvent.pointerDown(document.body)
      }
      await Promise.resolve()
      expect(input.getAttribute('aria-expanded')).toBe('false')
      expect(document.querySelector('[data-slot="content"]')?.hasAttribute('data-closed')).toBe(
        true,
      )
      expect(options()).toHaveLength(2)
      expect(search.mock.calls).toEqual([['uni']])
      expect(input.value).toBe(reason === 'selection' ? 'United Kingdom' : 'United States')
      if (reason === 'selection') {
        expect(change).toHaveBeenCalledWith('GB')
      }
      await finishExit()
      expect(search.mock.calls).toEqual([['uni'], ['']])
      fireEvent.click(input)
      expect(input.value).toBe('')
      expect(options()).toHaveLength(3)
    },
  )

  test.each(['Escape', 'outside'] as const)(
    'multiple %s preserves query, while selection and deselection clear it',
    async (reason) => {
      const search = vi.fn()
      const screen = render(() => (
        <MultiSelect items={countries} search defaultOpen onSearch={search} />
      ))
      const input = screen.getByRole<HTMLInputElement>('combobox')
      fireEvent.input(input, { target: { value: 'uni' } })
      if (reason === 'Escape') {
        fireEvent.keyDown(input, { key: 'Escape' })
      } else {
        fireEvent.pointerDown(document.body)
      }
      await finishExit()
      expect(input.value).toBe('uni')
      fireEvent.click(input)
      expect(options()).toHaveLength(2)
      fireEvent.click(options()[0]!)
      expect(input.value).toBe('')
      fireEvent.input(input, { target: { value: 'uni' } })
      fireEvent.click(options()[0]!)
      expect(input.value).toBe('')
      expect(screen.container.querySelector('[data-slot="tag"]')).toBeNull()
      expect(search.mock.calls).toEqual([['uni'], [''], ['uni'], ['']])
    },
  )
})

describe('search composition replacement', () => {
  test('discards an active single-select IME preview when pointer selection closes the popup', () => {
    const change = vi.fn()
    const screen = render(() => <Select items={countries} search defaultOpen onChange={change} />)
    const input = screen.getByRole<HTMLInputElement>('combobox')

    fireEvent.compositionStart(input)
    fireEvent.input(input, { target: { value: '未確定' }, isComposing: true })
    expect(input.value).toBe('未確定')

    fireEvent.click(options()[0]!)
    expect(change).toHaveBeenCalledWith('US')
    expect(input.value).toBe('United States')
    expect(input.getAttribute('aria-expanded')).toBe('false')

    fireEvent.input(input, { target: { value: 'king' } })
    expect(input.value).toBe('king')
  })

  test('discards an IME preview when reselecting the current single value', () => {
    const change = vi.fn()
    const screen = render(() => (
      <Select items={countries} search defaultOpen defaultValue="US" onChange={change} />
    ))
    const input = screen.getByRole<HTMLInputElement>('combobox')
    fireEvent.compositionStart(input)
    fireEvent.input(input, { target: { value: '未確定' }, isComposing: true })

    fireEvent.click(options()[0]!)

    expect(change).not.toHaveBeenCalled()
    expect(input.value).toBe('United States')
    expect(input.getAttribute('aria-expanded')).toBe('false')
  })

  test('discards an active multi-select IME preview while selection keeps the popup open', () => {
    const screen = render(() => <MultiSelect items={countries} search defaultOpen />)
    const input = screen.getByRole<HTMLInputElement>('combobox')

    fireEvent.compositionStart(input)
    fireEvent.input(input, { target: { value: '未確定' }, isComposing: true })
    fireEvent.click(options()[0]!)

    expect(input.value).toBe('')
    expect(input.getAttribute('aria-expanded')).toBe('true')
    expect(screen.container.querySelector('[data-slot="tag"]')?.textContent).toBe('United States')

    fireEvent.input(input, { target: { value: 'king' } })
    expect(input.value).toBe('king')
    expect(options()).toHaveLength(1)
  })
})

describe('empty-string Form.Field decoding', () => {
  test('uses the full searchable source while the empty-valued item is filtered out', async () => {
    const source = [
      { value: '', label: 'Empty value' },
      { value: 'foo', label: 'Foo' },
    ]
    const { screen, value: form } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ choice: v.string() }),
          initialInput: { choice: '' },
        }),
      (form) => (
        <form.Form>
          <form.Field name="choice" label="Choice">
            <Select items={source} search defaultOpen placeholder="Choose" />
          </form.Field>
        </form.Form>
      ),
    )
    const input = screen.getByRole<HTMLInputElement>('combobox')
    expect(options()[0]?.getAttribute('aria-selected')).toBe('true')

    fireEvent.input(input, { target: { value: 'foo' } })
    expect(options()).toHaveLength(1)
    expect(getInput(form)).toEqual({ choice: '' })

    fireEvent.keyDown(input, { key: 'Escape' })
    await waitFor(() => expect(input.value).toBe('Empty value'))
    expect(getInput(form)).toEqual({ choice: '' })
    await finishExit()

    fireEvent.click(input)
    expect(options()).toHaveLength(2)
    expect(options()[0]?.getAttribute('aria-selected')).toBe('true')
  })

  test('treats an empty Form.Field as unselected when no canonical empty value exists', () => {
    const { screen } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ choice: v.string() }),
          initialInput: { choice: '' },
        }),
      (form) => (
        <form.Form>
          <form.Field name="choice" label="Choice">
            <Select items={countries} placeholder="Choose" />
          </form.Field>
        </form.Form>
      ),
    )
    expect(screen.getByRole('combobox').textContent).toBe('Choose')
  })
})

describe('complete items and unresolved values', () => {
  test('unresolved tags retain original value and later resolve to canonical objects', () => {
    type Item = (typeof countries)[number]
    const [items, setItems] = createSignal<Item[]>([])
    const seen: MultiSelectT.TagRenderProps<Item>[] = []
    const screen = render(() => (
      <MultiSelect<Item>
        items={items()}
        value={['US']}
        tagRender={(props) => {
          seen.push(props)
          return <span data-testid="tag">{props.label}</span>
        }}
      />
    ))
    expect(screen.getByTestId('tag').textContent).toBe('US')
    expect(seen.at(-1)?.item).toBeUndefined()
    expect(seen.at(-1)?.value).toBe('US')
    setItems(countries)
    expect(screen.getByTestId('tag').textContent).toBe('United States')
    expect(seen.at(-1)?.item).toBe(countries[0])
    setItems([])
    expect(screen.getByTestId('tag').textContent).toBe('US')
  })

  test('default tag and single display unresolved values', () => {
    const screen = render(() => (
      <>
        <MultiSelect<MultiSelectT.Item<number>> items={[]} value={[42]} />
        <Select<SelectT.Item<number>> search items={[]} value={42} />
      </>
    ))
    expect(screen.container.querySelector('[data-slot="tag"]')?.textContent).toBe('42')
    expect(screen.getAllByRole<HTMLInputElement>('combobox')[1]?.value).toBe('42')
  })

  test.each(['Enter', 'empty', 'tokens'] as const)(
    'all %s creation uses the complete item factory',
    (path) => {
      const factory = vi.fn((text: string) => ({ value: text, label: text, department: 'Custom' }))
      const change = vi.fn()
      const screen = render(() => (
        <MultiSelect
          items={countries}
          createItem={factory}
          defaultOpen
          tokenSeparators={[',']}
          onChange={change}
          tagRender={(props) => (
            <span>
              {props.item?.department}:{props.label}
            </span>
          )}
          emptyRender={(props) => <button onClick={() => props.create()}>Create</button>}
        />
      ))
      const input = screen.getByRole<HTMLInputElement>('combobox')
      fireEvent.input(input, { target: { value: path === 'tokens' ? 'Other,' : 'Other' } })
      if (path === 'Enter') {
        fireEvent.keyDown(input, { key: 'Enter' })
      } else if (path === 'empty') {
        fireEvent.click(within(document.body).getByText('Create'))
      }
      expect(factory).toHaveBeenCalledExactlyOnceWith('Other')
      expect(change).toHaveBeenLastCalledWith(['Other'])
      expect(screen.getByText('Custom:Other')).toBeTruthy()
      expect(input.value).toBe('')
    },
  )

  test('tokens select existing items without a factory and never fabricate unmatched items', () => {
    const change = vi.fn()
    const screen = render(() => (
      <MultiSelect items={countries} tokenSeparators={[',']} onChange={change} />
    ))
    fireEvent.input(screen.getByRole('combobox'), { target: { value: 'United States,Other,' } })
    expect(change).toHaveBeenLastCalledWith(['US'])
    expect(screen.container.querySelector('[data-slot="tag"]')?.textContent).toBe('United States')
  })

  test('matching existing text skips the factory and maxCount retains selected row interactivity', () => {
    const factory = vi.fn((text: string) => ({ value: text, label: text, department: 'Custom' }))
    const screen = render(() => (
      <MultiSelect
        items={countries}
        createItem={factory}
        tokenSeparators={[',']}
        maxCount={1}
        defaultOpen
      />
    ))
    const input = screen.getByRole('combobox')
    fireEvent.input(input, { target: { value: 'United States,' } })
    expect(factory).not.toHaveBeenCalled()
    expect(options()[0]?.getAttribute('aria-disabled')).toBeNull()
    expect(options()[1]?.getAttribute('aria-disabled')).toBe('true')
    fireEvent.click(options()[0]!)
    expect(options()[1]?.getAttribute('aria-disabled')).toBeNull()
  })

  test('resolves an already-selected unresolved value through createItem without appending it', () => {
    const factory = vi.fn(() => ({
      value: 'remote',
      label: 'Created remote',
      department: 'Custom',
    }))
    const change = vi.fn()
    const screen = render(() => (
      <MultiSelect
        items={countries}
        value={['remote']}
        createItem={factory}
        onChange={change}
        tagRender={(props) => (
          <span data-testid="remote-tag">{props.item?.label ?? props.label}</span>
        )}
      />
    ))
    const input = screen.getByRole<HTMLInputElement>('combobox')

    fireEvent.input(input, { target: { value: 'create remote' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(factory).toHaveBeenCalledOnce()
    expect(change).not.toHaveBeenCalled()
    expect(screen.getByTestId('remote-tag').textContent).toBe('Created remote')
    expect(input.value).toBe('')
    expect(options().filter((item) => item.textContent?.includes('Created remote'))).toHaveLength(1)

    fireEvent.input(input, { target: { value: 'create again' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(change).not.toHaveBeenCalled()
    expect(options().filter((item) => item.textContent?.includes('Created remote'))).toHaveLength(1)
  })

  test('keeps canonical metadata when createItem returns an existing selected value', () => {
    const factory = vi.fn(() => ({ value: 'US', label: 'Created duplicate', department: 'Custom' }))
    const screen = render(() => (
      <MultiSelect
        items={countries}
        value={['US']}
        createItem={factory}
        tagRender={(props) => <span data-testid="canonical-tag">{props.item?.label}</span>}
      />
    ))
    const input = screen.getByRole<HTMLInputElement>('combobox')
    fireEvent.input(input, { target: { value: 'other label' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(factory).toHaveBeenCalledOnce()
    expect(screen.getByTestId('canonical-tag').textContent).toBe('United States')
    expect(options().filter((item) => item.textContent?.includes('United States'))).toHaveLength(1)
  })
})

test('controlled reset notifies auxiliary owners and clears runtime-created item resolution', async () => {
  const reset = vi.fn()
  const factory = vi.fn((text: string) => ({ value: text, label: `Created ${text}` }))
  const screen = render(() => (
    <form>
      <MultiSelect
        value={['remote']}
        items={[]}
        createItem={factory}
        defaultSearchValue="initial"
        onReset={reset}
      />
    </form>
  ))
  const input = screen.getByRole<HTMLInputElement>('combobox')
  fireEvent.input(input, { target: { value: 'new' } })
  fireEvent.keyDown(input, { key: 'Enter' })
  expect(factory).toHaveBeenCalledWith('new')
  fireEvent.input(input, { target: { value: 'query' } })
  screen.container.querySelector('form')!.reset()
  await waitFor(() => expect(reset).toHaveBeenCalledExactlyOnceWith())
  expect(input.value).toBe('')
  expect(screen.container.querySelector('[data-slot="tag"]')?.textContent).toBe('remote')
  expect(options()).toHaveLength(0)
})

test('trigger render state updates selection inside its existing JSX owner', () => {
  let mounts = 0
  const screen = render(() => (
    <BaseSelect items={countries} defaultValue={['US']} defaultOpen>
      <BaseSelect.Trigger>
        {(state) => {
          mounts += 1
          return <span>{state.value.join(',')}</span>
        }}
      </BaseSelect.Trigger>
      <BaseSelect.Content>
        <BaseSelect.Listbox>
          <For each={countries}>{(item) => <BaseSelect.Item item={item} />}</For>
        </BaseSelect.Listbox>
      </BaseSelect.Content>
    </BaseSelect>
  ))
  const label = screen.getByRole('combobox').firstChild
  fireEvent.click(options()[1]!)
  expect(screen.getByRole('combobox').textContent).toBe('GB')
  expect(screen.getByRole('combobox').firstChild).toBe(label)
  expect(mounts).toBe(1)
})

test('canonical disabled selection stays omitted from forms when filtering hides it', () => {
  const items = [
    { value: 'disabled', label: 'Disabled', disabled: true },
    { value: 'other', label: 'Other' },
  ]
  const screen = render(() => (
    <form>
      <Select name="single" search items={items} value="disabled" required />
      <MultiSelect name="multi" search items={items} value={['disabled', 'unresolved']} required />
    </form>
  ))
  const form = screen.container.querySelector('form')!
  for (const input of screen.getAllByRole('combobox')) {
    fireEvent.input(input, { target: { value: 'Other' } })
  }
  expect(new FormData(form).getAll('single')).toEqual([])
  expect(new FormData(form).getAll('multi')).toEqual(['unresolved'])
  expect(form.checkValidity()).toBe(true)
})
