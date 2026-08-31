import { getInput, setInput } from '@formisch/solid'
import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { For, createComponent, createSignal } from 'solid-js'
import * as v from 'valibot'
import { describe, expect, test, vi } from 'vitest'

import { renderWithOwner } from '../../test-utils/owner-render.tsx'
import { FormField } from '../form-field/index.ts'
import { createForm, Form } from '../form/index.ts'

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
  const contents = Array.from(document.body.querySelectorAll('[data-slot="content"]'))

  await Promise.all(
    contents.map(async (content) => {
      fireEvent.animationEnd(content)
      fireEvent.transitionEnd(content)
    }),
  )
}

test('single Select accepts arbitrary root props at type level', () => {
  const screen = render(() => (
    <>
      <Select options={FRUITS} multiple />
      <Select options={FRUITS} allowCreate tokenSeparators={[',']} maxCount={2} />
    </>
  ))

  expect(screen.getAllByRole('combobox')).toHaveLength(2)
})

test('uses input sizing classes in single mode', () => {
  const single = render(() => <Select options={FRUITS} size="sm" placeholder="SM" />)
  const singleInput = single.container.querySelector('[data-slot="input"]')

  expect(singleInput?.className).toContain('min-w-0')
  expect(singleInput?.className).toContain('text-xs')
})

test('keeps control spacing on the control instead of its icons and input', () => {
  const screen = render(() => (
    <Select options={FRUITS} size="md" leadingIcon="icon-search" placeholder="Pick" />
  ))
  const control = screen.container.querySelector('[data-slot="control"]') as HTMLElement
  const input = screen.container.querySelector('[data-slot="input"]') as HTMLElement
  const leading = screen.container.querySelector('[data-slot="leading"]') as HTMLElement
  const trigger = screen.container.querySelector('[data-slot="trigger"]') as HTMLElement

  expect(control.className).toContain('ps-2.5')
  expect(control.className).toContain('pe-2')
  expect(input.className).toContain('min-w-0')
  expect(input.className).not.toContain('mx-$s-p')
  expect(leading.className).not.toContain('ms-')
  expect(trigger.className).not.toContain('me-')
  expect(leading.className).not.toMatch(/(?:^|\s)size-/)
  expect(trigger.className).not.toMatch(/(?:^|\s)size-/)
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

  test('supports the compact form size scale', () => {
    const screen = render(() => (
      <>
        <Select options={FRUITS} size="sm" placeholder="SM" />
        <Select options={FRUITS} size="lg" placeholder="LG" />
      </>
    ))

    const inputs = screen.container.querySelectorAll('[data-slot="input"]')
    expect(inputs[0]?.className).toContain('text-xs')
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

    fireEvent.click(input)

    await waitFor(() => {
      expect(queryBody('[data-slot="content"]')).not.toBeNull()
    })
  })

  test('non-search control does not show focus ring on pointer click', async () => {
    const screen = render(() => <Select options={FRUITS} placeholder="Pick a fruit" />)
    const control = screen.container.querySelector('[data-slot="control"]') as HTMLElement

    fireEvent.pointerDown(control, { button: 0 })
    fireEvent.click(control)

    expect(control.className).toContain('focus-visible:effect-fv-border')
    expect(control.className).not.toContain('focus-within:effect-fv-border')
  })

  test('prevents mouse pointerdown but preserves touch and pen defaults', () => {
    const screen = render(() => <Select options={FRUITS} defaultOpen placeholder="Pick" />)
    const control = screen.container.querySelector('[data-slot="control"]') as HTMLElement
    const item = queryBody('[data-slot="item"]') as HTMLElement

    for (const element of [control, item]) {
      for (const pointerType of ['mouse', 'touch', 'pen']) {
        const event = new Event('pointerdown', { bubbles: true, cancelable: true })
        Object.defineProperty(event, 'pointerType', { value: pointerType })
        element.dispatchEvent(event)

        expect(event.defaultPrevented).toBe(pointerType === 'mouse')
      }
    }
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
    const combobox = screen.getByRole('combobox')

    fireEvent.pointerDown(control, { button: 0 })
    fireEvent.click(control)

    await waitFor(() => {
      expect(queryBody('[data-slot="content"]')).not.toBeNull()
    })

    expect(document.activeElement).toBe(combobox)
  })

  test('opens dropdown when trigger icon is clicked', async () => {
    const screen = render(() => <Select options={FRUITS} placeholder="Pick a fruit" />)
    const trigger = screen.container.querySelector('[data-slot="trigger"]') as HTMLElement

    expect(queryBody('[data-slot="content"]')).toBeNull()

    fireEvent.click(trigger)

    await waitFor(() => {
      expect(queryBody('[data-slot="content"]')).not.toBeNull()
    })
  })

  test('popup content width follows the trigger width', async () => {
    const screen = render(() => <Select options={FRUITS} placeholder="Pick a fruit" />)
    const input = screen.getByRole('combobox')

    fireEvent.click(input)

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

    fireEvent.click(input)

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
    expect(options[0]?.className).toContain('data-highlighted:bg-muted')
    expect(options[0]?.className).not.toContain('bg-accent-active')
  })

  test('selects an option and calls onChange', async () => {
    const onChange = vi.fn()
    render(() => <Select options={FRUITS} defaultOpen onChange={onChange} placeholder="Pick" />)

    const options = queryAllBody('[data-slot="item"]')
    fireEvent.click(options[0]!)

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

  test('keeps numeric and string values distinct when option keys are duplicated', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <Select<string | number>
        options={[
          { label: 'Numeric one', key: 'duplicate', value: 1 },
          { label: 'String one', key: 'duplicate', value: '1' },
          { label: 'Another string', key: 'duplicate', value: 'another' },
        ]}
        defaultValue={1}
        defaultOpen
        onChange={onChange}
      />
    ))
    const combobox = screen.getByRole('combobox')
    const items = Array.from(queryAllBody('[data-slot="item"]'))

    expect(new Set(items.map((item) => item.id)).size).toBe(3)
    expect(items.map((item) => item.getAttribute('aria-selected'))).toEqual([
      'true',
      'false',
      'false',
    ])

    fireEvent.click(items[1]!)

    expect(onChange).toHaveBeenCalledWith('1')
    expect(combobox.textContent).toBe('String one')
  })

  test('canonicalizes duplicate typed values to the first option without publishing no-op changes', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <form>
        <Select
          name="choice"
          options={[
            { label: 'First', value: 'same' },
            { label: 'Second', value: 'same' },
          ]}
          defaultValue="same"
          defaultOpen
          onChange={onChange}
        />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const items = Array.from(queryAllBody('[data-slot="item"]'))
    const nativeSelect = form.querySelector('select[name="choice"]') as HTMLSelectElement

    expect(new Set(items.map((item) => item.id)).size).toBe(2)
    expect(items.map((item) => item.getAttribute('aria-selected'))).toEqual(['true', 'false'])
    expect(Array.from(nativeSelect.options).filter((option) => option.selected)).toHaveLength(1)

    fireEvent.click(items[1]!)

    expect(screen.getByRole('combobox').textContent).toBe('First')
    expect(items.map((item) => item.getAttribute('aria-selected'))).toEqual(['true', 'false'])
    expect(new FormData(form).getAll('choice')).toEqual(['same'])
    expect(onChange).not.toHaveBeenCalled()
  })

  test('renders a plain trigger icon', () => {
    const screen = render(() => <Select options={FRUITS} placeholder="Pick" />)
    const trigger = screen.container.querySelector('[data-slot="trigger"]')

    expect(trigger?.className).toContain('icon-chevron-down')
  })

  test('renders and clears a selected value through the clear action', async () => {
    const onChange = vi.fn()
    const onClear = vi.fn()
    const screen = render(() => (
      <form>
        <Select
          name="fruit"
          options={FRUITS}
          search
          defaultOpen
          defaultValue="apple"
          allowClear
          closeIcon="icon-x"
          onChange={onChange}
          onClear={onClear}
        />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const input = screen.getByRole<HTMLInputElement>('combobox')
    const action = screen.getByRole('button', { name: 'Clear selection' })
    const pointerDown = new PointerEvent('pointerdown', { bubbles: true, cancelable: true })

    expect(action.querySelector('[data-slot="icon"]')?.className).toContain('icon-x')
    expect(action.className).toContain('hover:bg-muted-hover')

    input.focus()
    action.dispatchEvent(pointerDown)
    fireEvent.click(action)

    expect(pointerDown.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(input)
    expect(input.value).toBe('')
    expect(input.getAttribute('aria-expanded')).toBe('false')
    expect(new FormData(form).getAll('fruit')).toEqual([''])
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith(null)
    expect(onClear).toHaveBeenCalledOnce()
  })

  test('shows loading icon when loading is true even if selection is not empty and allowClear is true', () => {
    const screen = render(() => (
      <Select options={FRUITS} defaultValue="apple" loading allowClear placeholder="Pick" />
    ))

    const trigger = screen.container.querySelector('[data-slot="trigger"]')
    expect(trigger).not.toBeNull()
    expect(trigger?.getAttribute('data-loading')).toBe('')
    expect(trigger?.className).toContain('icon-loading')
    expect(trigger?.className).toContain('effect-loading')
    expect(screen.container.querySelector('[data-slot="clear"]')).toBeNull()
  })

  test('keeps a controlled value until the parent accepts clear', async () => {
    const [value, setValue] = createSignal<SelectT.Value | null>('apple')
    const onChange = vi.fn((nextValue: SelectT.Value | null) => setValue(nextValue))
    const screen = render(() => (
      <Select options={FRUITS} value={value()} allowClear onChange={onChange} placeholder="Pick" />
    ))

    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }))

    expect(screen.getByRole('combobox').textContent).toBe('Pick')
    expect(onChange).toHaveBeenCalledWith(null)
  })

  test('does not clear a disabled Select', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <Select options={FRUITS} value="apple" allowClear disabled onChange={onChange} />
    ))
    const action = screen.getByRole<HTMLButtonElement>('button', { name: 'Clear selection' })

    expect(action.disabled).toBe(true)
    fireEvent.click(action)

    expect(screen.getByRole('combobox').textContent).toBe('Apple')
    expect(onChange).not.toHaveBeenCalled()
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

    const input = screen.getByRole('combobox')
    expect(input.hasAttribute('readonly')).toBe(false)
  })

  test('leaves Space available for searchable text input', () => {
    const onChange = vi.fn()
    const screen = render(() => <Select options={FRUITS} search onChange={onChange} />)
    const input = screen.getByRole('combobox')
    const event = new KeyboardEvent('keydown', {
      key: ' ',
      bubbles: true,
      cancelable: true,
    })

    input.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
    expect(input.getAttribute('aria-expanded')).toBe('false')
    expect(onChange).not.toHaveBeenCalled()
  })

  test('opens menu when searchable input is clicked in control mode', async () => {
    const screen = render(() => <Select options={FRUITS} search placeholder="Search..." />)

    const input = screen.getByRole('combobox')

    fireEvent.click(input)

    await waitFor(() => {
      expect(input.getAttribute('aria-expanded')).toBe('true')
    })
  })

  test('dismisses menu when searchable input is clicked again in control mode', async () => {
    const screen = render(() => <Select options={FRUITS} search placeholder="Search..." />)
    const input = screen.getByRole('combobox')

    fireEvent.click(input)
    await waitFor(() => {
      expect(input.getAttribute('aria-expanded')).toBe('true')
    })

    fireEvent.click(input)
    await waitFor(() => {
      expect(input.getAttribute('aria-expanded')).toBe('false')
    })
  })

  test('calls onSearch with input value', async () => {
    const onSearch = vi.fn()
    const screen = render(() => (
      <Select options={FRUITS} search onSearch={onSearch} placeholder="Search..." />
    ))

    const input = screen.getByRole('combobox')
    fireEvent.input(input, { target: { value: 'app' } })

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

    const input = screen.getByRole('combobox')
    fireEvent.input(input, { target: { value: 'ap' } })

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

    const input = screen.getByRole('combobox')
    fireEvent.input(input, { target: { value: 'na' } })

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

  test('associates every non-virtual option group with its visible label', () => {
    render(() => <Select options={GROUPED_OPTIONS} defaultOpen placeholder="Pick" />)

    const groups = queryAllBody('[data-slot="group"][role="group"]')
    expect(groups).toHaveLength(2)

    for (const group of groups) {
      const label = group.querySelector('[data-slot="label"]')
      expect(label?.id).not.toBe('')
      expect(group.getAttribute('aria-labelledby')).toBe(label?.id)
    }
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

    fireEvent.click(apple)

    expect(onChange).not.toHaveBeenCalled()
  })

  test('does not select from pointer movement or cancellation alone', () => {
    const onChange = vi.fn()
    render(() => <Select options={FRUITS} defaultOpen onChange={onChange} />)
    const item = queryAllBody('[data-slot="item"]')[0]!

    fireEvent.pointerDown(item, { pointerType: 'touch' })
    fireEvent.pointerMove(item, { pointerType: 'touch' })
    fireEvent.pointerCancel(item, { pointerType: 'touch' })
    fireEvent.pointerUp(item, { pointerType: 'touch' })

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

  test('associates virtual groups with their labels and owned options', () => {
    render(() => (
      <Select
        options={GROUPED_OPTIONS}
        defaultOpen
        virtualRender={(context) => (
          <For each={context.entries}>
            {(entry) => context.render(entry, context.entries.indexOf(entry))}
          </For>
        )}
      />
    ))

    const groups = queryAllBody('[data-slot="group"][role="group"]')
    expect(groups).toHaveLength(2)

    for (const group of groups) {
      const label = group.querySelector('[data-slot="label"]')
      const ownedIds = group.getAttribute('aria-owns')?.split(' ') ?? []
      expect(group.getAttribute('aria-labelledby')).toBe(label?.id)
      expect(ownedIds).toHaveLength(2)
      expect(
        ownedIds.every((id) => document.getElementById(id)?.getAttribute('role') === 'option'),
      ).toBe(true)
    }
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

    fireEvent.keyDown(combobox, { key: 'ArrowDown' })

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
  test('keeps closed option render trees lazy and resolves render getters once when opened', async () => {
    const reads = { optionRender: 0, labelRender: 0 }
    const instances = { option: 0 }
    const screen = render(() =>
      createComponent(Select, {
        options: FRUITS,
        get optionRender() {
          reads.optionRender += 1
          return (props: SelectT.OptionRenderProps) => {
            instances.option += 1
            return <span>{props.option?.label}</span>
          }
        },
        get labelRender() {
          reads.labelRender += 1
          return (props: SelectT.LabelRenderProps) => <span>{props.option.label}</span>
        },
      }),
    )

    expect(queryBody('[data-slot="item"]')).toBeNull()
    expect(instances.option).toBe(0)
    expect(reads).toEqual({ optionRender: 1, labelRender: 1 })

    fireEvent.click(screen.getByRole('combobox'))

    expect(queryAllBody('[data-slot="item"]')).toHaveLength(3)
    expect(instances.option).toBe(3)
    expect(reads).toEqual({ optionRender: 1, labelRender: 1 })
  })

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
    const input = screen.getByRole('combobox')

    fireEvent.input(input, { target: { value: 'app' } })

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
    expect(appleState?.option?.isSelected).toBe(true)
    expect(appleState?.option?.label).toBe('Apple')
  })
})

describe('Select - keyboard and ARIA', () => {
  test('trigger icon is not interactive', () => {
    const screen = render(() => <Select options={FRUITS} placeholder="Pick" />)
    const trigger = screen.container.querySelector('[data-slot="trigger"]')

    expect(trigger?.getAttribute('aria-hidden')).toBe('true')
  })

  test('opens a closed non-search Select with Space without changing selection', async () => {
    const onChange = vi.fn()
    const screen = render(() => <Select options={FRUITS} onChange={onChange} placeholder="Pick" />)
    const combobox = screen.getByRole('combobox')
    const event = new KeyboardEvent('keydown', {
      key: ' ',
      bubbles: true,
      cancelable: true,
    })

    combobox.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    await waitFor(() => {
      expect(combobox.getAttribute('aria-expanded')).toBe('true')
    })
    expect(onChange).not.toHaveBeenCalled()
  })

  test.each(['Home', 'End'])('leaves a closed Select unchanged for %s', (key) => {
    const screen = render(() => <Select options={FRUITS} placeholder="Pick" />)
    const combobox = screen.getByRole('combobox')
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
    })

    combobox.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
    expect(combobox.getAttribute('aria-expanded')).toBe('false')
    expect(combobox.getAttribute('aria-activedescendant')).toBeNull()
  })

  test('commits printable-key typeahead while a non-search Select stays closed', () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <Select options={FRUITS} defaultValue="apple" onChange={onChange} placeholder="Pick" />
    ))
    const combobox = screen.getByRole('combobox')
    const event = new KeyboardEvent('keydown', {
      key: 'b',
      bubbles: true,
      cancelable: true,
    })

    combobox.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    expect(combobox.getAttribute('aria-expanded')).toBe('false')
    expect(combobox.textContent).toBe('Banana')
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith('banana')
  })

  test('cycles repeated typeahead characters while skipping disabled options', () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <Select
        options={[
          { label: 'Alpha', value: 'alpha' },
          { label: 'Alpine', value: 'alpine', disabled: true },
          { label: 'Atom', value: 'atom' },
        ]}
        defaultValue="alpha"
        onChange={onChange}
      />
    ))
    const combobox = screen.getByRole('combobox')

    fireEvent.keyDown(combobox, { key: 'a' })
    expect(combobox.textContent).toBe('Atom')

    fireEvent.keyDown(combobox, { key: 'a' })
    expect(combobox.textContent).toBe('Alpha')
    expect(onChange.mock.calls).toEqual([['atom'], ['alpha']])
  })

  test('treats Space as typeahead text until the search timeout expires', () => {
    vi.useFakeTimers()
    const onChange = vi.fn()
    const screen = render(() => <Select options={FRUITS} onChange={onChange} placeholder="Pick" />)
    const combobox = screen.getByRole('combobox')

    try {
      fireEvent.keyDown(combobox, { key: 'b' })
      const typeaheadSpace = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true,
        cancelable: true,
      })
      combobox.dispatchEvent(typeaheadSpace)

      expect(typeaheadSpace.defaultPrevented).toBe(true)
      expect(combobox.getAttribute('aria-expanded')).toBe('false')
      expect(combobox.textContent).toBe('Banana')

      vi.advanceTimersByTime(500)

      fireEvent.keyDown(combobox, { key: ' ' })
      expect(combobox.getAttribute('aria-expanded')).toBe('true')
      expect(onChange).toHaveBeenCalledOnce()
    } finally {
      screen.unmount()
      vi.useRealTimers()
    }
  })

  test('when menu is open, Space selects focused single item and keeps focus', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <>
        <Select options={FRUITS} onChange={onChange} placeholder="Pick" />
        <button type="button">Next</button>
      </>
    ))
    const input = screen.getByRole('combobox')

    input.focus()
    fireEvent.click(input)
    await waitFor(() => {
      expect(input.getAttribute('aria-expanded')).toBe('true')
    })

    fireEvent.keyDown(input, { key: 'ArrowDown' })

    fireEvent.keyDown(input, { key: ' ' })

    await waitFor(() => {
      expect(input.getAttribute('aria-expanded')).toBe('false')
    })

    expect(document.activeElement).toBe(input)
    expect(onChange).toHaveBeenCalledWith('banana')
  })

  test('does not run queued focus work after selection unmounts', async () => {
    const focus = vi.spyOn(HTMLElement.prototype, 'focus')
    const screen = render(() => <Select options={FRUITS} defaultOpen placeholder="Pick" />)
    const item = queryAllBody('[data-slot="item"]')[0]!

    focus.mockClear()
    item.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    screen.unmount()
    await Promise.resolve()

    expect(focus).not.toHaveBeenCalled()
    focus.mockRestore()
  })

  test('opens with the selected option highlighted', async () => {
    const screen = render(() => <Select options={FRUITS} value="banana" placeholder="Pick" />)
    const input = screen.getByRole('combobox')

    fireEvent.click(input)

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
    const input = screen.getByRole('combobox')

    fireEvent.click(input)

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
      const input = screen.getByRole('combobox')

      fireEvent.click(input)

      await waitFor(() => {
        expect(queryBody('[data-slot="item"][data-highlighted]')?.textContent).toContain('Banana')
        expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' })
      })
    } finally {
      HTMLElement.prototype.scrollIntoView = originalScrollIntoView
    }
  })

  test('does not run queued highlight scrolling after the popup closes', async () => {
    const scrollIntoView = vi.fn()
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView
    HTMLElement.prototype.scrollIntoView = scrollIntoView

    try {
      const screen = render(() => <Select options={FRUITS} defaultOpen placeholder="Pick" />)
      const input = screen.getByRole('combobox')
      await Promise.resolve()
      scrollIntoView.mockClear()

      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await Promise.resolve()

      expect(scrollIntoView).not.toHaveBeenCalled()
    } finally {
      HTMLElement.prototype.scrollIntoView = originalScrollIntoView
    }
  })

  test('does not prevent Tab when menu is closed', () => {
    const screen = render(() => <Select options={FRUITS} placeholder="Pick" />)
    const input = screen.getByRole('combobox')

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
    fireEvent.click(items[1]!)

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

  test('applies native select changes through typed option identity', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <form>
        <Select<string | number>
          name="choice"
          options={[
            { label: 'Numeric one', value: 1 },
            { label: 'String one', value: '1' },
          ]}
          defaultValue={1}
          onChange={onChange}
        />
      </form>
    ))
    const nativeSelect = screen.container.querySelector(
      'select[name="choice"]',
    ) as HTMLSelectElement
    const stringOption = Array.from(nativeSelect.options).find(
      (option) => option.textContent === 'String one',
    )!

    stringOption.selected = true
    fireEvent.change(nativeSelect)

    expect(screen.getByRole('combobox').textContent).toBe('String one')
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith('1')
  })

  test('restores controlled selection when a native change is rejected', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <form>
        <Select name="fruit" options={FRUITS} value="apple" onChange={onChange} />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const nativeSelect = form.querySelector('select[name="fruit"]') as HTMLSelectElement
    const banana = Array.from(nativeSelect.options).find((option) => option.value === 'banana')!

    banana.selected = true
    fireEvent.change(nativeSelect)

    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith('banana')
    expect(screen.getByRole('combobox').textContent).toBe('Apple')
    expect(nativeSelect.value).toBe('apple')
    expect(new FormData(form).getAll('fruit')).toEqual(['apple'])
  })

  test('commits a synchronously accepted controlled selection once', async () => {
    const [value, setValue] = createSignal('apple')
    const onChange = vi.fn((nextValue: string | null) => {
      if (nextValue !== null) {
        setValue(nextValue)
      }
    })
    const screen = render(() => (
      <form>
        <Select name="fruit" options={FRUITS} value={value()} onChange={onChange} defaultOpen />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement

    fireEvent.click(queryAllBody('[data-slot="item"]')[1]!)

    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith('banana')
    expect(screen.getByRole('combobox').textContent).toBe('Banana')
    expect(new FormData(form).getAll('fruit')).toEqual(['banana'])
  })

  test('keeps FormField aligned with the explicit controlled value', async () => {
    const [value, setValue] = createSignal('apple')
    const onChange = vi.fn()
    const { screen, value: form } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ fruit: v.string() }),
          initialInput: { fruit: 'apple' },
        }),
      (form) => (
        <Form of={form}>
          <FormField name="fruit" label="Fruit">
            <Select options={FRUITS} value={value()} onChange={onChange} defaultOpen />
          </FormField>
        </Form>
      ),
    )

    fireEvent.click(queryAllBody('[data-slot="item"]')[1]!)
    expect(onChange).toHaveBeenCalledWith('banana')
    expect(screen.getByRole('combobox').textContent).toBe('Apple')
    expect(getInput(form)).toEqual({ fruit: 'apple' })

    setValue('banana')
    expect(screen.getByRole('combobox').textContent).toBe('Banana')
    expect(getInput(form)).toEqual({ fruit: 'banana' })

    setInput(form, { path: ['fruit'], input: 'apple' })
    expect(screen.getByRole('combobox').textContent).toBe('Banana')
    expect(getInput(form)).toEqual({ fruit: 'banana' })
  })

  test('reacts to external Formisch input without publishing callbacks', () => {
    const onChange = vi.fn()
    const { screen, value: form } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ fruit: v.string() }),
          initialInput: { fruit: 'apple' },
        }),
      (form) => (
        <Form of={form}>
          <FormField name="fruit" label="Fruit">
            <Select options={FRUITS} onChange={onChange} />
          </FormField>
        </Form>
      ),
    )

    setInput(form, { path: ['fruit'], input: 'banana' })

    expect(screen.getByRole('combobox').textContent).toBe('Banana')
    expect(onChange).not.toHaveBeenCalled()
  })

  test('resets uncontrolled selection to the initial default snapshot without callbacks', async () => {
    const [defaultValue, setDefaultValue] = createSignal('apple')
    const onChange = vi.fn()
    const screen = render(() => (
      <form>
        <Select
          name="fruit"
          options={FRUITS}
          defaultValue={defaultValue()}
          defaultOpen
          onChange={onChange}
        />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const items = queryAllBody('[data-slot="item"]')

    setDefaultValue('banana')
    fireEvent.click(items[1]!)
    expect(screen.getByRole('combobox').textContent).toBe('Banana')

    form.reset()
    await Promise.resolve()

    expect(screen.getByRole('combobox').textContent).toBe('Apple')
    expect(new FormData(form).getAll('fruit')).toEqual(['apple'])
    expect(onChange).toHaveBeenCalledOnce()
  })

  test('restores the latest explicit controlled value on reset without callbacks', async () => {
    const [value, setValue] = createSignal('apple')
    const onChange = vi.fn()
    const screen = render(() => (
      <form>
        <Select name="fruit" options={FRUITS} value={value()} onChange={onChange} />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const nativeSelect = form.querySelector('select[name="fruit"]') as HTMLSelectElement

    setValue('banana')
    form.reset()
    await Promise.resolve()

    expect(screen.getByRole('combobox').textContent).toBe('Banana')
    expect(nativeSelect.value).toBe('banana')
    expect(new FormData(form).getAll('fruit')).toEqual(['banana'])
    expect(onChange).not.toHaveBeenCalled()
  })

  test('keeps the current selection when reset is canceled', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <form onReset={(event) => event.preventDefault()}>
        <Select
          name="fruit"
          options={FRUITS}
          defaultValue="apple"
          defaultOpen
          onChange={onChange}
        />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement

    fireEvent.click(queryAllBody('[data-slot="item"]')[1]!)
    form.reset()
    await Promise.resolve()

    expect(screen.getByRole('combobox').textContent).toBe('Banana')
    expect(new FormData(form).getAll('fruit')).toEqual(['banana'])
    expect(onChange).toHaveBeenCalledOnce()
  })

  test('clears selection once when the native select changes to its empty option', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <form>
        <Select
          name="fruit"
          options={FRUITS}
          defaultValue="apple"
          placeholder="Pick"
          onChange={onChange}
        />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const nativeSelect = form.querySelector('select[name="fruit"]') as HTMLSelectElement

    nativeSelect.options[0]!.selected = true
    fireEvent.change(nativeSelect)

    expect(screen.getByRole('combobox').textContent).toBe('Pick')
    expect(nativeSelect.value).toBe('')
    expect(new FormData(form).getAll('fruit')).toEqual([''])
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith(null)
  })

  test('uses the native select for required validity instead of unmatched search text', async () => {
    const screen = render(() => (
      <form>
        <Select name="fruit" options={FRUITS} required search placeholder="Search fruit" />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const input = screen.getByRole<HTMLInputElement>('combobox')

    expect(form.checkValidity()).toBe(false)
    expect(input.name).toBe('')
    expect(input.required).toBe(false)
    fireEvent.input(input, { target: { value: 'not a fruit' } })

    expect(form.checkValidity()).toBe(false)
    expect(new FormData(form).getAll('fruit')).toEqual([''])
  })

  test('displays and serializes an unmatched controlled value', () => {
    const screen = render(() => (
      <form>
        <Select name="fruit" options={FRUITS} value="dragonfruit" required placeholder="Pick" />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement

    expect(screen.getByRole('combobox').textContent).toBe('dragonfruit')
    expect(new FormData(form).getAll('fruit')).toEqual(['dragonfruit'])
    expect(form.checkValidity()).toBe(true)
  })

  test('resolves an unmatched controlled value when its option arrives', () => {
    const [options, setOptions] = createSignal(FRUITS)
    const screen = render(() => (
      <form>
        <Select name="fruit" options={options()} value="dragonfruit" />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement

    expect(screen.getByRole('combobox').textContent).toBe('dragonfruit')
    expect(form.querySelector('[data-unmatched-option]')).not.toBeNull()

    setOptions([...FRUITS, { label: 'Dragon fruit', value: 'dragonfruit', disabled: false }])

    expect(screen.getByRole('combobox').textContent).toBe('Dragon fruit')
    expect(form.querySelector('[data-unmatched-option]')).toBeNull()
    expect(new FormData(form).getAll('fruit')).toEqual(['dragonfruit'])
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

    const input = screen.getByRole<HTMLInputElement>('combobox')
    fireEvent.input(input, { target: { value: 'zzzzz' } })

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

    const input = screen.getByRole<HTMLInputElement>('combobox')
    fireEvent.input(input, { target: { value: 'zzzzz' } })

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

    const input = screen.getByRole<HTMLInputElement>('combobox')
    fireEvent.input(input, { target: { value: 'zzzzz' } })
    fireEvent.keyDown(input, { key: 'Escape' })

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

    fireEvent.keyDown(input, { key: 'Escape' })

    await waitFor(() => {
      const content = queryBody('[data-slot="content"]')
      const positioner = queryBody('[data-slot="positioner"]') as HTMLElement | null
      expect(content).not.toBeNull()
      expect(content?.getAttribute('data-closed')).toBe('')
      expect(positioner?.style.visibility).toBe('visible')
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

    fireEvent.keyDown(input, { key: 'Escape' })

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
    fireEvent.scroll(listbox)
    fireEvent.scroll(listbox)
    fireEvent.scroll(listbox)

    expect(onScrollBottom).toHaveBeenCalledTimes(1)

    listbox.scrollTop = 20
    fireEvent.scroll(listbox)

    listbox.scrollTop = 70
    fireEvent.scroll(listbox)

    expect(onScrollBottom).toHaveBeenCalledTimes(2)
  })
})
