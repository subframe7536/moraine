import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { For, createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { Select } from './select.tsx'
import type { SelectT } from './select.tsx'

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

test('single Select accepts arbitrary root props at type level', () => {
  const node = <Select options={FRUITS} multiple />

  expect(node).toBeDefined()
})

test('single Select accepts arbitrary root props at type level', () => {
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
  test('accepts static JSX for the empty state', () => {
    render(() => (
      <Select
        options={[]}
        defaultOpen
        emptyRender={<span data-testid="static-empty">Nothing available</span>}
      />
    ))

    expect(document.body.querySelector('[data-testid="static-empty"]')?.textContent).toBe(
      'Nothing available',
    )
  })

  test('supports xs and xl size classes', () => {
    const screen = render(() => (
      <>
        <Select options={FRUITS} size="xs" placeholder="XS" />
        <Select options={FRUITS} size="xl" placeholder="XL" />
      </>
    ))

    const inputs = screen.container.querySelectorAll('[data-slot="input"]')
    expect(inputs[0]?.className).toContain('var-select-0.5')
    expect(inputs[1]?.className).toContain('text-base')
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

    const trigger = screen.getByRole('combobox')
    expect(trigger).not.toBeNull()
    expect(trigger.textContent).toBe('Pick a fruit')
  })

  test('renders non-search placeholder as presentation-only text', () => {
    const screen = render(() => <Select options={FRUITS} placeholder="Pick a fruit" />)

    const placeholder = screen.container.querySelector('[data-slot="input"]') as HTMLElement
    expect(placeholder.tagName).toBe('SPAN')
    expect(placeholder.getAttribute('role')).toBeNull()
    expect(placeholder.getAttribute('tabindex')).toBeNull()
    expect(placeholder.getAttribute('aria-controls')).toBeNull()
    expect(placeholder.getAttribute('aria-expanded')).toBeNull()
    expect(screen.getByRole('combobox')).toBe(placeholder.closest('[data-slot="control"]'))
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

  test('non-search control does not show focus ring on pointer click', async () => {
    const screen = render(() => <Select options={FRUITS} placeholder="Pick a fruit" />)
    const control = screen.container.querySelector('[data-slot="control"]') as HTMLElement

    await fireEvent.pointerDown(control, { button: 0 })
    await fireEvent.click(control)

    expect(control.className).toContain('focus-visible:effect-fv-border')
    expect(control.className).not.toContain('focus-within:effect-fv-border')
  })

  test('non-search control uses focus-visible ring styling for keyboard focus', () => {
    const screen = render(() => <Select options={FRUITS} placeholder="Pick a fruit" />)
    const control = screen.container.querySelector('[data-slot="control"]') as HTMLElement

    control.focus()

    expect(document.activeElement).toBe(control)
    expect(control.className).toContain('focus-visible:effect-fv-border')
  })

  test('searchable control keeps focus-within ring styling', () => {
    const screen = render(() => <Select options={FRUITS} search placeholder="Pick a fruit" />)
    const control = screen.container.querySelector('[data-slot="control"]') as HTMLElement

    expect(control.className).toContain('focus-within:effect-fv-border')
    expect(control.className).not.toContain('focus:effect-fv-border')
  })

  test('opens dropdown and focuses combobox when control shell is clicked', async () => {
    const screen = render(() => <Select options={FRUITS} />)
    const control = screen.container.querySelector('[data-slot="control"]') as HTMLElement
    const combobox = screen.getByRole('combobox') as HTMLElement

    await fireEvent.pointerDown(control, { button: 0 })
    await fireEvent.click(control)

    await waitFor(() => {
      expect(queryBody('[data-slot="content"]')).not.toBeNull()
    })

    expect(document.activeElement).toBe(combobox)
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

  test('popup content width follows the trigger width', async () => {
    const screen = render(() => <Select options={FRUITS} placeholder="Pick a fruit" />)
    const input = screen.getByRole('combobox')

    await fireEvent.click(input)

    await waitFor(() => {
      const content = queryBody('[data-slot="content"]')
      expect(content).not.toBeNull()
      expect(content?.className).toContain('w-$mo-popper-anchor-width')
      expect(content?.className).toContain('min-w-$mo-popper-anchor-width')
    })
  })

  test('popup animation origin defaults to the trigger center', async () => {
    const screen = render(() => <Select options={FRUITS} placeholder="Pick a fruit" />)
    const input = screen.getByRole('combobox')

    await fireEvent.click(input)

    await waitFor(() => {
      const content = queryBody('[data-slot="content"]') as HTMLElement | null
      expect(content).not.toBeNull()
      expect(content?.style.getPropertyValue('--mo-popper-content-transform-origin')).toBe(
        'top center',
      )
    })
  })

  test('shows options when opened', () => {
    render(() => <Select options={FRUITS} defaultOpen defaultValue="apple" placeholder="Pick" />)

    const listbox = queryBody('[data-slot="listbox"]')
    expect(listbox).not.toBeNull()

    const options = queryAllBody('[data-slot="item"]')
    expect(options.length).toBe(3)
    expect(options[0]?.hasAttribute('data-selected')).toBe(true)
    expect(options[1]?.hasAttribute('data-selected')).toBe(false)
    expect(options[0]?.className).toContain('bg-accent-active')
  })

  test('selects an option and calls onChange', async () => {
    const onChange = vi.fn()
    render(() => <Select options={FRUITS} defaultOpen onChange={onChange} placeholder="Pick" />)

    const options = queryAllBody('[data-slot="item"]')
    await fireEvent.click(options[0]!)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith('apple')
  })

  test('keeps controlled value until parent updates', () => {
    const screen = render(() => <Select options={FRUITS} value="apple" placeholder="Pick" />)

    const trigger = screen.getByRole('combobox')
    expect(trigger.textContent).toBe('Apple')
  })

  test('marks disabled options with aria-disabled', () => {
    render(() => <Select options={FRUITS} defaultOpen placeholder="Pick" />)

    const items = queryAllBody('[data-slot="item"]')
    const cherryItem = items[2]
    expect(cherryItem?.getAttribute('aria-disabled')).toBe('true')
  })

  test('renders a plain trigger icon', () => {
    const screen = render(() => <Select options={FRUITS} placeholder="Pick" />)
    const trigger = screen.container.querySelector('[data-slot="trigger"]')

    expect(trigger?.className).toContain('icon-chevron-down')
  })
})

describe('Select - search', () => {
  test('does not render input when showSearch is false', () => {
    const screen = render(() => <Select options={FRUITS} search={false} placeholder="Pick" />)

    expect(screen.getByRole('combobox')).not.toBeNull()
    expect(screen.container.querySelector('input[data-slot="input"]')).toBeNull()
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
      expect(items[0]?.textContent).toContain('Apple')
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
      expect(items[0]?.textContent).toContain('Banana')
    })
  })
})

describe('Select - groups', () => {
  test('renders group labels when open', () => {
    render(() => <Select options={GROUPED_OPTIONS} defaultOpen placeholder="Pick" />)

    const sectionLabels = queryAllBody('[data-slot="label"]')
    expect(sectionLabels.length).toBe(2)
    expect(sectionLabels[0]?.textContent).toBe('Fruits')
    expect(sectionLabels[1]?.textContent).toBe('Vegetables')
  })

  test('renders options within groups', () => {
    render(() => <Select options={GROUPED_OPTIONS} defaultOpen placeholder="Pick" />)

    const items = queryAllBody('[data-slot="item"]')
    expect(items.length).toBe(4)
  })

  test('forwards listbox and item props and lets item events prevent selection', async () => {
    const listboxRef = vi.fn()
    const itemRef = vi.fn()
    const onChange = vi.fn()
    render(() => (
      <Select
        options={FRUITS}
        defaultOpen
        onChange={onChange}
        listboxProps={{
          ref: listboxRef,
          'aria-label': 'Fruit options',
          'data-track': 'fruit-list',
          class: 'listbox-prop',
          style: { width: '240px' },
        }}
        itemProps={(option) => ({
          ref: option.value === 'apple' ? itemRef : undefined,
          'data-value': option.value,
          class: 'item-prop',
          style: { height: '40px' },
          onClick: (event) => event.preventDefault(),
        })}
      />
    ))
    const listbox = queryBody('[data-slot="listbox"]') as HTMLElement
    const apple = queryBody('[data-value="apple"]') as HTMLElement

    expect(listboxRef).toHaveBeenCalledWith(listbox)
    expect(itemRef).toHaveBeenCalledWith(apple)
    expect(listbox.getAttribute('data-track')).toBe('fruit-list')
    expect(listbox.className).toContain('listbox-prop')
    expect(listbox.style.width).toBe('240px')
    expect(apple.className).toContain('item-prop')
    expect(apple.style.height).toBe('40px')

    await fireEvent.click(apple)

    expect(onChange).not.toHaveBeenCalled()
  })

  test('does not add virtual ARIA metadata without virtualRender', () => {
    render(() => <Select options={GROUPED_OPTIONS} defaultOpen placeholder="Pick" />)

    const items = queryAllBody('[data-slot="item"]')
    expect(items.length).toBe(4)
    expect(items[0]?.getAttribute('aria-posinset')).toBeNull()
    expect(items[0]?.getAttribute('aria-setsize')).toBeNull()
  })

  test('renders grouped options through virtualRender when provided', () => {
    render(() => (
      <Select
        options={GROUPED_OPTIONS}
        defaultOpen
        placeholder="Pick"
        virtualRender={(context) => (
          <For each={context.entries}>
            {(entry) => context.render(entry, context.entries.indexOf(entry))}
          </For>
        )}
      />
    ))

    const sectionLabels = queryAllBody('[data-slot="label"]')
    const items = queryAllBody('[data-slot="item"]')

    expect(sectionLabels.length).toBe(2)
    expect(items.length).toBe(4)
    expect(items[0]?.getAttribute('aria-posinset')).toBe('1')
    expect(items[0]?.getAttribute('aria-setsize')).toBe('4')
  })

  test('renders a virtual window and scrolls keyboard highlights by flattened entry index', async () => {
    const [entryIndex, setEntryIndex] = createSignal(1)
    const scrollToItem = vi.fn()
    const screen = render(() => (
      <Select
        options={GROUPED_OPTIONS}
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
        placeholder="Pick"
      />
    ))
    const combobox = screen.getByRole('combobox')
    combobox.focus()

    await waitFor(() => {
      expect(queryAllBody('[data-slot="item"]').length).toBe(1)
      expect(queryBody('[data-slot="item"]')?.textContent).toContain('Apple')
    })

    await fireEvent.keyDown(combobox, { key: 'ArrowDown' })

    await waitFor(() => {
      const item = queryBody('[data-slot="item"]')
      expect(item?.textContent).toContain('Banana')
      expect(item?.getAttribute('data-index')).toBe('2')
      expect(combobox.getAttribute('aria-activedescendant')).toBe(item?.id)
    })
    expect(document.activeElement).toBe(combobox)
    expect(scrollToItem).toHaveBeenLastCalledWith(GROUPED_OPTIONS[0]?.children?.[1], 2)
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
        labelRender={(props) => (
          <span data-testid={`custom-label-${String(props.option.value)}`}>
            {props.option.label}
          </span>
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
        optionRender={(props) => (
          <span data-testid="custom-option">{props.option?.label} (custom)</span>
        )}
        placeholder="Pick"
      />
    ))

    const customOptions = document.body.querySelectorAll('[data-testid="custom-option"]')
    expect(customOptions.length).toBeGreaterThan(0)
  })

  test('passes selected state for normal items to optionRender', () => {
    const renderCalls: SelectT.OptionRenderProps[] = []

    render(() => (
      <Select
        options={FRUITS}
        value="apple"
        defaultOpen
        optionRender={(props) => {
          renderCalls.push(props)
          return <span data-testid="custom-option">{props.option?.label}</span>
        }}
        placeholder="Pick"
      />
    ))

    const appleState = renderCalls.find((call) => call.option?.value === 'apple')
    expect(appleState).toBeDefined()
    expect(appleState?.option?.isSelected).toBe(true)
  })
})

describe('Select - keyboard and ARIA', () => {
  test('trigger icon is not interactive', () => {
    const screen = render(() => <Select options={FRUITS} placeholder="Pick" />)
    const trigger = screen.container.querySelector('[data-slot="trigger"]')

    expect(trigger?.getAttribute('aria-hidden')).toBe('true')
  })

  test('when menu is open, Space selects focused single item and keeps focus', async () => {
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

    await fireEvent.keyDown(input, { key: ' ' })

    await waitFor(() => {
      expect(input.getAttribute('aria-expanded')).toBe('false')
    })

    expect(document.activeElement).toBe(input)
    expect(onChange).toHaveBeenCalledWith('banana')
  })

  test('opens with the selected option highlighted', async () => {
    const screen = render(() => <Select options={FRUITS} value="banana" placeholder="Pick" />)
    const input = screen.getByRole('combobox') as HTMLElement

    await fireEvent.click(input)

    await waitFor(() => {
      expect(queryBody('[data-slot="item"][data-highlighted]')?.textContent).toContain('Banana')
    })

    expect(input.getAttribute('aria-activedescendant')).toContain('Banana')
  })

  test('keeps selected highlight metadata when virtually rendered', async () => {
    const screen = render(() => (
      <Select
        options={GROUPED_OPTIONS}
        value="daikon"
        placeholder="Pick"
        virtualRender={(context) => (
          <For each={context.entries}>
            {(entry) => context.render(entry, context.entries.indexOf(entry))}
          </For>
        )}
      />
    ))
    const input = screen.getByRole('combobox') as HTMLElement

    await fireEvent.click(input)

    await waitFor(() => {
      expect(input.getAttribute('aria-expanded')).toBe('true')
      expect(queryBody('[data-slot="item"][data-highlighted]')?.textContent).toContain('Daikon')
    })

    const highlighted = queryBody('[data-slot="item"][data-highlighted]')

    expect(input.getAttribute('aria-activedescendant')).toBe(highlighted?.id)
    expect(highlighted?.getAttribute('aria-posinset')).toBe('4')
    expect(highlighted?.getAttribute('aria-setsize')).toBe('4')
  })

  test('scrolls the highlighted item into view when opened with an existing selection', async () => {
    const scrollIntoView = vi.fn()
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView

    HTMLElement.prototype.scrollIntoView = scrollIntoView

    try {
      const screen = render(() => <Select options={FRUITS} value="banana" placeholder="Pick" />)
      const input = screen.getByRole('combobox') as HTMLElement

      await fireEvent.click(input)

      await waitFor(() => {
        expect(queryBody('[data-slot="item"][data-highlighted]')?.textContent).toContain('Banana')
        expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' })
      })
    } finally {
      HTMLElement.prototype.scrollIntoView = originalScrollIntoView
    }
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

  test('input has combobox aria attributes when searchable', () => {
    const screen = render(() => <Select options={FRUITS} search placeholder="Pick" />)

    const input = screen.getByRole('combobox')
    expect(input.getAttribute('aria-haspopup')).toBe('listbox')
    expect(input.getAttribute('aria-autocomplete')).toBe('list')
  })

  test('propagates required and disabled state to root, control, and combobox', () => {
    const screen = render(() => (
      <Select options={FRUITS} required disabled placeholder="Pick a fruit" />
    ))

    const root = screen.container.querySelector('[data-slot="root"]')
    const control = screen.container.querySelector('[data-slot="control"]')
    const input = screen.getByRole('combobox')

    expect(root?.getAttribute('data-required')).toBe('')
    expect(root?.getAttribute('data-disabled')).toBe('')
    expect(control?.getAttribute('data-required')).toBe('')
    expect(control?.getAttribute('data-disabled')).toBe('')
    expect(input.getAttribute('aria-required')).toBe('true')
    expect(input.getAttribute('aria-disabled')).toBe('true')
  })
})

describe('Select - form integration', () => {
  test('serializes the selected scalar value through native form semantics', async () => {
    const screen = render(() => (
      <form>
        <Select name="fruit" options={FRUITS} defaultValue="apple" defaultOpen />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement

    expect(new FormData(form).getAll('fruit')).toEqual(['apple'])
    expect(form.querySelectorAll('select[name="fruit"]')).toHaveLength(1)

    const items = queryAllBody('[data-slot="item"]')
    await fireEvent.click(items[1]!)

    expect(new FormData(form).getAll('fruit')).toEqual(['banana'])
  })

  test('serializes numeric selections and omits disabled fields', () => {
    const screen = render(() => (
      <form>
        <Select name="count" options={[{ label: 'One', value: 1 }]} defaultValue={1} />
        <Select name="disabledFruit" options={FRUITS} defaultValue="apple" disabled />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const formData = new FormData(form)

    expect(formData.getAll('count')).toEqual(['1'])
    expect(formData.has('disabledFruit')).toBe(false)
  })

  test('uses the native select for required validity instead of unmatched search text', async () => {
    const screen = render(() => (
      <form>
        <Select name="fruit" options={FRUITS} required search placeholder="Search fruit" />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const input = screen.getByRole('combobox') as HTMLInputElement

    expect(form.checkValidity()).toBe(false)
    expect(input.name).toBe('')
    expect(input.required).toBe(false)
    await fireEvent.input(input, { target: { value: 'not a fruit' } })

    expect(form.checkValidity()).toBe(false)
    expect(new FormData(form).getAll('fruit')).toEqual([''])
  })
})

describe('Select - empty state', () => {
  test('renders optionRender null as empty state', async () => {
    const screen = render(() => (
      <Select
        options={FRUITS}
        search
        defaultOpen
        optionRender={(props) =>
          props.option ? (
            <span>{props.option.label}</span>
          ) : (
            <div data-slot="empty" data-testid="custom-empty">
              Nothing here!
            </div>
          )
        }
        placeholder="Search..."
      />
    ))

    const input = screen.getByRole('combobox') as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'zzzzz' } })

    await waitFor(() => {
      const emptyEl = queryBody('[data-testid="custom-empty"]')
      expect(emptyEl).not.toBeNull()
      expect(emptyEl?.textContent).toBe('Nothing here!')
    })
  })

  test('renders default "No options" text when optionRender does not handle empty state', async () => {
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
  test('clears unmatched searchable input when dismissed', async () => {
    const screen = render(() => (
      <Select search options={FRUITS} defaultOpen placeholder="Search..." />
    ))

    const input = screen.getByRole('combobox') as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'zzzzz' } })
    await fireEvent.keyDown(input, { key: 'Escape' })

    await waitFor(() => {
      expect(input.getAttribute('aria-expanded')).toBe('false')
      expect(input.value).toBe('')
    })
  })
})

describe('Select - popup behavior', () => {
  test('keeps content mounted with closed data attrs until exit motion finishes', async () => {
    const screen = render(() => <Select options={FRUITS} search defaultOpen placeholder="Pick" />)
    const input = screen.getByRole('combobox')

    await waitFor(() => {
      expect(queryBody('[data-slot="content"]')).not.toBeNull()
    })

    await fireEvent.keyDown(input, { key: 'Escape' })

    await waitFor(() => {
      const content = queryBody('[data-slot="content"]')
      expect(content).not.toBeNull()
      expect(content?.getAttribute('data-closed')).toBe('')
    })

    await finishSelectExitMotion()

    await waitFor(() => {
      expect(queryBody('[data-slot="content"]')).toBeNull()
    })
  })

  test('keeps the highlighted option until exit motion finishes', async () => {
    const screen = render(() => (
      <Select options={FRUITS} search defaultOpen defaultValue="banana" placeholder="Pick" />
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

  test('uses shared menu transition classes and configurable overflow padding', async () => {
    render(() => (
      <Select options={FRUITS} defaultOpen gutter={6} overflowPadding={12} placeholder="Pick" />
    ))

    await waitFor(() => {
      expect(queryBody('[data-slot="content"]')).not.toBeNull()
    })

    const content = queryBody('[data-slot="content"]') as HTMLElement
    expect(content.className).toContain('data-expanded:animate-menu-in')
    expect(content.className).toContain('data-closed:animate-menu-out')
    expect(content.className).toContain('animate-menu-side-bottom')

    await waitFor(() => {
      expect(content.style.getPropertyValue('--mo-popper-content-overflow-padding')).toBe('12px')
    })
  })

  test('syncs positioner z-index from popup content style', async () => {
    render(() => (
      <Select
        options={FRUITS}
        defaultOpen
        styles={{ content: { 'z-index': 70 } }}
        placeholder="Pick"
      />
    ))

    await waitFor(() => {
      const positioner = queryBody('[data-slot="positioner"]') as HTMLElement | null
      expect(positioner?.style.zIndex).toBe('70')
      expect(positioner?.style.position).toBe('absolute')
      expect(positioner?.classList.contains('absolute')).toBe(true)
      expect(positioner?.classList.contains('fixed')).toBe(false)
    })
  })
})

describe('Select - scroll bottom', () => {
  test('calls onScrollBottom once before leaving threshold', async () => {
    const onScrollBottom = vi.fn()

    render(() => (
      <Select
        options={FRUITS}
        defaultOpen
        onScrollBottom={onScrollBottom}
        scrollBottomThreshold={30}
        placeholder="Pick"
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
