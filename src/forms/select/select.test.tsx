import { getInput } from '@formisch/solid'
import { fireEvent, render as baseRender, within } from '@solidjs/testing-library'
import { createSignal, For } from 'solid-js'
import * as v from 'valibot'
import { describe, expect, test, vi } from 'vitest'

import { MoraineProvider } from '../../provider/index.ts'
import { renderWithOwner } from '../../test-utils/owner-render.tsx'
import { createForm } from '../form/index.ts'

import { Select } from './select.tsx'

const render: typeof baseRender = (ui, options) =>
  baseRender(() => <MoraineProvider>{ui()}</MoraineProvider>, options)

const ITEMS = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry', disabled: true },
]

describe('Select', () => {
  test('renders Control, primary Trigger, and Value anatomy', () => {
    const screen = render(() => <Select items={ITEMS} defaultValue="apple" />)
    const control = screen.container.querySelector('[data-slot="select-control"]')!
    const trigger = screen.getByRole('combobox')
    expect(control).toBeInstanceOf(HTMLDivElement)
    expect(trigger.tagName).toBe('BUTTON')
    expect(trigger.getAttribute('data-slot')).toBe('select-trigger')
    expect(control.querySelector('[data-slot="select-value"]')?.textContent).toBe('Apple')
    expect(control.querySelector('input[data-slot="input"]')).toBeNull()
  })

  test('clear stays inside the trigger without nesting an interactive control', () => {
    const onClear = vi.fn()
    const screen = render(() => (
      <Select items={ITEMS} defaultValue="apple" allowClear onClear={onClear} />
    ))
    const trigger = screen.getByRole('combobox')
    const clear = screen.container.querySelector<HTMLElement>('[data-slot="select-clear"]')!
    expect(clear.tagName).toBe('SPAN')
    expect(clear.getAttribute('aria-hidden')).toBe('true')
    expect(trigger.contains(clear)).toBe(true)
    expect(trigger.querySelector('button')).toBeNull()
    fireEvent.click(clear)
    expect(onClear).toHaveBeenCalledOnce()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(screen.container.querySelector('[data-slot="select-value"]')?.textContent).toBe('')
  })

  test('selects values, closes, and restores trigger focus', async () => {
    const onChange = vi.fn()
    const screen = render(() => <Select items={ITEMS} defaultOpen onChange={onChange} />)
    fireEvent.click(within(document.body).getAllByRole('option', { hidden: true })[1]!)
    expect(onChange).toHaveBeenLastCalledWith('banana')
    expect(screen.getByRole('combobox').getAttribute('aria-expanded')).toBe('false')
    await Promise.resolve()
    expect(document.activeElement).toBe(screen.getByRole('combobox'))
  })

  test('scrolls the selected option within the listbox without moving the page', async () => {
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView
    const page = document.documentElement
    const pageScroll = page.scrollTop
    page.scrollTop = 320
    HTMLElement.prototype.scrollIntoView = vi.fn(() => {
      page.scrollTop = 0
    })

    try {
      const screen = render(() => <Select items={ITEMS} defaultValue="banana" />)
      fireEvent.click(screen.getByRole('combobox'))

      const listbox = within(document.body).getByRole('listbox', { hidden: true })
      const selected = within(listbox).getByRole('option', { name: 'Banana', hidden: true })
      Object.defineProperties(listbox, {
        clientHeight: { configurable: true, value: 80 },
        scrollHeight: { configurable: true, value: 240 },
      })
      vi.spyOn(listbox, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 120, 80))
      vi.spyOn(selected, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 100, 120, 32))

      await Promise.resolve()
      expect(page.scrollTop).toBe(320)
      expect(listbox.scrollTop).toBe(52)
    } finally {
      HTMLElement.prototype.scrollIntoView = originalScrollIntoView
      page.scrollTop = pageScroll
      vi.restoreAllMocks()
    }
  })

  test('inherits read-only listbox semantics', () => {
    const screen = render(() => <Select items={ITEMS} defaultOpen readOnly />)
    expect(screen.getByRole('combobox').getAttribute('aria-readonly')).toBe('true')
    expect(
      within(document.body).getByRole('listbox', { hidden: true }).getAttribute('aria-readonly'),
    ).toBe('true')
  })

  test('keeps typeahead without exposing search state', () => {
    const onChange = vi.fn()
    const screen = render(() => <Select items={ITEMS} onChange={onChange} />)
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'b' })
    expect(onChange).toHaveBeenLastCalledWith('banana')
  })

  test('renders unresolved, empty-string, and numeric values', () => {
    const [value, setValue] = createSignal<string | number | null>('missing')
    const screen = render(() => (
      <Select
        items={[
          { label: 'Empty', value: '' },
          { label: 'One', value: 1 },
        ]}
        value={value()}
        onChange={setValue}
      />
    ))
    const displayed = () =>
      screen.container.querySelector('[data-slot="select-value"]')?.textContent
    expect(displayed()).toBe('missing')
    setValue('')
    expect(displayed()).toBe('Empty')
    setValue(1)
    expect(displayed()).toBe('One')
  })

  test('treats a selected empty string as present for required validation', () => {
    const screen = render(() => (
      <form>
        <Select
          name="choice"
          required
          items={[{ label: 'Explicit empty value', value: '' }]}
          value=""
        />
      </form>
    ))
    const form = screen.container.querySelector('form')!
    expect(form.checkValidity()).toBe(true)
    expect(new FormData(form).getAll('choice')).toEqual([''])
  })

  test('preserves grouped rows and disabled items', () => {
    render(() => (
      <Select
        defaultOpen
        items={[
          { type: 'group', label: 'Fruit', items: ITEMS },
          { type: 'group', label: 'Empty', items: [] },
        ]}
      />
    ))
    expect(within(document.body).getByRole('group').textContent).toContain('Fruit')
    expect(within(document.body).getAllByRole('option', { hidden: true })).toHaveLength(3)
    expect(
      within(document.body)
        .getByRole('option', { hidden: true, name: 'Cherry' })
        .getAttribute('aria-disabled'),
    ).toBe('true')
  })

  test('keeps the trigger structure while loading', () => {
    const screen = render(() => <Select items={ITEMS} defaultValue="apple" allowClear loading />)
    expect(screen.getByRole('combobox')).toBeTruthy()
    expect(screen.container.querySelector('[data-loading]')).toBeTruthy()
    expect(screen.container.querySelector('[data-slot="select-clear"]')).toBeNull()
  })

  test('exposes loading state on the trailing slot', () => {
    const [loading, setLoading] = createSignal(false)
    const screen = render(() => <Select items={ITEMS} loading={loading()} />)
    const trailing = screen.container.querySelector('[data-slot="select-trailing"]')!
    expect(trailing).not.toBeNull()
    expect(trailing.hasAttribute('data-loading')).toBe(false)
    setLoading(true)
    expect(screen.container.querySelector('[data-slot="select-trailing"]')).toBe(trailing)
    expect(trailing.hasAttribute('data-loading')).toBe(true)
    setLoading(false)
    expect(trailing.hasAttribute('data-loading')).toBe(false)
  })

  test('keeps the loading spinner class on its icon without a theme', () => {
    const screen = baseRender(() => <Select items={ITEMS} loading />)
    const icon = screen.container.querySelector<HTMLElement>('[data-loading]')!
    expect(icon.classList).toContain('data-loading:animate-spin')
  })

  test('forwards shared content behavior through the reactive local props proxy', async () => {
    const scrollToItem = vi.fn()
    const onScrollBottom = vi.fn()
    const screen = render(() => (
      <Select
        items={ITEMS}
        defaultOpen
        itemRender={(state) => `Rendered ${state.item.label}`}
        itemProps={() => ({ 'data-item-prop': '' })}
        listboxProps={{ 'data-testid': 'forwarded-listbox' }}
        virtualRender={(context) => (
          <For each={context.entries}>
            {(entry, index) => <>{context.render(entry, index())}</>}
          </For>
        )}
        scrollToItem={scrollToItem}
        onScrollBottom={onScrollBottom}
        scrollBottomThreshold={7}
        gutter={8}
        overflowPadding={12}
      />
    ))
    const listbox = within(document.body).getByTestId('forwarded-listbox')
    const first = within(document.body).getAllByRole('option', { hidden: true })[0]!
    expect(first.textContent).toBe('Rendered Apple')
    expect(first.getAttribute('data-item-prop')).toBe('')
    await Promise.resolve()
    expect(scrollToItem).toHaveBeenCalledWith(ITEMS[0], 0)
    Object.defineProperties(listbox, {
      scrollTop: { configurable: true, value: 73 },
      clientHeight: { configurable: true, value: 20 },
      scrollHeight: { configurable: true, value: 100 },
    })
    fireEvent.scroll(listbox)
    expect(onScrollBottom).toHaveBeenCalledOnce()
    expect(screen.getByRole('combobox').getAttribute('aria-expanded')).toBe('true')
  })

  test('serializes and resets one logical value', async () => {
    const screen = render(() => (
      <form>
        <Select name="fruit" items={ITEMS} defaultValue="apple" defaultOpen />
      </form>
    ))
    fireEvent.click(within(document.body).getAllByRole('option', { hidden: true })[1]!)
    const form = screen.container.querySelector('form')!
    expect(new FormData(form).getAll('fruit')).toEqual(['banana'])
    form.reset()
    await Promise.resolve()
    expect(new FormData(form).getAll('fruit')).toEqual(['apple'])
  })

  test('updates Form.Field and shows a placeholder for a null selection', () => {
    const { screen, value: form } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({
            choice: v.pipe(
              v.nullable(v.string()),
              v.check((value): value is string => value !== null, 'Choose a fruit'),
            ),
          }),
          initialInput: { choice: null },
          validate: 'input',
        }),
      (form) => (
        <MoraineProvider>
          <form.Form>
            <form.Field name="choice" label="Choice">
              <Select items={ITEMS} placeholder="Choose a fruit" defaultOpen />
            </form.Field>
          </form.Form>
        </MoraineProvider>
      ),
    )

    expect(screen.container.querySelector('[data-slot="select-value"]')?.textContent).toBe(
      'Choose a fruit',
    )
    fireEvent.click(within(document.body).getByRole('option', { hidden: true, name: 'Banana' }))
    expect(getInput(form)).toEqual({ choice: 'banana' })
    expect(screen.container.querySelector('[data-slot="select-value"]')?.textContent).toBe('Banana')
  })

  test('keeps falsey and null Form.Field values scalar through changes and reset', async () => {
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
              <Select
                items={[
                  { label: 'Empty', value: '' },
                  { label: 'Zero', value: 0 },
                ]}
                allowClear
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
    fireEvent.click(screen.container.querySelector<HTMLElement>('[data-slot="select-clear"]')!)
    expect(getInput(form)).toEqual({ choice: null })
    fireEvent.click(within(document.body).getByRole('option', { hidden: true, name: 'Zero' }))
    expect(getInput(form)).toEqual({ choice: 0 })
    screen.container.querySelector('form')!.reset()
    await Promise.resolve()
    expect(getInput(form)).toEqual({ choice: null })
  })

  test('synchronizes controlled scalar Form.Field values without array projection', () => {
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
            <Select
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

  test('keeps keyboard focus styling on the trigger without parent focus state', () => {
    const screen = render(() => <Select items={ITEMS} />)
    const control = screen.container.querySelector('[data-slot="select-control"]')!
    const trigger = screen.getByRole('combobox')

    expect(trigger.tagName).toBe('BUTTON')
    expect(trigger.className).toContain('focus-visible:after:')
    expect(control.hasAttribute('data-focus-visible')).toBe(false)

    trigger.focus()
    expect(document.activeElement).toBe(trigger)
  })
})

test('selects, submits, clears, and resets string shorthand values', async () => {
  const onChange = vi.fn()
  const screen = render(() => (
    <form>
      <Select
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
  fireEvent.click(screen.container.querySelector<HTMLElement>('[data-slot="select-clear"]')!)
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
    <Select<string | typeof object>
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

test('supports typeahead with string shorthand', () => {
  const onChange = vi.fn()
  const screen = render(() => <Select items={['Apple', 'Banana']} onChange={onChange} />)
  fireEvent.keyDown(screen.getByRole('combobox'), { key: 'b' })
  expect(onChange).toHaveBeenLastCalledWith('Banana')
})
