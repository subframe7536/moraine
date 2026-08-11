import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createComponent, createSignal } from 'solid-js'
import { hydrate } from 'solid-js/web'
import * as v from 'valibot'
import { describe, expect, test, vi } from 'vitest'

import { installHydrationState, renderSsrFixture } from '../../test-utils/ssr-test.ts'
import { FormField } from '../form-field/form-field.tsx'
import { createForm, Form } from '../form/index.ts'

import { CheckboxGroup } from './checkbox-group.tsx'

function expectCheckboxChecked(element: Element, checked: boolean | 'mixed'): void {
  expect(element.getAttribute('aria-checked')).toBe(checked === 'mixed' ? 'mixed' : String(checked))
}

function getHiddenCheckbox(container: HTMLElement, value: string): HTMLInputElement {
  return container.querySelector(`input[type="checkbox"][value="${value}"]`) as HTMLInputElement
}

describe('CheckboxGroup', () => {
  test('renders legend and primitive items', () => {
    const screen = render(() => <CheckboxGroup legend="Fruits" items={['Apple', 'Banana']} />)

    expect(screen.getByText('Fruits')).not.toBeNull()
    expect(screen.getByRole('checkbox', { name: 'Apple' })).not.toBeNull()
    expect(screen.getByRole('checkbox', { name: 'Banana' })).not.toBeNull()
  })

  test('maps object items using default value/label/description fields', () => {
    const items = [{ value: 'a', label: 'Alpha', description: 'First option' }]
    const screen = render(() => <CheckboxGroup items={items} legend="Mapped" />)

    expect(getHiddenCheckbox(screen.container, 'a').getAttribute('value')).toBe('a')
    expect(screen.getByText('First option')).not.toBeNull()
  })

  test('supports indeterminate item state and icon for object items', async () => {
    const screen = render(() => (
      <CheckboxGroup
        legend="Mapped"
        items={[
          {
            value: 'a',
            label: 'Alpha',
            indeterminate: true,
            indeterminateIcon: <span data-testid="indeterminate-icon">I</span>,
          },
        ]}
      />
    ))

    const checkbox = screen.getByRole('checkbox', { name: 'Alpha' })
    const input = getHiddenCheckbox(screen.container, 'a')
    const control = screen.container.querySelector('[data-slot="control"]')

    await waitFor(() => {
      expect(input.indeterminate).toBe(true)
      expect(input.checked).toBe(false)
      expectCheckboxChecked(checkbox, 'mixed')
      expect(control?.getAttribute('data-indeterminate')).not.toBeNull()
      expect(screen.getByTestId('indeterminate-icon').textContent).toBe('I')
    })
  })

  test('supports uncontrolled value changes', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <CheckboxGroup items={['A', 'B']} defaultValue={['A']} onChange={onChange} />
    ))

    const checkboxA = screen.getByRole('checkbox', { name: 'A' })
    const checkboxB = screen.getByRole('checkbox', { name: 'B' })

    expectCheckboxChecked(checkboxA, true)
    expectCheckboxChecked(checkboxB, false)

    await fireEvent.click(checkboxB)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith(['A', 'B'])
    expectCheckboxChecked(checkboxB, true)
  })

  test('toggles item with Space key', async () => {
    const onChange = vi.fn()
    const screen = render(() => <CheckboxGroup items={['A', 'B']} onChange={onChange} />)

    const checkboxA = screen.getByRole('checkbox', { name: 'A' })

    await fireEvent.keyDown(checkboxA, { key: ' ' })
    await fireEvent.keyUp(checkboxA, { key: ' ' })
    expect(onChange).not.toHaveBeenCalled()
    await fireEvent.click(checkboxA)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith(['A'])
    expectCheckboxChecked(checkboxA, true)

    await fireEvent.keyDown(checkboxA, { key: ' ' })
    await fireEvent.keyUp(checkboxA, { key: ' ' })
    await fireEvent.click(checkboxA)

    expect(onChange).toHaveBeenCalledTimes(2)
    expect(onChange).toHaveBeenLastCalledWith([])
    expectCheckboxChecked(checkboxA, false)
  })

  test('does not toggle disabled group or item', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <CheckboxGroup
        disabled
        items={[
          'A',
          {
            value: 'B',
            label: 'B',
            disabled: true,
          },
        ]}
        onChange={onChange}
      />
    ))

    const checkboxA = screen.getByRole('checkbox', { name: 'A' })
    const checkboxB = screen.getByRole('checkbox', { name: 'B' })

    await fireEvent.click(checkboxA)
    await fireEvent.keyDown(checkboxB, { key: ' ' })

    expect(checkboxA.getAttribute('aria-disabled')).toBe('true')
    expect(checkboxB.getAttribute('aria-disabled')).toBe('true')
    expectCheckboxChecked(checkboxA, false)
    expectCheckboxChecked(checkboxB, false)
    expect(onChange).not.toHaveBeenCalled()
  })

  test('does not toggle readonly items', async () => {
    const onChange = vi.fn()
    const screen = render(() => <CheckboxGroup items={['A']} readOnly onChange={onChange} />)

    const checkboxA = screen.getByRole('checkbox', { name: 'A' })

    expect(checkboxA.getAttribute('aria-readonly')).toBe('true')

    await fireEvent.click(checkboxA)
    await fireEvent.keyDown(checkboxA, { key: ' ' })

    expectCheckboxChecked(checkboxA, false)
    expect(onChange).not.toHaveBeenCalled()
  })

  test('keeps controlled selection until parent updates', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <CheckboxGroup items={['A', 'B']} value={['A']} onChange={onChange} />
    ))

    const checkboxA = screen.getByRole('checkbox', { name: 'A' })
    const checkboxB = screen.getByRole('checkbox', { name: 'B' })

    await fireEvent.click(checkboxB)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith(['A', 'B'])

    await waitFor(() => {
      expectCheckboxChecked(checkboxA, true)
      expectCheckboxChecked(checkboxB, false)
    })
  })

  test('passes required and links legend to the fieldset', () => {
    const screen = render(() => (
      <CheckboxGroup
        id="channels"
        legend="Channels"
        items={[{ value: 'email', label: 'Email', description: 'Send email updates' }]}
        required
      />
    ))

    const fieldset = screen.container.querySelector('[data-slot="fieldset"]') as HTMLFieldSetElement
    const legend = screen.getByText('Channels')
    const checkbox = screen.getByRole('checkbox', { name: 'Email' })
    const input = getHiddenCheckbox(screen.container, 'email')
    const description = screen.getByText('Send email updates')

    expect(fieldset.getAttribute('aria-labelledby')).toBe(legend.getAttribute('id'))
    expect(checkbox.getAttribute('aria-required')).toBe('true')
    expect(input.getAttribute('required')).not.toBeNull()
    expect(description).not.toBeNull()
  })

  test('treats required as at least one enabled selection', async () => {
    const screen = render(() => (
      <form>
        <CheckboxGroup name="channels" legend="Channels" items={['Email', 'SMS']} required />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const fieldset = screen.container.querySelector('[data-slot="fieldset"]')!
    const inputs = Array.from(
      screen.container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
    )

    expect(fieldset.getAttribute('aria-required')).toBe('true')
    expect(inputs.filter((input) => input.required)).toHaveLength(1)
    expect(form.checkValidity()).toBe(false)

    await fireEvent.click(screen.getByRole('checkbox', { name: 'SMS' }))

    expect(inputs.every((input) => !input.required)).toBe(true)
    expect(form.checkValidity()).toBe(true)
    expect(new FormData(form).getAll('channels')).toEqual(['SMS'])

    await fireEvent.click(screen.getByRole('checkbox', { name: 'SMS' }))
    expect(inputs.filter((input) => input.required)).toHaveLength(1)
    expect(form.checkValidity()).toBe(false)
  })

  test('assigns required validity to the first enabled item and rejects stale selections', async () => {
    const [value, setValue] = createSignal(['missing'])
    const screen = render(() => (
      <form>
        <CheckboxGroup
          items={[
            { value: 'disabled', label: 'Disabled', disabled: true },
            { value: 'enabled', label: 'Enabled' },
          ]}
          value={value()}
          required
        />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const disabledInput = getHiddenCheckbox(screen.container, 'disabled')
    const enabledInput = getHiddenCheckbox(screen.container, 'enabled')

    expect(disabledInput.required).toBe(false)
    expect(enabledInput.required).toBe(true)
    expect(form.checkValidity()).toBe(false)

    setValue(['enabled'])

    await waitFor(() => {
      expect(enabledInput.required).toBe(false)
      expect(form.checkValidity()).toBe(true)
    })
  })

  test('gives duplicate values unique stable ids and serializes repeated entries in item order', async () => {
    const first = { value: 'same', label: 'First' }
    const second = { value: 'same', label: 'Second' }
    const [items, setItems] = createSignal([first, second])
    const onChange = vi.fn()
    const screen = render(() => (
      <form>
        <CheckboxGroup name="choices" items={items()} onChange={onChange} />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const firstControl = screen.getByRole('checkbox', { name: 'First' })
    const secondControl = screen.getByRole('checkbox', { name: 'Second' })
    const firstId = firstControl.id
    const secondId = secondControl.id

    expect(firstId).not.toBe(secondId)
    expect(screen.getByText('First').getAttribute('for')).toBe(firstId)
    expect(screen.getByText('Second').getAttribute('for')).toBe(secondId)

    await fireEvent.click(firstControl)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith(['same'])
    expect(new FormData(form).getAll('choices')).toEqual(['same', 'same'])

    setItems([second, first])
    expect(screen.getByRole('checkbox', { name: 'First' }).id).toBe(firstId)
    expect(screen.getByRole('checkbox', { name: 'Second' }).id).toBe(secondId)
    expect(new FormData(form).getAll('choices')).toEqual(['same', 'same'])
  })

  test('gives duplicate primitive empty values unique ids and preserves both form entries', async () => {
    const screen = render(() => (
      <form>
        <CheckboxGroup name="choices" items={['', '']} />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const controls = Array.from(
      screen.container.querySelectorAll<HTMLElement>('[data-slot="control"]'),
    )

    expect(controls).toHaveLength(2)
    expect(controls[0]?.id).not.toBe(controls[1]?.id)

    await fireEvent.click(controls[0]!)

    expect(new FormData(form).getAll('choices')).toEqual(['', ''])
  })

  test('applies horizontal table layout classes', () => {
    const screen = render(() => (
      <CheckboxGroup items={['A', 'B']} orientation="horizontal" variant="table" size="xl" />
    ))

    const fieldset = screen.container.querySelector('[data-slot="fieldset"]')
    const item = screen.container.querySelector('[data-slot="fieldset"] > [data-slot="root"]')

    expect(fieldset?.className).toContain('flex-row')
    expect(item?.className).toContain('border')
    expect(item?.className).toContain('rounded-none')
    expect(item?.className).toContain('p-4.5')
    expect(item?.className).toContain('first-of-type:rounded-s-lg')
    expect(item?.className).toContain('last-of-type:rounded-e-lg')
    expect(item?.className).toContain('not-first-of-type:-ms-px')
  })

  test('applies vertical table layout classes', () => {
    const screen = render(() => <CheckboxGroup items={['A', 'B']} variant="table" size="xl" />)

    const fieldset = screen.container.querySelector('[data-slot="fieldset"]')
    const item = screen.container.querySelector('[data-slot="fieldset"] > [data-slot="root"]')

    expect(fieldset?.className).toContain('flex-col')
    expect(item?.className).toContain('first-of-type:rounded-t-lg')
    expect(item?.className).toContain('last-of-type:rounded-b-lg')
    expect(item?.className).toContain('not-first-of-type:-mt-px')
  })

  test('renders checkbox items as direct fieldset children', () => {
    const screen = render(() => <CheckboxGroup items={['A', 'B']} variant="table" />)

    const directItems = screen.container.querySelectorAll(
      '[data-slot="fieldset"] > [data-slot="root"]',
    )

    expect(directItems).toHaveLength(2)
    expect(
      screen.container.querySelector(
        '[data-slot="fieldset"] > [data-slot="root"] [data-slot="root"]',
      ),
    ).toBeNull()
  })

  test('toggles item when clicking table item root', async () => {
    const screen = render(() => <CheckboxGroup items={['A']} variant="table" />)

    const checkbox = screen.getByRole('checkbox', { name: 'A' })
    const item = screen.container.querySelector('[data-slot="fieldset"] > [data-slot="root"]')

    expectCheckboxChecked(checkbox, false)

    await fireEvent.click(item as HTMLElement)

    await waitFor(() => {
      expectCheckboxChecked(checkbox, true)
    })
  })

  test('does not toggle item when clicking list item root', async () => {
    const screen = render(() => <CheckboxGroup items={['A', 'B']} defaultValue={['A']} />)

    const checkboxA = screen.getByRole('checkbox', { name: 'A' })
    const checkboxB = screen.getByRole('checkbox', { name: 'B' })
    const items = screen.container.querySelectorAll('[data-slot="fieldset"] > [data-slot="root"]')

    expectCheckboxChecked(checkboxA, true)
    expectCheckboxChecked(checkboxB, false)

    await fireEvent.click(items[1] as HTMLElement)

    await waitFor(() => {
      expectCheckboxChecked(checkboxA, true)
      expectCheckboxChecked(checkboxB, false)
    })
  })

  test('applies flattened classes to item and checkbox slots', () => {
    const screen = render(() => (
      <CheckboxGroup
        items={['A']}
        variant="table"
        classes={{
          item: 'item-override',
          control: 'control-override',
          label: 'label-override',
        }}
      />
    ))

    const item = screen.container.querySelector('[data-slot="fieldset"] > [data-slot="root"]')
    const base = screen.container.querySelector('[data-slot="control"]')
    const label = screen.container.querySelector('[data-slot="label"]')

    expect(item?.className).toContain('item-override')
    expect(base?.className).toContain('control-override')
    expect(label?.className).toContain('label-override')
  })

  test('applies style overrides to item and checkbox slots', () => {
    const screen = render(() => (
      <CheckboxGroup
        items={['A']}
        variant="table"
        styles={{
          root: { width: '200px' },
          control: { width: '200px' },
          label: { width: '200px' },
        }}
      />
    ))

    const item = screen.container.querySelector(
      '[data-slot="fieldset"] > [data-slot="root"]',
    ) as HTMLElement | null
    const base = screen.container.querySelector('[data-slot="control"]') as HTMLElement | null
    const label = screen.container.querySelector('[data-slot="label"]') as HTMLElement | null

    expect(item?.style.width).toBe('200px')
    expect(base?.style.width).toBe('200px')
    expect(label?.style.width).toBe('200px')
  })

  test('submits selected item values and resets to default selection', async () => {
    const screen = render(() => (
      <form>
        <CheckboxGroup name="choices" items={['A', 'B']} defaultValue={['A']} />
        <button type="reset">Reset</button>
      </form>
    ))

    const form = screen.container.querySelector('form') as HTMLFormElement
    const checkboxA = screen.getByRole('checkbox', { name: 'A' })
    const checkboxB = screen.getByRole('checkbox', { name: 'B' })

    expectCheckboxChecked(checkboxA, true)
    expectCheckboxChecked(checkboxB, false)
    expect(new FormData(form).getAll('choices')).toEqual(['A'])

    await fireEvent.click(checkboxA)
    await fireEvent.click(checkboxB)

    expect(new FormData(form).getAll('choices')).toEqual(['B'])

    form.reset()

    await waitFor(() => {
      expectCheckboxChecked(checkboxA, true)
      expectCheckboxChecked(checkboxB, false)
      expect(new FormData(form).getAll('choices')).toEqual(['A'])
    })
  })

  test('uses the initial default snapshot and preserves a controlled value on reset', async () => {
    const [defaultValue, setDefaultValue] = createSignal(['A'])
    const [controlledValue, setControlledValue] = createSignal<string[] | undefined>()
    const onChange = vi.fn()
    const screen = render(() => (
      <form>
        <CheckboxGroup
          items={['A', 'B']}
          defaultValue={defaultValue()}
          value={controlledValue()}
          onChange={onChange}
        />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement

    await fireEvent.click(screen.getByRole('checkbox', { name: 'B' }))
    expectCheckboxChecked(screen.getByRole('checkbox', { name: 'B' }), true)

    setDefaultValue(['B'])
    form.reset()
    await waitFor(() => {
      expectCheckboxChecked(screen.getByRole('checkbox', { name: 'A' }), true)
      expectCheckboxChecked(screen.getByRole('checkbox', { name: 'B' }), false)
    })

    setControlledValue(['B'])
    form.reset()
    await waitFor(() => {
      expectCheckboxChecked(screen.getByRole('checkbox', { name: 'A' }), false)
      expectCheckboxChecked(screen.getByRole('checkbox', { name: 'B' }), true)
    })
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  test('synchronizes external controlled values into FormField submission', async () => {
    const form = createForm({
      schema: v.object({ choices: v.array(v.string()) }),
      initialInput: { choices: [] },
    })
    const [value, setValue] = createSignal<string[]>([])
    const onSubmit = vi.fn()
    const screen = render(() => (
      <Form of={form} onSubmit={onSubmit}>
        <FormField name="choices" label="Choices">
          <CheckboxGroup items={['A', 'B']} value={value()} />
        </FormField>
      </Form>
    ))

    setValue(['B'])
    await fireEvent.submit(screen.container.querySelector('form')!)

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({ choices: ['B'] })
  })

  test('single-evaluates group JSX and collection props', () => {
    const reads = { checkedIcon: 0, indeterminateIcon: 0, items: 0, legend: 0 }
    const screen = render(() =>
      createComponent(CheckboxGroup, {
        get checkedIcon() {
          reads.checkedIcon += 1
          return <span>Checked</span>
        },
        get indeterminateIcon() {
          reads.indeterminateIcon += 1
          return <span>Mixed</span>
        },
        get items() {
          reads.items += 1
          return [{ value: 'a', label: 'Alpha', indeterminate: true }]
        },
        get legend() {
          reads.legend += 1
          return 'Options'
        },
      }),
    )

    expect(screen.getByText('Options')).not.toBeNull()
    expect(screen.getByText('Alpha')).not.toBeNull()
    expect(screen.getByText('Mixed')).not.toBeNull()
    expect(reads).toEqual({ checkedIcon: 0, indeterminateIcon: 1, items: 1, legend: 1 })
  })

  test('hydrates duplicate items with stable ids and DOM order before interaction', () => {
    const markup = renderSsrFixture(
      '/src/forms/checkbox-group/checkbox-group.ssr.fixture.tsx',
      'renderCheckboxGroupFixture',
    )
    const container = document.createElement('div')
    container.innerHTML = markup
    document.body.append(container)
    const serverRoot = container.querySelector('[data-slot="root"]')
    const [value, setValue] = createSignal<string[]>(['same'])
    const restoreHydrationState = installHydrationState()

    const dispose = hydrate(
      () => (
        <CheckboxGroup
          legend="Server options"
          items={[
            { value: 'same', label: 'First' },
            { value: 'same', label: 'Second' },
          ]}
          value={value()}
        />
      ),
      container,
    )
    const root = container.querySelector('[data-slot="root"]')!
    const controls = Array.from(container.querySelectorAll<HTMLElement>('[data-slot="control"]'))

    expect(root).toBe(serverRoot)
    expect(new Set(controls.map((control) => control.id)).size).toBe(2)
    expect(controls.map((control) => control.getAttribute('aria-checked'))).toEqual([
      'true',
      'true',
    ])

    setValue([])
    expect(controls.map((control) => control.getAttribute('aria-checked'))).toEqual([
      'false',
      'false',
    ])
    expect(
      Array.from(container.querySelector('[data-slot="fieldset"]')!.children).map((child) =>
        child.getAttribute('data-slot'),
      ),
    ).toEqual(['legend', 'root', 'root'])

    dispose()
    container.remove()
    restoreHydrationState()
  }, 15_000)
})
