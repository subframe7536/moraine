import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { Form } from '../form'
import { FormField } from '../form-field'

import { MultiSelect } from './multi-select'
import type { MultiSelectProps, MultiSelectT } from './multi-select'

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

describe('MultiSelect', () => {
  test('does not accept highlight prop at type level', () => {
    // @ts-expect-error highlight has been removed from MultiSelect props
    const props: MultiSelectProps = { options: FRUITS, highlight: true }

    expect(props).toBeDefined()
  })

  test('renders tags for selected values', () => {
    const screen = render(() => <MultiSelect options={FRUITS} value={['apple', 'banana']} />)

    const tags = screen.container.querySelectorAll('[data-slot="tag"]')
    expect(tags.length).toBe(2)
  })

  test('calls onChange with array of values', async () => {
    const onChange = vi.fn()
    render(() => <MultiSelect options={FRUITS} defaultOpen onChange={onChange} />)

    const items = queryAllBody('[data-slot="item"]')
    await fireEvent.click(items[0]!)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith(['apple'])
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

  test('passes null to optionRender for empty state', async () => {
    let receivedEmptyOption = false
    const screen = render(() => (
      <MultiSelect
        search
        options={FRUITS}
        defaultOpen
        optionRender={(option) => {
          receivedEmptyOption = option === null
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
            {props.label}
            <button onClick={props.onClose}>x</button>
          </span>
        )}
      />
    ))

    expect(screen.getByTestId('custom-tag')).not.toBeNull()
  })

  test('types onChange payload as array', () => {
    const onChange: NonNullable<MultiSelectProps['onChange']> = (value) => {
      const values: Array<string | number> = value
      expect(Array.isArray(values)).toBe(true)
    }

    onChange(['apple'])
  })

  test('clear resets bound form value to default array when provided', async () => {
    const state: { fruits: Array<string | number> } = { fruits: ['apple'] }

    const screen = render(() => (
      <Form state={state} validate={() => []}>
        <FormField name="fruits" label="Fruits">
          <MultiSelect
            options={FRUITS}
            defaultValue={['apple']}
            allowClear
            defaultOpen
            placeholder="Pick"
          />
        </FormField>
      </Form>
    ))

    const items = queryAllBody('[data-slot="item"]')
    await fireEvent.click(items[1]!)

    await waitFor(() => {
      expect(state.fruits).toEqual(['apple', 'banana'])
    })

    const control = screen.container.querySelector('[data-slot="control"]') as HTMLElement
    await fireEvent.mouseEnter(control)
    const clearBtn = screen.container.querySelector('[data-slot="clear"]')
    expect(clearBtn).not.toBeNull()
    await fireEvent.click(clearBtn!)

    await waitFor(() => {
      expect(state.fruits).toEqual(['apple'])
    })
  })

  test('clear resets bound form value to empty array when no defaultValue', async () => {
    const state: { fruits: Array<string | number> } = { fruits: [] }

    const screen = render(() => (
      <Form state={state} validate={() => []}>
        <FormField name="fruits" label="Fruits">
          <MultiSelect options={FRUITS} allowClear defaultOpen placeholder="Pick" />
        </FormField>
      </Form>
    ))

    const items = queryAllBody('[data-slot="item"]')
    await fireEvent.click(items[0]!)

    await waitFor(() => {
      expect(state.fruits).toEqual(['apple'])
    })

    const control = screen.container.querySelector('[data-slot="control"]') as HTMLElement
    await fireEvent.mouseEnter(control)
    const clearBtn = screen.container.querySelector('[data-slot="clear"]')
    expect(clearBtn).not.toBeNull()
    await fireEvent.click(clearBtn!)

    await waitFor(() => {
      expect(state.fruits).toEqual([])
    })
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
