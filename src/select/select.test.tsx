import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { Form } from '../form'
import { FormField } from '../form-field'

import { Select } from './select'
import type { SelectEmptyRenderContext, SelectOption, SelectOptionRenderState } from './select'

const FRUITS = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry', disabled: true },
]

const GROUPED_OPTIONS = [
  {
    label: 'Fruits',
    options: [
      { label: 'Apple', value: 'apple' },
      { label: 'Banana', value: 'banana' },
    ],
  },
  {
    label: 'Vegetables',
    options: [
      { label: 'Carrot', value: 'carrot' },
      { label: 'Daikon', value: 'daikon' },
    ],
  },
]

/** Query portal-rendered content from document.body */
function queryBody(selector: string): Element | null {
  return document.body.querySelector(selector)
}

function queryAllBody(selector: string): NodeListOf<Element> {
  return document.body.querySelectorAll(selector)
}

describe('Select - single mode', () => {
  test('applies classes.root override', () => {
    const screen = render(() => (
      <Select options={FRUITS} placeholder="Pick a fruit" classes={{ root: 'root-override' }} />
    ))

    const root = screen.container.querySelector('[data-slot="root"]')
    expect(root?.className).toContain('root-override')
  })

  test('renders with placeholder', () => {
    const screen = render(() => <Select options={FRUITS} placeholder="Pick a fruit" />)

    const input = screen.getByRole('combobox')
    expect(input).not.toBeNull()
    expect(input.getAttribute('placeholder')).toBe('Pick a fruit')
  })

  test('shows options when opened', () => {
    render(() => <Select options={FRUITS} defaultOpen placeholder="Pick" />)

    const listbox = queryBody('[data-slot="listbox"]')
    expect(listbox).not.toBeNull()

    const options = queryAllBody('[data-slot="item"]')
    expect(options.length).toBe(3)
  })

  test('selects an option and calls onChange', async () => {
    const onChange = vi.fn()
    render(() => <Select options={FRUITS} defaultOpen onChange={onChange} placeholder="Pick" />)

    const options = queryAllBody('[data-slot="item"]')
    await fireEvent.click(options[0])

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith('apple')
  })

  test('keeps controlled value until parent updates', () => {
    const screen = render(() => <Select options={FRUITS} value="apple" placeholder="Pick" />)

    const input = screen.getByRole('combobox') as HTMLInputElement
    expect(input.value).toBe('Apple')
  })

  test('marks disabled options with aria-disabled', () => {
    render(() => <Select options={FRUITS} defaultOpen placeholder="Pick" />)

    const items = queryAllBody('[data-slot="item"]')
    const cherryItem = items[2]
    expect(cherryItem.getAttribute('aria-disabled')).toBe('true')
  })

  test('keeps loading trigger icon animation class', () => {
    const screen = render(() => <Select options={FRUITS} loading placeholder="Pick" />)
    const icon = screen.container.querySelector('[data-slot="trigger-icon"] [data-slot="icon"]')

    expect(icon?.className).toContain('animate-spin')
  })
})

describe('Select - multiple mode', () => {
  test('renders tags for selected values', () => {
    const screen = render(() => (
      <Select multiple options={FRUITS} value={['apple', 'banana']} placeholder="Pick" />
    ))

    const tags = screen.container.querySelectorAll('[data-slot="tag"]')
    expect(tags.length).toBe(2)
  })

  test('calls onChange with array of values', async () => {
    const onChange = vi.fn()
    render(() => (
      <Select multiple options={FRUITS} defaultOpen onChange={onChange} placeholder="Pick" />
    ))

    const items = queryAllBody('[data-slot="item"]')
    await fireEvent.click(items[0])

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith(['apple'])
  })

  test('removes tag on tag remove click', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <Select
        multiple
        options={FRUITS}
        defaultValue={['apple', 'banana']}
        onChange={onChange}
        placeholder="Pick"
      />
    ))

    const removeButtons = screen.container.querySelectorAll('[data-slot="tag-remove"]')
    expect(removeButtons.length).toBe(2)
    await fireEvent.click(removeButtons[0])

    expect(onChange).toHaveBeenCalled()
  })

  test('respects maxCount limit', async () => {
    const onChange = vi.fn()
    render(() => (
      <Select
        multiple
        options={FRUITS}
        defaultValue={['apple']}
        defaultOpen
        onChange={onChange}
        maxCount={1}
        placeholder="Pick"
      />
    ))

    const items = queryAllBody('[data-slot="item"]')
    // Click banana (second item)
    await fireEvent.click(items[1])

    // maxCount is 1 and we already have 1 selected, so onChange should not fire
    expect(onChange).not.toHaveBeenCalled()
  })

  test('shows +N overflow with maxTagCount', () => {
    const screen = render(() => (
      <Select
        multiple
        options={FRUITS}
        value={['apple', 'banana']}
        maxTagCount={1}
        placeholder="Pick"
      />
    ))

    const tags = screen.container.querySelectorAll('[data-slot="tag"]')
    expect(tags.length).toBe(1)

    const overflow = screen.container.querySelector('[data-slot="tag-overflow"]')
    expect(overflow).not.toBeNull()
    expect(overflow?.textContent).toContain('+1')
  })
})

describe('Select - tag creation', () => {
  test('creates and selects tag from token separators without allowCreate', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <Select
        multiple
        showSearch
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

  test('keeps trailing partial token and emits onSearch with remainder', async () => {
    const onChange = vi.fn()
    const onSearch = vi.fn()
    const screen = render(() => (
      <Select
        multiple
        showSearch
        options={FRUITS}
        tokenSeparators={[',']}
        onChange={onChange}
        onSearch={onSearch}
        placeholder="Type..."
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
      <Select
        multiple
        showSearch
        options={FRUITS}
        tokenSeparators={[',']}
        defaultValue={['apple']}
        maxCount={1}
        onChange={onChange}
        placeholder="Type..."
      />
    ))

    const input = screen.getByRole('combobox') as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'banana,' } })

    expect(onChange).not.toHaveBeenCalled()
  })

  test('input is not searchable by default in multiple mode', () => {
    const screen = render(() => <Select multiple options={FRUITS} placeholder="Type..." />)

    const input = screen.getByRole('combobox') as HTMLInputElement
    expect(input.hasAttribute('readonly')).toBe(true)
  })

  test('does not auto-create tag on Enter when no matched option', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <Select
        multiple
        showSearch
        options={FRUITS}
        defaultOpen
        onChange={onChange}
        placeholder="Type..."
      />
    ))

    const input = screen.getByRole('combobox') as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'Dragonfruit' } })
    await fireEvent.keyDown(input, { key: 'Enter' })

    expect(onChange).not.toHaveBeenCalled()
    expect(input.value).toBe('Dragonfruit')
  })

  test('keeps Enter toggle behavior when input exactly matches an option', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <Select
        multiple
        showSearch
        options={FRUITS}
        defaultOpen
        onChange={onChange}
        placeholder="Type..."
      />
    ))

    const input = screen.getByRole('combobox') as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'Apple' } })
    await fireEvent.keyDown(input, { key: 'Enter' })

    expect(onChange).toHaveBeenCalledWith(['apple'])
    expect(input.value).toBe('')
  })
})

describe('Select - search', () => {
  test('input is readonly when showSearch is false', () => {
    const screen = render(() => <Select options={FRUITS} showSearch={false} placeholder="Pick" />)

    const input = screen.getByRole('combobox') as HTMLInputElement
    expect(input.hasAttribute('readonly')).toBe(true)
  })

  test('input is editable when showSearch is true', () => {
    const screen = render(() => <Select options={FRUITS} showSearch placeholder="Pick" />)

    const input = screen.getByRole('combobox') as HTMLInputElement
    expect(input.hasAttribute('readonly')).toBe(false)
  })

  test('calls onSearch with input value', async () => {
    const onSearch = vi.fn()
    const screen = render(() => (
      <Select options={FRUITS} showSearch onSearch={onSearch} placeholder="Search..." />
    ))

    const input = screen.getByRole('combobox') as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'app' } })

    expect(onSearch).toHaveBeenCalledWith('app')
  })
})

describe('Select - clear', () => {
  test('shows clear button when allowClear and value present', () => {
    const screen = render(() => (
      <Select options={FRUITS} value="apple" allowClear placeholder="Pick" />
    ))

    expect(screen.container.querySelector('[data-slot="clear"]')).not.toBeNull()
  })

  test('hides clear button when no value', () => {
    const screen = render(() => <Select options={FRUITS} allowClear placeholder="Pick" />)

    expect(screen.container.querySelector('[data-slot="clear"]')).toBeNull()
  })

  test('calls onClear when clear button is clicked', async () => {
    const onClear = vi.fn()
    const screen = render(() => (
      <Select
        options={FRUITS}
        defaultValue="apple"
        allowClear
        onClear={onClear}
        placeholder="Pick"
      />
    ))

    const clearBtn = screen.container.querySelector('[data-slot="clear"]')
    expect(clearBtn).not.toBeNull()
    await fireEvent.click(clearBtn!)

    expect(onClear).toHaveBeenCalledTimes(1)
  })
})

describe('Select - groups', () => {
  test('renders group labels when open', () => {
    render(() => <Select options={GROUPED_OPTIONS} defaultOpen placeholder="Pick" />)

    const sectionLabels = queryAllBody('[data-slot="section-label"]')
    expect(sectionLabels.length).toBe(2)
    expect(sectionLabels[0].textContent).toBe('Fruits')
    expect(sectionLabels[1].textContent).toBe('Vegetables')
  })

  test('renders options within groups', () => {
    render(() => <Select options={GROUPED_OPTIONS} defaultOpen placeholder="Pick" />)

    const items = queryAllBody('[data-slot="item"]')
    expect(items.length).toBe(4)
  })

  test('does not force virtualized mode for grouped options by default', () => {
    render(() => <Select options={GROUPED_OPTIONS} defaultOpen placeholder="Pick" />)

    const items = queryAllBody('[data-slot="item"]')
    expect(items.length).toBe(4)
    expect(items[0].getAttribute('aria-posinset')).toBeNull()
    expect(items[0].getAttribute('aria-setsize')).toBeNull()
  })

  test('renders grouped options with virtualized mode when explicitly enabled', () => {
    render(() => <Select options={GROUPED_OPTIONS} virtualized defaultOpen placeholder="Pick" />)

    const sectionLabels = queryAllBody('[data-slot="section-label"]')
    const items = queryAllBody('[data-slot="item"]')

    expect(sectionLabels.length).toBe(2)
    expect(items.length).toBe(4)
    expect(items[0].getAttribute('aria-posinset')).toBe('1')
    expect(items[0].getAttribute('aria-setsize')).toBe('4')
  })
})

describe('Select - render hooks', () => {
  test('uses optionRender for custom item rendering', () => {
    render(() => (
      <Select
        options={FRUITS}
        defaultOpen
        optionRender={(option) => <span data-testid="custom-option">{option.label} (custom)</span>}
        placeholder="Pick"
      />
    ))

    const customOptions = document.body.querySelectorAll('[data-testid="custom-option"]')
    expect(customOptions.length).toBeGreaterThan(0)
  })

  test('passes selected state for normal items to optionRender', () => {
    const renderCalls: Array<{ option: SelectOption; state: SelectOptionRenderState }> = []

    render(() => (
      <Select
        options={FRUITS}
        value="apple"
        defaultOpen
        optionRender={(option, state) => {
          renderCalls.push({ option, state })
          return <span data-testid="custom-option">{option.label}</span>
        }}
        placeholder="Pick"
      />
    ))

    const appleState = renderCalls.find((call) => call.option.value === 'apple')?.state
    expect(appleState).toBeDefined()
    expect(appleState?.isSelected).toBe(true)
  })

  test('calls emptyRender with context when no matched items', async () => {
    let lastContext: SelectEmptyRenderContext | undefined
    const screen = render(() => (
      <Select
        multiple
        showSearch
        options={FRUITS}
        defaultOpen
        emptyRender={(context) => {
          lastContext = context
          return <div data-testid="custom-empty">No match for {context.inputValue}</div>
        }}
        placeholder="Type..."
      />
    ))

    const input = screen.getByRole('combobox') as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'Dragonfruit' } })

    await waitFor(() => {
      expect(queryBody('[data-testid="custom-empty"]')).not.toBeNull()
      expect(lastContext).toBeDefined()
      expect(lastContext?.inputValue).toBe('Dragonfruit')
      expect(lastContext?.multiple).toBe(true)
      expect(lastContext?.hasMatches).toBe(false)
    })
  })

  test('does not render emptyRender content when there are matched items', async () => {
    const screen = render(() => (
      <Select
        multiple
        showSearch
        options={FRUITS}
        defaultOpen
        emptyRender={() => <div data-testid="custom-empty">No match</div>}
        placeholder="Type..."
      />
    ))

    const input = screen.getByRole('combobox') as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'App' } })

    await waitFor(() => {
      expect(queryBody('[data-testid="custom-empty"]')).toBeNull()
    })
  })

  test('uses current custom filter rule to decide emptyRender visibility', async () => {
    const screen = render(() => (
      <Select
        multiple
        showSearch
        options={FRUITS}
        defaultOpen
        filterOption={(inputValue, option) => String(option.value ?? '').endsWith(inputValue)}
        emptyRender={() => <div data-testid="custom-empty">No match</div>}
        placeholder="Type..."
      />
    ))

    const input = screen.getByRole('combobox') as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'ana' } })

    await waitFor(() => {
      expect(queryBody('[data-testid="custom-empty"]')).toBeNull()
    })

    await fireEvent.input(input, { target: { value: 'xyz' } })

    await waitFor(() => {
      expect(queryBody('[data-testid="custom-empty"]')).not.toBeNull()
    })
  })

  test('allows creating a tag via emptyRender context create()', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <Select
        multiple
        showSearch
        allowCreate
        options={FRUITS}
        defaultOpen
        onChange={onChange}
        emptyRender={(context) => (
          <button data-testid="create-from-empty" onClick={() => context.create()}>
            Create {context.inputValue}
          </button>
        )}
        placeholder="Type..."
      />
    ))

    const input = screen.getByRole('combobox') as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'Dragonfruit' } })

    await waitFor(() => {
      expect(queryBody('[data-testid="create-from-empty"]')).not.toBeNull()
    })

    await fireEvent.click(queryBody('[data-testid="create-from-empty"]')!)

    expect(onChange).toHaveBeenCalledWith(['Dragonfruit'])
    expect(input.value).toBe('')
  })

  test('uses tagRender for custom tag rendering', () => {
    const screen = render(() => (
      <Select
        multiple
        options={FRUITS}
        value={['apple']}
        tagRender={(option, onClose) => (
          <span data-testid="custom-tag">
            {option.label}
            <button onClick={onClose}>x</button>
          </span>
        )}
        placeholder="Pick"
      />
    ))

    expect(screen.getByTestId('custom-tag')).not.toBeNull()
  })
})

describe('Select - keyboard and ARIA', () => {
  test('has correct combobox role', () => {
    const screen = render(() => <Select options={FRUITS} placeholder="Pick" />)

    expect(screen.getByRole('combobox')).not.toBeNull()
  })

  test('has aria-expanded false by default', () => {
    const screen = render(() => <Select options={FRUITS} placeholder="Pick" />)

    const input = screen.getByRole('combobox')
    expect(input.getAttribute('aria-expanded')).toBe('false')
  })

  test('has aria-expanded true when open', () => {
    const screen = render(() => <Select options={FRUITS} defaultOpen placeholder="Pick" />)

    const input = screen.getByRole('combobox')
    expect(input.getAttribute('aria-expanded')).toBe('true')
  })

  test('input has combobox aria attributes', () => {
    const screen = render(() => <Select options={FRUITS} placeholder="Pick" />)

    const input = screen.getByRole('combobox')
    expect(input.getAttribute('aria-haspopup')).toBe('listbox')
    expect(input.getAttribute('aria-autocomplete')).toBe('list')
  })
})

describe('Select - form integration', () => {
  test('applies aria-invalid from form field error state', async () => {
    const state = { fruit: '' }

    const screen = render(() => (
      <Form
        data-testid="form"
        state={state}
        validateOnInputDelay={0}
        validate={(currentState) => {
          if (currentState?.fruit) {
            return []
          }

          return [{ name: 'fruit', message: 'Select a fruit' }]
        }}
      >
        <FormField name="fruit" label="Fruit">
          <Select
            options={FRUITS}
            value={state.fruit || null}
            onChange={(nextValue) => {
              state.fruit = String(nextValue ?? '')
            }}
            placeholder="Pick"
          />
        </FormField>
      </Form>
    ))

    await fireEvent.submit(screen.getByTestId('form'))

    await waitFor(() => {
      expect(screen.getByText('Select a fruit')).not.toBeNull()
    })

    const input = screen.getByRole('combobox')
    expect(input.getAttribute('aria-invalid')).toBe('true')
  })

  test('emits form change event on selection', async () => {
    const state = { fruit: '' }

    const screen = render(() => (
      <Form
        state={state}
        validateOn={['change']}
        validateOnInputDelay={0}
        validate={(currentState) => {
          if (currentState?.fruit === 'banana') {
            return []
          }

          return [{ name: 'fruit', message: 'Select banana' }]
        }}
      >
        <FormField name="fruit" label="Fruit">
          <Select
            options={FRUITS}
            defaultOpen
            defaultValue={null}
            onChange={(nextValue) => {
              state.fruit = String(nextValue ?? '')
            }}
            placeholder="Pick"
          />
        </FormField>
      </Form>
    ))

    const items = queryAllBody('[data-slot="item"]')
    await fireEvent.click(items[0])

    await waitFor(() => {
      expect(screen.getByText('Select banana')).not.toBeNull()
    })
  })

  test('does not bind form-field label for grouped controls', () => {
    const state = { fruit: '' }

    const screen = render(() => (
      <Form state={state} validate={() => []}>
        <FormField name="fruit" label="Select fruit">
          <Select id="fruit-input" options={FRUITS} placeholder="Pick" />
        </FormField>
      </Form>
    ))

    const label = screen.getByText('Select fruit')
    expect(label.getAttribute('for')).toBeNull()
  })
})

describe('Select - emptyRender string', () => {
  test('renders string emptyRender as empty state text', async () => {
    const screen = render(() => (
      <Select
        options={FRUITS}
        showSearch
        defaultOpen
        emptyRender="Nothing here!"
        placeholder="Search..."
      />
    ))

    const input = screen.getByRole('combobox') as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'zzzzz' } })

    await waitFor(() => {
      const emptyEl = queryBody('[data-slot="empty"]')
      expect(emptyEl).not.toBeNull()
      expect(emptyEl?.textContent).toBe('Nothing here!')
    })
  })

  test('renders default "No options" text when emptyRender is not provided', async () => {
    const screen = render(() => (
      <Select options={FRUITS} showSearch defaultOpen placeholder="Search..." />
    ))

    const input = screen.getByRole('combobox') as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'zzzzz' } })

    await waitFor(() => {
      const emptyEl = queryBody('[data-slot="empty"]')
      expect(emptyEl).not.toBeNull()
      expect(emptyEl?.textContent).toBe('No options')
    })
  })
})

describe('Select - enriched emptyRender context', () => {
  test('context includes multiple, selectedValues, isAtMaxCount, and close', async () => {
    let capturedContext: SelectEmptyRenderContext | undefined
    const screen = render(() => (
      <Select
        multiple
        showSearch
        options={FRUITS}
        defaultValue={['apple']}
        defaultOpen
        maxCount={2}
        emptyRender={(ctx) => {
          capturedContext = ctx
          return <div data-testid="empty">Empty</div>
        }}
        placeholder="Type..."
      />
    ))

    const input = screen.getByRole('combobox') as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'xyznonexistent' } })

    await waitFor(() => {
      expect(capturedContext).toBeDefined()
      expect(capturedContext?.multiple).toBe(true)
      expect(capturedContext?.selectedValues).toEqual(['apple'])
      expect(capturedContext?.isAtMaxCount).toBe(false)
      expect(typeof capturedContext?.close).toBe('function')
    })
  })
})

describe('Select - allowCreate', () => {
  test('creates tag on Enter when allowCreate is true and no match', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <Select
        multiple
        showSearch
        options={FRUITS}
        defaultOpen
        allowCreate
        onChange={onChange}
        placeholder="Type..."
      />
    ))

    const input = screen.getByRole('combobox') as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'Dragonfruit' } })
    await fireEvent.keyDown(input, { key: 'Enter' })

    expect(onChange).toHaveBeenCalledWith(['Dragonfruit'])
    expect(input.value).toBe('')
  })

  test('does not create tag on Enter when allowCreate is false', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <Select
        multiple
        showSearch
        options={FRUITS}
        defaultOpen
        onChange={onChange}
        placeholder="Type..."
      />
    ))

    const input = screen.getByRole('combobox') as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'Dragonfruit' } })
    await fireEvent.keyDown(input, { key: 'Enter' })

    expect(onChange).not.toHaveBeenCalled()
  })
})
