import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { Form } from '../form'
import { FormField } from '../form-field'

import { Select } from './select'
import type { SelectT } from './select'

const FRUITS = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry', disabled: true },
]

const GROUPED_OPTIONS = [
  {
    label: 'Fruits',
    children: [
      { label: 'Apple', value: 'apple' },
      { label: 'Banana', value: 'banana' },
    ],
  },
  {
    label: 'Vegetables',
    children: [
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

test('single Select does not accept multiple prop at type level', () => {
  // @ts-expect-error Select is single-only and should not accept `multiple`
  const node = <Select options={FRUITS} multiple />

  expect(node).toBeDefined()
})

test('single Select does not accept multi-only props at type level', () => {
  // @ts-expect-error Select should reject multi-only options
  const node = <Select options={FRUITS} allowCreate tokenSeparators={[',']} maxCount={2} />

  expect(node).toBeDefined()
})

test('uses css variable classes for input sizing in single mode', () => {
  const single = render(() => <Select options={FRUITS} size="xs" placeholder="XS" />)
  const singleInput = single.container.querySelector('[data-slot="input"]')

  expect(singleInput?.className).toContain('mx-$s-p')
  expect(singleInput?.className).toContain('text-xs')
  expect(singleInput?.className).toContain('var-select-0.5')
})

describe('Select - single mode', () => {
  test('supports xs and xl size classes', () => {
    const screen = render(() => (
      <>
        <Select options={FRUITS} size="xs" placeholder="XS" />
        <Select options={FRUITS} size="xl" placeholder="XL" />
      </>
    ))

    const controls = screen.container.querySelectorAll('[data-slot="control"]')
    expect(controls[0]?.className).toContain('pe-1')
    expect(controls[1]?.className).toContain('pe-3')
  })

  test('applies classes.root override', () => {
    const screen = render(() => (
      <Select options={FRUITS} placeholder="Pick a fruit" classes={{ root: 'root-override' }} />
    ))

    const root = screen.container.firstElementChild as HTMLElement | null
    expect(root?.className).toContain('root-override')
  })

  test('applies styles.root override', () => {
    const screen = render(() => (
      <Select options={FRUITS} placeholder="Pick a fruit" styles={{ root: { width: '200px' } }} />
    ))

    const root = screen.container.firstElementChild as HTMLElement | null
    expect(root?.style.width).toBe('200px')
  })

  test('renders with placeholder', () => {
    const screen = render(() => <Select options={FRUITS} placeholder="Pick a fruit" />)

    const input = screen.getByRole('combobox')
    expect(input).not.toBeNull()
    expect(input.getAttribute('placeholder')).toBe('Pick a fruit')
  })

  test('opens dropdown when combobox input is clicked', async () => {
    const screen = render(() => <Select options={FRUITS} placeholder="Pick a fruit" />)
    const input = screen.getByRole('combobox')

    expect(queryBody('[data-slot="content"]')).toBeNull()

    await fireEvent.click(input)

    await waitFor(() => {
      expect(queryBody('[data-slot="content"]')).not.toBeNull()
    })
  })

  test('opens dropdown when trigger icon is clicked', async () => {
    const screen = render(() => <Select options={FRUITS} placeholder="Pick a fruit" />)
    const trigger = screen.container.querySelector('[data-slot="trigger"]') as HTMLElement

    expect(queryBody('[data-slot="content"]')).toBeNull()

    await fireEvent.click(trigger)

    await waitFor(() => {
      expect(queryBody('[data-slot="content"]')).not.toBeNull()
    })
  })

  test('restricts control click opening when openOnClick is trigger', async () => {
    const screen = render(() => (
      <Select options={FRUITS} openOnClick="trigger" placeholder="Pick a fruit" />
    ))
    const input = screen.getByRole('combobox')
    const trigger = screen.container.querySelector('[data-slot="trigger"]') as HTMLElement

    await fireEvent.click(input)
    expect(queryBody('[data-slot="content"]')).toBeNull()

    await fireEvent.click(trigger)
    await waitFor(() => {
      expect(queryBody('[data-slot="content"]')).not.toBeNull()
    })
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

  test('shows loading trigger icon while loading', () => {
    const screen = render(() => <Select options={FRUITS} loading placeholder="Pick" />)
    const trigger = screen.container.querySelector('[data-slot="trigger"]')
    const icon = trigger?.querySelector('[data-slot="icon"]')

    expect(trigger?.hasAttribute('data-loading')).toBe(true)
    expect(icon?.className).toContain('icon-loading')
  })
})

describe('Select - search', () => {
  test('input is readonly when showSearch is false', () => {
    const screen = render(() => <Select options={FRUITS} search={false} placeholder="Pick" />)

    const input = screen.getByRole('combobox') as HTMLInputElement
    expect(input.hasAttribute('readonly')).toBe(true)
  })

  test('input is editable when showSearch is true', () => {
    const screen = render(() => <Select options={FRUITS} search placeholder="Pick" />)

    const input = screen.getByRole('combobox') as HTMLInputElement
    expect(input.hasAttribute('readonly')).toBe(false)
  })

  test('opens menu when searchable input is clicked in control mode', async () => {
    const screen = render(() => <Select options={FRUITS} search placeholder="Search..." />)

    const input = screen.getByRole('combobox') as HTMLInputElement

    fireEvent.click(input)

    await waitFor(() => {
      expect(input.getAttribute('aria-expanded')).toBe('true')
    })
  })

  test('dismisses menu when searchable input is clicked again in control mode', async () => {
    const screen = render(() => <Select options={FRUITS} search placeholder="Search..." />)
    const input = screen.getByRole('combobox') as HTMLInputElement

    await fireEvent.click(input)
    await waitFor(() => {
      expect(input.getAttribute('aria-expanded')).toBe('true')
    })

    await fireEvent.click(input)
    await waitFor(() => {
      expect(input.getAttribute('aria-expanded')).toBe('false')
    })
  })

  test('calls onSearch with input value', async () => {
    const onSearch = vi.fn()
    const screen = render(() => (
      <Select options={FRUITS} search onSearch={onSearch} placeholder="Search..." />
    ))

    const input = screen.getByRole('combobox') as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'app' } })

    expect(onSearch).toHaveBeenCalledWith('app')
  })

  test('filters options with startsWith mode', async () => {
    const screen = render(() => (
      <Select
        options={FRUITS}
        search
        defaultOpen
        filterOption="startsWith"
        placeholder="Search..."
      />
    ))

    const input = screen.getByRole('combobox') as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'ap' } })

    await waitFor(() => {
      const items = queryAllBody('[data-slot="item"]')
      expect(items.length).toBe(1)
      expect(items[0].textContent).toContain('Apple')
    })
  })

  test('filters options with endsWith mode', async () => {
    const screen = render(() => (
      <Select options={FRUITS} search defaultOpen filterOption="endsWith" placeholder="Search..." />
    ))

    const input = screen.getByRole('combobox') as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'na' } })

    await waitFor(() => {
      const items = queryAllBody('[data-slot="item"]')
      expect(items.length).toBe(1)
      expect(items[0].textContent).toContain('Banana')
    })
  })

  test('opens menu when searchable input becomes non-empty in trigger-only mode', async () => {
    const screen = render(() => (
      <Select options={FRUITS} search openOnClick="trigger" placeholder="Search..." />
    ))
    const input = screen.getByRole('combobox') as HTMLInputElement

    await fireEvent.click(input)
    expect(input.getAttribute('aria-expanded')).toBe('false')

    await fireEvent.input(input, {
      target: { value: 'app' },
      currentTarget: { value: 'app' },
    })

    await waitFor(() => {
      expect(input.getAttribute('aria-expanded')).toBe('true')
    })
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

  test('clear resets bound form value to defaultValue when provided', async () => {
    const state = { fruit: 'apple' }

    const screen = render(() => (
      <Form state={state} validate={() => []}>
        <FormField name="fruit" label="Fruit">
          <Select options={FRUITS} defaultValue="apple" allowClear defaultOpen placeholder="Pick" />
        </FormField>
      </Form>
    ))

    const items = queryAllBody('[data-slot="item"]')
    await fireEvent.click(items[1])

    await waitFor(() => {
      expect(state.fruit).toBe('banana')
    })

    const clearBtn = screen.container.querySelector('[data-slot="clear"]')
    expect(clearBtn).not.toBeNull()
    await fireEvent.click(clearBtn!)

    await waitFor(() => {
      expect(state.fruit).toBe('apple')
    })
  })

  test('clear resets bound form value to empty string when no defaultValue', async () => {
    const state = { fruit: '' }

    const screen = render(() => (
      <Form state={state} validate={() => []}>
        <FormField name="fruit" label="Fruit">
          <Select options={FRUITS} allowClear defaultOpen placeholder="Pick" />
        </FormField>
      </Form>
    ))

    const items = queryAllBody('[data-slot="item"]')
    await fireEvent.click(items[0])

    await waitFor(() => {
      expect(state.fruit).toBe('apple')
    })

    const clearBtn = screen.container.querySelector('[data-slot="clear"]')
    expect(clearBtn).not.toBeNull()
    await fireEvent.click(clearBtn!)

    await waitFor(() => {
      expect(state.fruit).toBe('')
    })
  })
})

describe('Select - groups', () => {
  test('renders group labels when open', () => {
    render(() => <Select options={GROUPED_OPTIONS} defaultOpen placeholder="Pick" />)

    const sectionLabels = queryAllBody('[data-slot="label"]')
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

    const sectionLabels = queryAllBody('[data-slot="label"]')
    const items = queryAllBody('[data-slot="item"]')

    expect(sectionLabels.length).toBe(2)
    expect(items.length).toBe(4)
    expect(items[0].getAttribute('aria-posinset')).toBe('1')
    expect(items[0].getAttribute('aria-setsize')).toBe('4')
  })

  test('treats empty children as a normal option', () => {
    const options = [
      { label: 'Standalone', value: 'standalone', children: [] },
      { label: 'Plain', value: 'plain' },
    ]

    render(() => <Select options={options} defaultOpen placeholder="Pick" />)

    const sectionLabels = queryAllBody('[data-slot="label"]')
    const items = queryAllBody('[data-slot="item"]')

    expect(sectionLabels.length).toBe(0)
    expect(items.length).toBe(2)
  })
})

describe('Select - render hooks', () => {
  test('renders JSX label without string normalization', () => {
    const jsxOptions = [
      { label: <span data-testid="apple-label">Apple</span>, value: 'apple' },
      { label: 'Banana', value: 'banana' },
    ]

    render(() => <Select options={jsxOptions} defaultOpen placeholder="Pick" />)

    expect(queryBody('[data-testid="apple-label"]')).not.toBeNull()
  })

  test('uses option key for search when label is JSX', async () => {
    const jsxOptions = [
      { label: <span>Fancy Apple</span>, key: 'Apple', value: 'apple' },
      { label: 'Banana', value: 'banana' },
    ]
    const screen = render(() => (
      <Select options={jsxOptions} search defaultOpen placeholder="Pick" />
    ))
    const input = screen.getByRole('combobox') as HTMLInputElement

    await fireEvent.input(input, { target: { value: 'app' } })

    await waitFor(() => {
      expect(queryBody('[data-slot="empty"]')).toBeNull()
    })
  })

  test('uses labelRender for item label rendering', () => {
    render(() => (
      <Select
        options={FRUITS}
        defaultOpen
        labelRender={(option) => (
          <span data-testid={`custom-label-${String(option.value)}`}>{option.label}</span>
        )}
        placeholder="Pick"
      />
    ))

    expect(queryBody('[data-testid="custom-label-apple"]')).not.toBeNull()
    expect(queryBody('[data-testid="custom-label-banana"]')).not.toBeNull()
  })

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
    const renderCalls: Array<Parameters<NonNullable<SelectT.Base['optionRender']>>[0]> = []

    render(() => (
      <Select
        options={FRUITS}
        value="apple"
        defaultOpen
        optionRender={(props) => {
          renderCalls.push(props)
          return <span data-testid="custom-option">{props.label}</span>
        }}
        placeholder="Pick"
      />
    ))

    const appleState = renderCalls.find((call) => call.value === 'apple')
    expect(appleState).toBeDefined()
    expect(appleState?.isSelected).toBe(true)
  })
})

describe('Select - keyboard and ARIA', () => {
  test('removes trigger icon from tab order', () => {
    const screen = render(() => <Select options={FRUITS} placeholder="Pick" />)
    const trigger = screen.container.querySelector('[data-slot="trigger"]')

    expect(trigger?.getAttribute('tabindex')).toBe('-1')
  })

  test('when menu is open, first Tab selects focused single item and keeps focus', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <>
        <Select options={FRUITS} onChange={onChange} placeholder="Pick" />
        <button type="button">Next</button>
      </>
    ))
    const input = screen.getByRole('combobox') as HTMLInputElement

    input.focus()
    await fireEvent.click(input)
    await waitFor(() => {
      expect(input.getAttribute('aria-expanded')).toBe('true')
    })

    await fireEvent.keyDown(input, { key: 'ArrowDown' })

    const firstTabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    })
    input.dispatchEvent(firstTabEvent)

    expect(firstTabEvent.defaultPrevented).toBe(true)

    await waitFor(() => {
      expect(input.getAttribute('aria-expanded')).toBe('false')
    })

    expect(document.activeElement).toBe(input)
    expect(onChange).toHaveBeenCalledWith('apple')

    const secondTabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    })
    input.dispatchEvent(secondTabEvent)

    expect(secondTabEvent.defaultPrevented).toBe(false)
  })

  test('does not prevent Tab when menu is closed', () => {
    const screen = render(() => <Select options={FRUITS} placeholder="Pick" />)
    const input = screen.getByRole('combobox') as HTMLInputElement

    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    })
    input.dispatchEvent(tabEvent)

    expect(tabEvent.defaultPrevented).toBe(false)
  })

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

    await fireEvent.submit(screen.container.querySelector('form') as HTMLFormElement)

    await waitFor(() => {
      expect(screen.getByText('Select a fruit')).not.toBeNull()
    })

    const input = screen.getByRole('combobox')
    const control = input.closest('[data-slot="control"]')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(control?.hasAttribute('data-invalid')).toBe(true)
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
        search
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
      <Select options={FRUITS} search defaultOpen placeholder="Search..." />
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
  test('close from emptyRender context closes dropdown content', async () => {
    const screen = render(() => (
      <Select
        search
        options={FRUITS}
        defaultOpen
        emptyRender={(ctx) => (
          <button data-testid="close-from-empty" onClick={() => ctx.close()}>
            Close
          </button>
        )}
        placeholder="Search..."
      />
    ))

    const input = screen.getByRole('combobox') as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'zzzzz' } })

    await waitFor(() => {
      expect(queryBody('[data-testid="close-from-empty"]')).not.toBeNull()
    })

    await fireEvent.click(queryBody('[data-testid="close-from-empty"]') as HTMLElement)

    await waitFor(() => {
      expect(input.getAttribute('aria-expanded')).toBe('false')
      expect(queryBody('[data-slot="content"]')?.hasAttribute('data-closed')).toBe(true)
    })
  })
})
