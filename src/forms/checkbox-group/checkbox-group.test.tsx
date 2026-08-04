import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

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

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith(['A'])
    expectCheckboxChecked(checkboxA, true)

    await fireEvent.keyDown(checkboxA, { key: ' ' })

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
})
