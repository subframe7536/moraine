import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { Form } from '../form'
import { FormField } from '../form-field'

import { MultiSelect } from './multi-select'
import type { MultiSelectProps, MultiSelectT } from './multi-select'

const FRUITS: MultiSelectT.Items[] = [
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
  test('renders tags for selected values', () => {
    const screen = render(() => <MultiSelect options={FRUITS} value={['apple', 'banana']} />)

    const tags = screen.container.querySelectorAll('[data-slot="tag"]')
    expect(tags.length).toBe(2)
  })

  test('calls onChange with array of values', async () => {
    const onChange = vi.fn()
    render(() => <MultiSelect options={FRUITS} defaultOpen onChange={onChange} />)

    const items = queryAllBody('[data-slot="item"]')
    await fireEvent.click(items[0])

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
    await fireEvent.click(items[1])

    expect(onChange).not.toHaveBeenCalled()
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

    expect(tabEvent.defaultPrevented).toBe(true)
    expect(onChange).toHaveBeenCalledWith(['apple'])
  })

  test('passes enriched emptyRender context', async () => {
    let capturedContext: MultiSelectT.EmptyRenderContext | undefined
    const screen = render(() => (
      <MultiSelect
        search
        options={FRUITS}
        defaultValue={['apple']}
        defaultOpen
        maxCount={2}
        emptyRender={(ctx) => {
          capturedContext = ctx
          return <div data-testid="empty">Empty</div>
        }}
      />
    ))

    const input = screen.getByRole('combobox') as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'xyznonexistent' } })

    await waitFor(() => {
      expect(capturedContext).toBeDefined()
      expect(capturedContext?.hasMatches).toBe(false)
      expect(capturedContext?.selectedValues).toEqual(['apple'])
      expect(capturedContext?.isAtMaxCount).toBe(false)
      expect(typeof capturedContext?.close).toBe('function')
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

  test('uses emptyRender context create() to add new tag', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <MultiSelect
        search
        allowCreate
        options={FRUITS}
        defaultOpen
        onChange={onChange}
        emptyRender={(context) => (
          <button data-testid="create-from-empty" onClick={() => context.create()}>
            Create {context.inputValue}
          </button>
        )}
      />
    ))

    const input = screen.getByRole('combobox') as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'Dragonfruit' } })

    await waitFor(() => {
      expect(queryBody('[data-testid="create-from-empty"]')).not.toBeNull()
    })
    await fireEvent.click(queryBody('[data-testid="create-from-empty"]') as HTMLElement)

    expect(onChange).toHaveBeenCalledWith(['Dragonfruit'])
    expect(input.value).toBe('')
  })

  test('emptyRender context create() returns false when maxCount is reached', async () => {
    const onChange = vi.fn()
    let createResult: boolean | undefined
    const screen = render(() => (
      <MultiSelect
        search
        allowCreate
        options={FRUITS}
        defaultOpen
        maxCount={1}
        defaultValue={['apple']}
        onChange={onChange}
        emptyRender={(context) => (
          <button
            data-testid="create-from-empty"
            onClick={() => {
              createResult = context.create()
            }}
          >
            Create {context.inputValue}
          </button>
        )}
      />
    ))

    const input = screen.getByRole('combobox') as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'Dragonfruit' } })

    await waitFor(() => {
      expect(queryBody('[data-testid="create-from-empty"]')).not.toBeNull()
    })
    await fireEvent.click(queryBody('[data-testid="create-from-empty"]') as HTMLElement)

    expect(createResult).toBe(false)
    expect(onChange).not.toHaveBeenCalled()
    expect(input.value).toBe('Dragonfruit')
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

  test('openOnClick=trigger keeps tags container click from opening dropdown', async () => {
    const screen = render(() => (
      <MultiSelect options={FRUITS} openOnClick="trigger" placeholder="Pick fruits" />
    ))
    const tagsContainer = screen.container.querySelector('[data-slot="tagsContainer"]')
    const trigger = screen.container.querySelector('[data-slot="trigger"]') as HTMLElement

    await fireEvent.pointerDown(tagsContainer as HTMLElement, { button: 0 })
    expect(queryBody('[data-slot="content"]')).toBeNull()

    await fireEvent.click(trigger)
    await waitFor(() => {
      expect(queryBody('[data-slot="content"]')).not.toBeNull()
    })
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
    await fireEvent.click(items[1])

    await waitFor(() => {
      expect(state.fruits).toEqual(['apple', 'banana'])
    })

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
    await fireEvent.click(items[0])

    await waitFor(() => {
      expect(state.fruits).toEqual(['apple'])
    })

    const clearBtn = screen.container.querySelector('[data-slot="clear"]')
    expect(clearBtn).not.toBeNull()
    await fireEvent.click(clearBtn!)

    await waitFor(() => {
      expect(state.fruits).toEqual([])
    })
  })
})
