import { getInput, setInput } from '@formisch/solid'
import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { For, createComponent, createSignal } from 'solid-js'
import { hydrate } from 'solid-js/web'
import * as v from 'valibot'
import { describe, expect, test, vi } from 'vitest'

import { renderWithOwner } from '../../test-utils/owner-render.tsx'
import { installHydrationState, renderSsrFixture } from '../../test-utils/ssr-test.ts'
import { FormField } from '../form-field/index.ts'
import { createForm, Form } from '../form/index.ts'

import { MultiSelect } from './multi-select.tsx'
import type { MultiSelectProps, MultiSelectT } from './multi-select.tsx'

const FRUITS: MultiSelectT.Item[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry', disabled: true },
]

function queryBody(selector: string): Element | null {
  return document.body.querySelector(selector)
}

function queryAllBody(selector: string): NodeListOf<Element> {
  return document.body.querySelectorAll(selector)
}

async function finishSelectExitMotion(): Promise<void> {
  const contents = Array.from(
    document.body.querySelectorAll('[data-slot="content"]'),
  ) as HTMLElement[]

  await Promise.all(
    contents.map(async (content) => {
      await fireEvent.animationEnd(content)
      await fireEvent.transitionEnd(content)
    }),
  )
}

describe('MultiSelect', () => {
  test('accepts arbitrary root props at type level', () => {
    const props: MultiSelectProps = { options: FRUITS, highlight: true }

    expect(props).toBeDefined()
  })

  test('renders tags for selected values', () => {
    const screen = render(() => <MultiSelect options={FRUITS} value={['apple', 'banana']} />)

    const tags = screen.container.querySelectorAll('[data-slot="tag"]')
    expect(tags.length).toBe(2)
  })

  test('keeps tag and FormData order stable when options reorder', () => {
    const [options, setOptions] = createSignal(FRUITS)
    const screen = render(() => (
      <form>
        <MultiSelect name="fruits" options={options()} value={['banana', 'apple']} />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const tagTitles = () =>
      Array.from(screen.container.querySelectorAll('[data-slot="tag"]')).map((tag) =>
        tag.getAttribute('title'),
      )

    expect(tagTitles()).toEqual(['Banana', 'Apple'])
    expect(new FormData(form).getAll('fruits')).toEqual(['banana', 'apple'])

    setOptions([FRUITS[1]!, FRUITS[0]!, FRUITS[2]!])

    expect(tagTitles()).toEqual(['Banana', 'Apple'])
    expect(new FormData(form).getAll('fruits')).toEqual(['banana', 'apple'])
  })

  test('preserves missing selected values in tags, callbacks, and public order', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <form>
        <MultiSelect
          name="fruits"
          options={FRUITS}
          defaultValue={['apple', 'dragonfruit']}
          defaultOpen
          onChange={onChange}
        />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement

    expect(
      Array.from(screen.container.querySelectorAll('[data-slot="tag"]')).map((tag) =>
        tag.getAttribute('title'),
      ),
    ).toEqual(['Apple', 'dragonfruit'])
    expect(new FormData(form).getAll('fruits')).toEqual(['apple', 'dragonfruit'])

    await fireEvent.click(queryAllBody('[data-slot="item"]')[1]!)

    expect(onChange).toHaveBeenCalledWith(['apple', 'dragonfruit', 'banana'])
  })

  test('deduplicates typed values with Object.is identity at every ingress', () => {
    const screen = render(() => (
      <form>
        <MultiSelect<string | number>
          name="choices"
          options={[
            { label: 'Numeric one', value: 1 },
            { label: 'String one', value: '1' },
            { label: 'Numeric two', value: 2 },
          ]}
          defaultValue={[1, '1', 1, '1']}
          maxCount={2}
          defaultOpen
        />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const items = Array.from(queryAllBody('[data-slot="item"]'))

    expect(screen.container.querySelectorAll('[data-slot="tag"]')).toHaveLength(2)
    expect(items.map((item) => item.getAttribute('aria-selected'))).toEqual([
      'true',
      'true',
      'false',
    ])
    expect(items[2]?.getAttribute('aria-disabled')).toBe('true')
    expect(new FormData(form).getAll('choices')).toEqual(['1', '1'])
  })

  test('labels tag removal, preserves input focus, and removes once', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <MultiSelect search options={FRUITS} value={['apple']} onChange={onChange} />
    ))
    const input = screen.getByRole('combobox') as HTMLInputElement
    const remove = screen.getByRole('button', { name: 'Remove Apple' })
    input.focus()

    const pointerDown = new PointerEvent('pointerdown', { bubbles: true, cancelable: true })
    remove.dispatchEvent(pointerDown)
    await fireEvent.click(remove)

    expect(pointerDown.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(input)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith([])
  })

  test('keeps tag removal inert when the multi-select is disabled', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <MultiSelect options={FRUITS} value={['apple']} disabled onChange={onChange} />
    ))
    const tag = screen.container.querySelector('[data-slot="tag"]')!

    expect(tag.querySelector('button')).toBeNull()
    await fireEvent.click(tag.querySelector('[data-slot="tagRemove"]')!)
    expect(onChange).not.toHaveBeenCalled()
  })

  test('focuses the input when the selected tag label is pressed', () => {
    const screen = render(() => <MultiSelect search options={FRUITS} value={['apple']} />)
    const input = screen.getByRole('combobox') as HTMLInputElement
    const label = screen.container.querySelector('[data-slot="tag"] [data-slot="label"]')!

    label.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }))

    expect(document.activeElement).toBe(input)
  })

  test('removes the last selected value with Backspace from an empty input', () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <MultiSelect search options={FRUITS} defaultValue={['apple', 'banana']} onChange={onChange} />
    ))
    const input = screen.getByRole('combobox') as HTMLInputElement
    input.focus()
    input.setSelectionRange(0, 0)
    const event = new KeyboardEvent('keydown', {
      key: 'Backspace',
      bubbles: true,
      cancelable: true,
    })

    input.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(input)
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith(['apple'])
    expect(
      Array.from(screen.container.querySelectorAll('[data-slot="tag"]')).map((tag) =>
        tag.getAttribute('title'),
      ),
    ).toEqual(['Apple'])
  })

  test('does not remove tags for text edits, ranges, Delete, or disabled input', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <MultiSelect search options={FRUITS} defaultValue={['apple', 'banana']} onChange={onChange} />
    ))
    const input = screen.getByRole('combobox') as HTMLInputElement

    await fireEvent.input(input, { target: { value: 'query' } })
    input.setSelectionRange(0, 5)
    await fireEvent.keyDown(input, { key: 'Backspace' })
    await fireEvent.input(input, { target: { value: '' } })
    input.setSelectionRange(0, 0)
    await fireEvent.keyDown(input, { key: 'Delete' })

    expect(onChange).not.toHaveBeenCalled()

    screen.unmount()
    const disabledOnChange = vi.fn()
    const disabledScreen = render(() => (
      <MultiSelect
        search
        disabled
        options={FRUITS}
        defaultValue={['apple', 'banana']}
        onChange={disabledOnChange}
      />
    ))
    const disabledInput = disabledScreen.getByRole('combobox') as HTMLInputElement
    disabledInput.setSelectionRange(0, 0)
    await fireEvent.keyDown(disabledInput, { key: 'Backspace' })

    expect(disabledOnChange).not.toHaveBeenCalled()
  })

  test('removes a missing last selected value with Backspace', () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <MultiSelect
        search
        options={FRUITS}
        defaultValue={['apple', 'dragonfruit']}
        onChange={onChange}
      />
    ))
    const input = screen.getByRole('combobox') as HTMLInputElement
    input.setSelectionRange(0, 0)

    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }),
    )

    expect(onChange).toHaveBeenCalledWith(['apple'])
  })

  test('calls onChange with array of values', async () => {
    const onChange = vi.fn()
    render(() => <MultiSelect options={FRUITS} defaultOpen onChange={onChange} />)

    const items = queryAllBody('[data-slot="item"]')
    await fireEvent.click(items[0]!)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith(['apple'])
  })

  test('restores rejected controlled arrays in tags, FormField, and native state', async () => {
    const onChange = vi.fn()
    const { screen, value: form } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ fruits: v.array(v.string()) }),
          initialInput: { fruits: ['apple'] },
        }),
      (form) => (
        <Form of={form}>
          <FormField name="fruits" label="Fruits">
            <MultiSelect options={FRUITS} value={['apple']} defaultOpen onChange={onChange} />
          </FormField>
        </Form>
      ),
    )

    await fireEvent.click(queryAllBody('[data-slot="item"]')[1]!)

    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith(['apple', 'banana'])
    expect(
      Array.from(screen.container.querySelectorAll('[data-slot="tag"]')).map((tag) =>
        tag.getAttribute('title'),
      ),
    ).toEqual(['Apple'])
    expect(getInput(form)).toEqual({ fruits: ['apple'] })
  })

  test('commits a synchronously accepted controlled array once', async () => {
    const [value, setValue] = createSignal<Array<string | number>>(['apple'])
    const onChange = vi.fn((nextValue: Array<string | number>) => setValue(nextValue))
    const screen = render(() => (
      <MultiSelect options={FRUITS} value={value()} defaultOpen onChange={onChange} />
    ))

    await fireEvent.click(queryAllBody('[data-slot="item"]')[1]!)

    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith(['apple', 'banana'])
    expect(
      Array.from(screen.container.querySelectorAll('[data-slot="tag"]')).map((tag) =>
        tag.getAttribute('title'),
      ),
    ).toEqual(['Apple', 'Banana'])
  })

  test('reacts to external Formisch arrays without publishing callbacks', () => {
    const onChange = vi.fn()
    const { screen, value: form } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ fruits: v.array(v.string()) }),
          initialInput: { fruits: ['apple'] },
        }),
      (form) => (
        <Form of={form}>
          <FormField name="fruits" label="Fruits">
            <MultiSelect options={FRUITS} onChange={onChange} />
          </FormField>
        </Form>
      ),
    )

    setInput(form, { path: ['fruits'], input: ['banana', 'apple'] })

    expect(
      Array.from(screen.container.querySelectorAll('[data-slot="tag"]')).map((tag) =>
        tag.getAttribute('title'),
      ),
    ).toEqual(['Banana', 'Apple'])
    expect(onChange).not.toHaveBeenCalled()
  })

  test('forwards virtual rendering and scroll callbacks', async () => {
    const [entryIndex, setEntryIndex] = createSignal(0)
    const scrollToItem = vi.fn()
    const screen = render(() => (
      <MultiSelect
        options={FRUITS}
        defaultOpen
        scrollToItem={(item, index) => {
          scrollToItem(item, index)
          setEntryIndex(index)
        }}
        virtualRender={(context) => (
          <For each={[context.entries[entryIndex()]!]}>
            {(entry) => context.render(entry, entryIndex(), { 'data-index': entryIndex() })}
          </For>
        )}
      />
    ))
    const combobox = screen.container.querySelector('[data-slot="control"]') as HTMLElement
    combobox.focus()

    await fireEvent.keyDown(combobox, { key: 'ArrowDown' })

    await waitFor(() => {
      const item = queryBody('[data-slot="item"]')
      expect(queryAllBody('[data-slot="item"]').length).toBe(1)
      expect(item?.textContent).toContain('Banana')
      expect(item?.getAttribute('data-index')).toBe('1')
    })
    expect(scrollToItem).toHaveBeenLastCalledWith(FRUITS[1], 1)
    expect(document.activeElement).toBe(combobox)
  })

  test('respects maxCount limit', async () => {
    const onChange = vi.fn()
    render(() => (
      <MultiSelect
        options={FRUITS}
        defaultValue={['apple']}
        defaultOpen
        onChange={onChange}
        maxCount={1}
      />
    ))

    const items = queryAllBody('[data-slot="item"]')
    await fireEvent.click(items[1]!)

    expect(onChange).not.toHaveBeenCalled()
  })

  test('disables non-selected options when maxCount is reached', () => {
    render(() => <MultiSelect options={FRUITS} defaultOpen defaultValue={['apple']} maxCount={1} />)

    const items = queryAllBody('[data-slot="item"]')
    expect(items[0]?.getAttribute('aria-disabled')).toBeNull()
    expect(items[1]?.getAttribute('aria-disabled')).toBe('true')
    expect(items[2]?.getAttribute('aria-disabled')).toBe('true')
  })

  test('creates and selects tag from token separators', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <MultiSelect
        search
        options={FRUITS}
        tokenSeparators={[',']}
        onChange={onChange}
        placeholder="Type..."
      />
    ))

    const input = screen.getByRole('combobox') as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'custom,' } })

    expect(onChange).toHaveBeenCalledWith(['custom'])
    await waitFor(() => {
      expect(input.value).toBe('')
    })
  })

  test('keeps trailing token and emits onSearch remainder', async () => {
    const onChange = vi.fn()
    const onSearch = vi.fn()
    const screen = render(() => (
      <MultiSelect
        search
        options={FRUITS}
        tokenSeparators={[',']}
        onChange={onChange}
        onSearch={onSearch}
      />
    ))

    const input = screen.getByRole('combobox') as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'Apple,ba' } })

    expect(onChange).toHaveBeenCalledWith(['apple'])
    expect(onSearch).toHaveBeenLastCalledWith('ba')
    await waitFor(() => {
      expect(input.value).toBe('ba')
    })
  })

  test('treats multi-character token separators as literal alternatives', async () => {
    const onChange = vi.fn()
    const onSearch = vi.fn()
    const screen = render(() => (
      <MultiSelect
        search
        options={FRUITS}
        tokenSeparators={['::']}
        onChange={onChange}
        onSearch={onSearch}
      />
    ))
    const input = screen.getByRole('combobox') as HTMLInputElement

    await fireEvent.input(input, { target: { value: 'custom:value::Apple::tail' } })

    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith(['custom:value', 'apple'])
    expect(onSearch).toHaveBeenLastCalledWith('tail')
    expect(input.value).toBe('tail')
  })

  test('defers token commits until IME composition ends', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <MultiSelect search options={FRUITS} tokenSeparators={[',']} onChange={onChange} />
    ))
    const input = screen.getByRole('combobox') as HTMLInputElement

    await fireEvent.compositionStart(input)
    await fireEvent.input(input, { target: { value: 'custom,' } })

    expect(onChange).not.toHaveBeenCalled()
    expect(input.value).toBe('custom,')

    await fireEvent.compositionEnd(input)

    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith(['custom'])
    expect(input.value).toBe('')
  })

  test('respects maxCount when processing token separators', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <MultiSelect
        search
        options={FRUITS}
        tokenSeparators={[',']}
        defaultValue={['apple']}
        maxCount={1}
        onChange={onChange}
      />
    ))

    const input = screen.getByRole('combobox') as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'banana,' } })

    expect(onChange).not.toHaveBeenCalled()
    await waitFor(() => {
      expect(input.value).toBe('')
    })
  })

  test('creates tag on Enter when allowCreate is true', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <MultiSelect search options={FRUITS} defaultOpen allowCreate onChange={onChange} />
    ))

    const input = screen.getByRole('combobox') as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'Dragonfruit' } })
    await fireEvent.keyDown(input, { key: 'Enter' })

    expect(onChange).toHaveBeenCalledWith(['Dragonfruit'])
    expect(input.value).toBe('')
  })

  test('does not create tag on Enter when maxCount is reached', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <MultiSelect
        search
        options={FRUITS}
        defaultOpen
        allowCreate
        defaultValue={['apple']}
        maxCount={1}
        onChange={onChange}
      />
    ))

    const input = screen.getByRole('combobox') as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'Dragonfruit' } })
    await fireEvent.keyDown(input, { key: 'Enter' })

    expect(onChange).not.toHaveBeenCalled()
    expect(input.value).toBe('Dragonfruit')
  })

  test('does not create tag on Enter when allowCreate is false', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <MultiSelect search options={FRUITS} defaultOpen onChange={onChange} />
    ))

    const input = screen.getByRole('combobox') as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'Dragonfruit' } })
    await fireEvent.keyDown(input, { key: 'Enter' })

    expect(onChange).not.toHaveBeenCalled()
    expect(input.value).toBe('Dragonfruit')
  })

  test('does not select existing option on Enter when maxCount is reached', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <MultiSelect
        search
        options={FRUITS}
        defaultOpen
        defaultValue={['apple']}
        maxCount={1}
        onChange={onChange}
      />
    ))

    const input = screen.getByRole('combobox') as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'Banana' } })
    await fireEvent.keyDown(input, { key: 'Enter' })

    expect(onChange).not.toHaveBeenCalled()
    expect(input.value).toBe('Banana')
  })

  test('does not select disabled option on Enter', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <MultiSelect search options={FRUITS} defaultOpen onChange={onChange} />
    ))

    const input = screen.getByRole('combobox') as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'Cherry' } })
    await fireEvent.keyDown(input, { key: 'Enter' })

    expect(onChange).not.toHaveBeenCalled()
    expect(input.value).toBe('Cherry')
  })

  test('shows +N overflow when maxTagCount is reached', () => {
    const screen = render(() => (
      <MultiSelect options={FRUITS} value={['apple', 'banana']} maxTagCount={1} />
    ))

    const tags = screen.container.querySelectorAll('[data-slot="tag"]')
    const overflow = screen.container.querySelector('[data-slot="tagOverflow"]')
    expect(tags.length).toBe(1)
    expect(overflow?.textContent).toContain('+1')
  })

  test('opens dropdown and focuses combobox when control shell is clicked', async () => {
    const screen = render(() => <MultiSelect options={FRUITS} placeholder="Pick fruits" />)
    const control = screen.container.querySelector('[data-slot="control"]') as HTMLElement
    const combobox = screen.container.querySelector('input[role="combobox"]') as HTMLElement

    await fireEvent.pointerDown(control, { button: 0 })
    await fireEvent.click(control)

    await waitFor(() => {
      expect(queryBody('[data-slot="content"]')).not.toBeNull()
    })

    expect(document.activeElement).toBe(combobox)
  })

  test('non-search control does not show focus ring on pointer click', async () => {
    const screen = render(() => <MultiSelect options={FRUITS} placeholder="Pick fruits" />)
    const control = screen.container.querySelector('[data-slot="control"]') as HTMLElement

    await fireEvent.pointerDown(control, { button: 0 })
    await fireEvent.click(control)

    expect(control.className).toContain('focus-visible:effect-fv-border')
    expect(control.className).not.toContain('focus-within:effect-fv-border')
  })

  test('non-search control uses focus-visible ring styling for keyboard focus', () => {
    const screen = render(() => <MultiSelect options={FRUITS} placeholder="Pick fruits" />)
    const control = screen.container.querySelector('[data-slot="control"]') as HTMLElement

    control.focus()

    expect(document.activeElement).toBe(control)
    expect(control.className).toContain('focus-visible:effect-fv-border')
  })

  test('searchable control keeps focus-within ring styling', () => {
    const screen = render(() => <MultiSelect options={FRUITS} search placeholder="Pick fruits" />)
    const control = screen.container.querySelector('[data-slot="control"]') as HTMLElement

    expect(control.className).toContain('focus-within:effect-fv-border')
    expect(control.className).not.toContain('focus:effect-fv-border')
  })

  test('after trigger click, ArrowDown selects the first option', async () => {
    const onChange = vi.fn()
    const screen = render(() => <MultiSelect options={FRUITS} onChange={onChange} />)
    const trigger = screen.container.querySelector('[data-slot="trigger"]') as HTMLElement

    await fireEvent.click(trigger)
    await waitFor(() => {
      expect(queryBody('[data-slot="content"]')).not.toBeNull()
    })

    const control = screen.container.querySelector('[data-slot="control"]') as HTMLElement
    await fireEvent.keyDown(control, { key: 'ArrowDown' })
    await fireEvent.keyDown(control, { key: 'Enter' })

    expect(onChange).toHaveBeenCalledWith(['banana'])
  })

  test('renders non-search placeholder as presentation-only text', () => {
    const screen = render(() => <MultiSelect options={FRUITS} placeholder="Pick fruits" />)

    const input = screen.container.querySelector('[data-slot="input"]') as HTMLElement
    expect(input.tagName).toBe('INPUT')
    expect(input.getAttribute('readonly')).not.toBeNull()
    expect(input.getAttribute('tabindex')).toBe('-1')
    expect(screen.container.querySelector('[data-slot="control"]')).not.toBeNull()
  })

  test('when menu is open, Tab toggles focused item', async () => {
    const onChange = vi.fn()
    const screen = render(() => <MultiSelect options={FRUITS} search onChange={onChange} />)
    const input = screen.getByRole('combobox') as HTMLInputElement

    input.focus()
    await fireEvent.click(input)
    await waitFor(() => {
      expect(input.getAttribute('aria-expanded')).toBe('true')
    })

    await fireEvent.keyDown(input, { key: 'ArrowDown' })

    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    })
    input.dispatchEvent(tabEvent)

    expect(tabEvent.defaultPrevented).toBe(false)
    expect(onChange).not.toHaveBeenCalled()
  })

  test('non-search Tab leaves the multi-select and does not select', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <>
        <MultiSelect options={FRUITS} onChange={onChange} />
        <button type="button">Next</button>
      </>
    ))
    const control = screen.container.querySelector('[data-slot="control"]') as HTMLElement
    const nextButton = screen.getByRole('button', { name: 'Next' })

    control.focus()
    await fireEvent.click(control)
    await waitFor(() => {
      expect(control.getAttribute('aria-expanded')).toBe('true')
    })

    await fireEvent.keyDown(control, { key: 'ArrowDown' })
    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    })
    control.dispatchEvent(tabEvent)

    expect(tabEvent.defaultPrevented).toBe(false)
    nextButton.focus()
    expect(document.activeElement).toBe(nextButton)
    expect(onChange).not.toHaveBeenCalled()
  })

  test('space toggles the highlighted option when menu is open', async () => {
    const onChange = vi.fn()
    const screen = render(() => <MultiSelect options={FRUITS} onChange={onChange} />)
    const control = screen.container.querySelector('[data-slot="control"]') as HTMLElement

    await fireEvent.click(control)
    await waitFor(() => {
      expect(control.getAttribute('aria-expanded')).toBe('true')
    })

    await fireEvent.keyDown(control, { key: 'ArrowDown' })
    await fireEvent.keyDown(control, { key: ' ' })

    expect(onChange).toHaveBeenCalledWith(['banana'])
  })

  test('keeps the highlighted option until exit motion finishes', async () => {
    const screen = render(() => (
      <MultiSelect
        options={FRUITS}
        search
        defaultOpen
        defaultValue={['banana']}
        placeholder="Pick"
      />
    ))
    const input = screen.getByRole('combobox')

    await waitFor(() => {
      expect(queryBody('[data-slot="item"][data-highlighted]')?.textContent).toContain('Banana')
    })

    await fireEvent.keyDown(input, { key: 'Escape' })

    await waitFor(() => {
      expect(queryBody('[data-slot="content"]')?.getAttribute('data-closed')).toBe('')
      expect(queryBody('[data-slot="item"][data-highlighted]')?.textContent).toContain('Banana')
    })

    await finishSelectExitMotion()

    await waitFor(() => {
      expect(queryBody('[data-slot="content"]')).toBeNull()
    })
  })

  test('passes null to optionRender for empty state', async () => {
    let receivedEmptyOption = false
    const screen = render(() => (
      <MultiSelect
        search
        options={FRUITS}
        defaultOpen
        optionRender={(props) => {
          receivedEmptyOption = props.option === null
          return <div data-testid="empty">Empty</div>
        }}
      />
    ))

    const input = screen.getByRole('combobox') as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'xyznonexistent' } })

    await waitFor(() => {
      expect(receivedEmptyOption).toBe(true)
      expect(queryBody('[data-testid="empty"]')).not.toBeNull()
    })
  })

  test('renders default "No options" fallback when search has no matches', async () => {
    const screen = render(() => (
      <MultiSelect search options={FRUITS} defaultOpen placeholder="Search..." />
    ))

    const input = screen.getByRole('combobox') as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'xyznonexistent' } })

    await waitFor(() => {
      const emptyNode = queryBody('[data-slot="empty"]')
      expect(emptyNode).not.toBeNull()
      expect(emptyNode?.textContent).toBe('No options')
    })
  })

  test('uses tagRender for custom tag rendering', () => {
    const screen = render(() => (
      <MultiSelect
        options={FRUITS}
        value={['apple']}
        tagRender={(props) => (
          <span data-testid="custom-tag">
            {props.option.label}
            <button onClick={props.onClose}>x</button>
          </span>
        )}
      />
    ))

    expect(screen.getByTestId('custom-tag')).not.toBeNull()
  })

  test('resolves JSX-capable getters once and keeps closed popup trees lazy', async () => {
    const reads = {
      optionRender: 0,
      tagRender: 0,
      labelRender: 0,
      emptyRender: 0,
      leadingIcon: 0,
      loadingIcon: 0,
      trailingIcon: 0,
      closeIcon: 0,
    }
    const instances = { option: 0, tag: 0, empty: 0 }
    const screen = render(() =>
      createComponent(MultiSelect, {
        options: FRUITS,
        defaultValue: ['apple'],
        loading: true,
        get optionRender() {
          reads.optionRender += 1
          return (props: MultiSelectT.OptionRenderProps) => {
            instances.option += 1
            return <span>{props.option?.label}</span>
          }
        },
        get tagRender() {
          reads.tagRender += 1
          return (props: MultiSelectT.TagRenderProps) => {
            instances.tag += 1
            return <span data-testid="getter-tag">{props.option.label}</span>
          }
        },
        get labelRender() {
          reads.labelRender += 1
          return (props: MultiSelectT.LabelRenderProps) => <span>{props.option.label}</span>
        },
        get emptyRender() {
          reads.emptyRender += 1
          return () => {
            instances.empty += 1
            return <span>Empty</span>
          }
        },
        get leadingIcon() {
          reads.leadingIcon += 1
          return 'icon-search' as const
        },
        get loadingIcon() {
          reads.loadingIcon += 1
          return 'icon-loading' as const
        },
        get trailingIcon() {
          reads.trailingIcon += 1
          return 'icon-chevron-down' as const
        },
        get closeIcon() {
          reads.closeIcon += 1
          return 'icon-close' as const
        },
      }),
    )

    expect(instances).toEqual({ option: 0, tag: 1, empty: 0 })
    expect(Object.values(reads)).toEqual([1, 1, 1, 1, 1, 1, 1, 1])

    await fireEvent.click(screen.container.querySelector('[data-slot="control"]')!)

    expect(queryAllBody('[data-slot="item"]')).toHaveLength(3)
    expect(instances).toEqual({ option: 3, tag: 1, empty: 0 })
    expect(Object.values(reads)).toEqual([1, 1, 1, 1, 1, 1, 1, 1])
  })

  test('hydrates in place, removes a tag, and opens on the first ArrowDown', async () => {
    const markup = renderSsrFixture(
      '/src/forms/select/multi-select.ssr.fixture.tsx',
      'renderMultiSelectFixture',
    )
    const container = document.createElement('div')
    container.innerHTML = markup
    document.body.append(container)
    const serverRoot = container.querySelector('[data-slot="root"]')
    const serverControl = container.querySelector('[data-slot="control"]')
    const serverTag = container.querySelector('[data-slot="tag"]')
    const serverNativeSelect = container.querySelector('select[name="fruits"]')
    const reads = {
      options: 0,
      label: 0,
      description: 0,
      optionRender: 0,
      tagRender: 0,
      labelRender: 0,
      emptyRender: 0,
      leadingIcon: 0,
      loadingIcon: 0,
      trailingIcon: 0,
      closeIcon: 0,
    }
    const onChange = vi.fn()
    const restoreHydrationState = installHydrationState()

    const dispose = hydrate(
      () =>
        createComponent(MultiSelect, {
          id: 'fruits',
          name: 'fruits',
          search: true,
          defaultValue: ['apple'],
          onChange,
          get options() {
            reads.options += 1
            return [
              {
                value: 'apple',
                get label() {
                  reads.label += 1
                  return 'Apple'
                },
                get description() {
                  reads.description += 1
                  return 'Crisp'
                },
              },
              {
                value: 'banana',
                get label() {
                  reads.label += 1
                  return 'Banana'
                },
                get description() {
                  reads.description += 1
                  return 'Sweet'
                },
              },
            ]
          },
          get optionRender() {
            reads.optionRender += 1
            return (props: MultiSelectT.OptionRenderProps) => <span>{props.option?.label}</span>
          },
          get tagRender() {
            reads.tagRender += 1
            return undefined
          },
          get labelRender() {
            reads.labelRender += 1
            return undefined
          },
          get emptyRender() {
            reads.emptyRender += 1
            return undefined
          },
          get leadingIcon() {
            reads.leadingIcon += 1
            return 'icon-search' as const
          },
          get loadingIcon() {
            reads.loadingIcon += 1
            return 'icon-loading' as const
          },
          get trailingIcon() {
            reads.trailingIcon += 1
            return 'icon-chevron-down' as const
          },
          get closeIcon() {
            reads.closeIcon += 1
            return 'icon-close' as const
          },
        }),
      container,
    )
    const root = container.querySelector('[data-slot="root"]')
    const control = container.querySelector('[data-slot="control"]')
    const tag = container.querySelector('[data-slot="tag"]')
    const nativeSelect = container.querySelector('select[name="fruits"]')
    const input = container.querySelector('[role="combobox"]') as HTMLInputElement

    expect(root).toBe(serverRoot)
    expect(control).toBe(serverControl)
    expect(tag).toBe(serverTag)
    expect(nativeSelect).toBe(serverNativeSelect)
    expect(input.getAttribute('aria-expanded')).toBe('false')
    expect(reads).toEqual({
      options: 1,
      label: 2,
      description: 2,
      optionRender: 1,
      tagRender: 1,
      labelRender: 1,
      emptyRender: 1,
      leadingIcon: 1,
      loadingIcon: 1,
      trailingIcon: 1,
      closeIcon: 1,
    })

    await fireEvent.click(container.querySelector('[aria-label="Remove Apple"]')!)

    expect(container.querySelector('[data-slot="tag"]')).toBeNull()
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith([])

    await fireEvent.keyDown(input, { key: 'ArrowDown' })

    expect(input.getAttribute('aria-expanded')).toBe('true')
    expect(queryAllBody('[data-slot="item"]')).toHaveLength(2)
    expect(queryBody('[data-slot="item"][data-highlighted]')?.textContent).toContain('Banana')
    expect(Object.values(reads)).toEqual([1, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1])

    dispose()
    container.remove()
    restoreHydrationState()
  }, 20_000)

  test('types onChange payload as array', () => {
    const onChange: NonNullable<MultiSelectProps['onChange']> = (value) => {
      const values: Array<string | number> = value
      expect(Array.isArray(values)).toBe(true)
    }

    onChange(['apple'])
  })

  test('serializes selected values as repeated same-name entries in selection order', async () => {
    const screen = render(() => (
      <form>
        <MultiSelect name="fruits" options={FRUITS} defaultOpen />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const items = queryAllBody('[data-slot="item"]')

    await fireEvent.click(items[1]!)
    await fireEvent.click(items[0]!)

    expect(new FormData(form).getAll('fruits')).toEqual(['banana', 'apple'])
    expect(form.querySelectorAll('select[name="fruits"]')).toHaveLength(1)
  })

  test('serializes matched, missing, numeric, and string values in public order', () => {
    const screen = render(() => (
      <form>
        <MultiSelect<string | number>
          name="choices"
          options={[
            { label: 'Numeric one', value: 1 },
            { label: 'String one', value: '1' },
            { label: 'Numeric two', value: 2 },
          ]}
          defaultValue={[2, 'missing', 1, '1']}
        />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement

    expect(
      Array.from(screen.container.querySelectorAll('[data-slot="tag"]')).map((tag) =>
        tag.getAttribute('title'),
      ),
    ).toEqual(['Numeric two', 'missing', 'Numeric one', 'String one'])
    expect(new FormData(form).getAll('choices')).toEqual(['2', 'missing', '1', '1'])
  })

  test('uses selected values for required validity and serializes created tags', async () => {
    const screen = render(() => (
      <form>
        <MultiSelect name="fruits" options={FRUITS} required search allowCreate />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const input = screen.getByRole('combobox') as HTMLInputElement
    const nativeSelect = form.querySelector('select[name="fruits"]') as HTMLSelectElement

    expect(nativeSelect.multiple).toBe(true)
    expect(Array.from(nativeSelect.selectedOptions)).toHaveLength(0)
    expect(form.checkValidity()).toBe(false)
    expect(input.name).toBe('')
    expect(input.required).toBe(false)
    await fireEvent.input(input, { target: { value: 'dragonfruit' } })
    await fireEvent.keyDown(input, { key: 'Enter' })

    expect(form.checkValidity()).toBe(true)
    expect(new FormData(form).getAll('fruits')).toEqual(['dragonfruit'])
  })

  test('omits disabled fields from native form data', () => {
    const screen = render(() => (
      <form>
        <MultiSelect name="fruits" options={FRUITS} defaultValue={['apple']} disabled />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement

    expect(new FormData(form).has('fruits')).toBe(false)
  })

  test('shows clear action instead of loading icon when selection is not empty', () => {
    const screen = render(() => (
      <MultiSelect options={FRUITS} value={['apple']} loading allowClear placeholder="Pick" />
    ))

    const action = screen.container.querySelector('[data-slot="clear"]') as HTMLElement | null
    expect(action).not.toBeNull()
    expect(action?.getAttribute('aria-label')).toBe('Clear selection')
    expect(action?.querySelector('[data-slot="icon"]')?.className).toContain('icon-close')
    expect(action?.querySelector('[data-slot="icon"]')?.className).not.toContain('icon-loading')
    expect(action?.className).toContain('hover:bg-muted-hover')
  })

  test('aligns control padding with the tag gap and removes trigger hover background', () => {
    const screen = render(() => (
      <MultiSelect options={FRUITS} size="md" leadingIcon="icon-search" placeholder="Pick" />
    ))
    const control = screen.container.querySelector('[data-slot="control"]') as HTMLElement
    const tagsContainer = screen.container.querySelector(
      '[data-slot="tagsContainer"]',
    ) as HTMLElement
    const leading = screen.container.querySelector('[data-slot="leading"]') as HTMLElement
    const trigger = screen.container.querySelector('[data-slot="trigger"]') as HTMLElement

    expect(control.className).toContain('px-1.5')
    expect(control.className).toContain('gap-1.5')
    expect(tagsContainer.className).not.toContain('px-2.5')
    expect(leading.className).not.toContain('ms-')
    expect(trigger.className).not.toContain('hover:bg-muted-hover')
  })

  test('sizes tag and input rows from their content', () => {
    const screen = render(() => <MultiSelect options={FRUITS} value={['apple', 'banana']} />)
    const tag = screen.container.querySelector('[data-slot="tag"]') as HTMLElement
    const tagRemove = screen.container.querySelector('[data-slot="tagRemove"]') as HTMLElement
    const input = screen.container.querySelector('[data-slot="input"]') as HTMLInputElement

    expect(tag.className).not.toContain('h-5.5')
    expect(tag.className).toContain('text-sm')
    expect(tag.className).toContain('leading-tight')
    expect(tagRemove.className).toContain('p-0.5')
    expect(tagRemove.querySelector('[data-slot="icon"]')?.className).toContain('size-[1.25em]')
    expect(input.className).not.toContain('h-6')
    expect(input.className).not.toContain('leading-$s-m')
    expect(input.className).toContain('text-sm')
    expect(input.className).toContain('leading-tight')
    expect(input.className).toContain('py-0.5')
  })

  test('scales tags and inputs by size', () => {
    const screen = render(() => (
      <>
        <MultiSelect options={FRUITS} size="sm" value={['apple']} />
        <MultiSelect options={FRUITS} size="md" value={['apple']} />
        <MultiSelect options={FRUITS} size="lg" value={['apple']} />
      </>
    ))
    const tags = Array.from(screen.container.querySelectorAll('[data-slot="tag"]'))
    const inputs = Array.from(screen.container.querySelectorAll('[data-slot="input"]'))

    expect(tags[0]?.className).toContain('text-xs')
    expect(tags[1]?.className).toContain('text-sm')
    expect(tags[2]?.className).toContain('text-base')
    expect(inputs[0]?.className).toContain('text-xs')
    expect(inputs[1]?.className).toContain('text-sm')
    expect(inputs[2]?.className).toContain('text-base')
  })

  test('clears a non-empty default selection instead of restoring it', async () => {
    const onChange = vi.fn()
    const onClear = vi.fn()
    const screen = render(() => (
      <form>
        <MultiSelect
          name="fruits"
          options={FRUITS}
          search
          defaultOpen
          defaultValue={['apple']}
          defaultSearchValue="query"
          allowClear
          onChange={onChange}
          onClear={onClear}
        />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const input = screen.getByRole('combobox') as HTMLInputElement

    await fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }))

    expect(screen.container.querySelectorAll('[data-slot="tag"]')).toHaveLength(0)
    expect(input.value).toBe('')
    expect(input.getAttribute('aria-expanded')).toBe('false')
    expect(new FormData(form).getAll('fruits')).toEqual([])
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith([])
    expect(onClear).toHaveBeenCalledOnce()
  })

  test('restores a rejected controlled clear in tags and native state', async () => {
    const onChange = vi.fn()
    const onClear = vi.fn()
    const screen = render(() => (
      <form>
        <MultiSelect
          name="fruits"
          options={FRUITS}
          value={['apple']}
          allowClear
          onChange={onChange}
          onClear={onClear}
        />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement

    await fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }))

    expect(screen.container.querySelectorAll('[data-slot="tag"]')).toHaveLength(1)
    expect(new FormData(form).getAll('fruits')).toEqual(['apple'])
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith([])
    expect(onClear).toHaveBeenCalledOnce()
  })

  test('commits a synchronously accepted controlled clear once', async () => {
    const [value, setValue] = createSignal<Array<string | number>>(['apple'])
    const onChange = vi.fn((nextValue: Array<string | number>) => setValue(nextValue))
    const onClear = vi.fn()
    const screen = render(() => (
      <MultiSelect
        options={FRUITS}
        value={value()}
        allowClear
        onChange={onChange}
        onClear={onClear}
      />
    ))

    await fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }))

    expect(screen.container.querySelectorAll('[data-slot="tag"]')).toHaveLength(0)
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith([])
    expect(onClear).toHaveBeenCalledOnce()
  })

  test('does not publish a no-op token batch', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <MultiSelect
        search
        options={FRUITS}
        defaultValue={['apple']}
        tokenSeparators={[',']}
        onChange={onChange}
      />
    ))
    const input = screen.getByRole('combobox') as HTMLInputElement

    await fireEvent.input(input, { target: { value: 'Apple,Apple,Cherry,' } })

    expect(onChange).not.toHaveBeenCalled()
    expect(input.value).toBe('')
  })

  test('keeps tokenization inert while disabled', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <MultiSelect search disabled options={FRUITS} tokenSeparators={[',']} onChange={onChange} />
    ))
    const input = screen.getByRole('combobox') as HTMLInputElement

    await fireEvent.input(input, { target: { value: 'custom,' } })

    expect(onChange).not.toHaveBeenCalled()
    expect(screen.container.querySelectorAll('[data-slot="tag"]')).toHaveLength(0)
  })

  test('resets uncontrolled selection and created tags to the initial default snapshot', async () => {
    const [defaultValue, setDefaultValue] = createSignal<Array<string | number>>(['apple'])
    const onChange = vi.fn()
    const screen = render(() => (
      <form>
        <MultiSelect
          name="fruits"
          search
          options={FRUITS}
          defaultOpen
          defaultValue={defaultValue()}
          allowCreate
          onChange={onChange}
        />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const input = screen.getByRole('combobox') as HTMLInputElement

    setDefaultValue(['banana'])
    await fireEvent.input(input, { target: { value: 'Dragonfruit' } })
    await fireEvent.keyDown(input, { key: 'Enter' })
    expect(new FormData(form).getAll('fruits')).toEqual(['apple', 'Dragonfruit'])

    form.reset()
    await Promise.resolve()

    expect(
      Array.from(screen.container.querySelectorAll('[data-slot="tag"]')).map((tag) =>
        tag.getAttribute('title'),
      ),
    ).toEqual(['Apple'])
    expect(new FormData(form).getAll('fruits')).toEqual(['apple'])
    expect(input.value).toBe('')
    expect(
      Array.from(queryAllBody('[data-slot="item"]')).map((item) => item.textContent?.trim()),
    ).not.toContain('Dragonfruit')
    expect(onChange).toHaveBeenCalledOnce()
  })

  test('restores the latest explicit controlled array on reset without callbacks', async () => {
    const [value, setValue] = createSignal<Array<string | number>>(['apple'])
    const onChange = vi.fn()
    const screen = render(() => (
      <form>
        <MultiSelect name="fruits" options={FRUITS} value={value()} onChange={onChange} />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement

    setValue(['banana', 'apple'])
    form.reset()
    await Promise.resolve()

    expect(
      Array.from(screen.container.querySelectorAll('[data-slot="tag"]')).map((tag) =>
        tag.getAttribute('title'),
      ),
    ).toEqual(['Banana', 'Apple'])
    expect(new FormData(form).getAll('fruits')).toEqual(['banana', 'apple'])
    expect(onChange).not.toHaveBeenCalled()
  })

  test('keeps the current selection when form reset is canceled', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <form onReset={(event) => event.preventDefault()}>
        <MultiSelect
          name="fruits"
          options={FRUITS}
          defaultValue={['apple']}
          defaultOpen
          onChange={onChange}
        />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement

    await fireEvent.click(queryAllBody('[data-slot="item"]')[1]!)
    form.reset()
    await Promise.resolve()

    expect(
      Array.from(screen.container.querySelectorAll('[data-slot="tag"]')).map((tag) =>
        tag.getAttribute('title'),
      ),
    ).toEqual(['Apple', 'Banana'])
    expect(new FormData(form).getAll('fruits')).toEqual(['apple', 'banana'])
    expect(onChange).toHaveBeenCalledOnce()
  })
})

describe('MultiSelect - scroll bottom', () => {
  test('calls onScrollBottom once before leaving threshold', async () => {
    const onScrollBottom = vi.fn()

    render(() => (
      <MultiSelect
        options={FRUITS}
        defaultOpen
        onScrollBottom={onScrollBottom}
        scrollBottomThreshold={30}
      />
    ))

    await waitFor(() => {
      expect(queryBody('[data-slot="listbox"]')).not.toBeNull()
    })

    const listbox = queryBody('[data-slot="listbox"]') as HTMLElement
    Object.defineProperties(listbox, {
      clientHeight: { value: 100, configurable: true },
      scrollHeight: { value: 200, configurable: true },
      scrollTop: { value: 0, writable: true, configurable: true },
    })

    listbox.scrollTop = 70
    await fireEvent.scroll(listbox)
    await fireEvent.scroll(listbox)
    await fireEvent.scroll(listbox)

    expect(onScrollBottom).toHaveBeenCalledTimes(1)

    listbox.scrollTop = 20
    await fireEvent.scroll(listbox)

    listbox.scrollTop = 70
    await fireEvent.scroll(listbox)

    expect(onScrollBottom).toHaveBeenCalledTimes(2)
  })
})
