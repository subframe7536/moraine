import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { Checkbox } from './checkbox.tsx'

function expectCheckboxChecked(element: Element, checked: boolean | 'mixed'): void {
  expect(element.getAttribute('aria-checked')).toBe(checked === 'mixed' ? 'mixed' : String(checked))
}

function getHiddenCheckbox(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[type="checkbox"][data-slot="input"]') as HTMLInputElement
}

describe('Checkbox', () => {
  test('renders label and description with accessible checkbox input', () => {
    const screen = render(() => (
      <Checkbox label="Accept terms" description="Required to continue" />
    ))

    const checkbox = screen.getByRole('checkbox', { name: 'Accept terms' })
    const label = screen.getByText('Accept terms')

    expect(checkbox).not.toBeNull()
    expect(label.getAttribute('for')).toBe(checkbox.getAttribute('id'))
    expect(screen.getByText('Required to continue')).not.toBeNull()
    expect(checkbox.getAttribute('aria-describedby')).toBe(
      `${checkbox.getAttribute('id')}-description`,
    )
  })

  test('supports uncontrolled toggle and custom checked icon content', async () => {
    const screen = render(() => (
      <Checkbox
        defaultChecked
        label="Custom"
        checkedIcon={<span data-testid="checked-icon">C</span>}
        indeterminateIcon={<span data-testid="indeterminate-icon">I</span>}
      />
    ))

    const checkbox = screen.getByRole('checkbox', { name: 'Custom' })

    expectCheckboxChecked(checkbox, true)
    expect(screen.getByTestId('checked-icon').textContent).toBe('C')

    await fireEvent.click(checkbox)

    expectCheckboxChecked(checkbox, false)
  })

  test('toggles with Space key', async () => {
    const onChange = vi.fn()
    const screen = render(() => <Checkbox label="Keyboard" onChange={onChange} />)
    const checkbox = screen.getByRole('checkbox', { name: 'Keyboard' })

    await fireEvent.keyDown(checkbox, { key: ' ' })

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith(true)
    expectCheckboxChecked(checkbox, true)

    await fireEvent.keyDown(checkbox, { key: ' ' })

    expect(onChange).toHaveBeenCalledTimes(2)
    expect(onChange).toHaveBeenLastCalledWith(false)
    expectCheckboxChecked(checkbox, false)
  })

  test('does not toggle when disabled', async () => {
    const onChange = vi.fn()
    const screen = render(() => <Checkbox disabled label="Disabled" onChange={onChange} />)
    const checkbox = screen.getByRole('checkbox', { name: 'Disabled' })
    const control = screen.container.querySelector('[data-slot="control"]') as HTMLElement

    expect(checkbox.getAttribute('aria-disabled')).toBe('true')

    await fireEvent.click(checkbox)
    await fireEvent.click(control)
    await fireEvent.keyDown(checkbox, { key: ' ' })

    expectCheckboxChecked(checkbox, false)
    expect(onChange).not.toHaveBeenCalled()
  })

  test('renders controlled indeterminate state with indeterminate icon', async () => {
    const screen = render(() => (
      <Checkbox
        checked="indeterminate"
        label="Select all"
        checkedIcon={<span data-testid="checked-icon">C</span>}
        indeterminateIcon={<span data-testid="indeterminate-icon">I</span>}
      />
    ))

    const checkbox = screen.getByRole('checkbox', { name: 'Select all' })
    const input = getHiddenCheckbox(screen.container)
    const control = screen.container.querySelector('[data-slot="control"]')

    await waitFor(() => {
      expect(input.indeterminate).toBe(true)
      expect(input.checked).toBe(false)
      expectCheckboxChecked(checkbox, 'mixed')
      expect(control?.getAttribute('data-indeterminate')).not.toBeNull()
      expect(screen.getByTestId('indeterminate-icon').textContent).toBe('I')
    })
  })

  test('renders default indeterminate state when defaultChecked is indeterminate', async () => {
    const screen = render(() => (
      <Checkbox
        defaultChecked="indeterminate"
        label="Default indeterminate"
        indeterminateIcon={<span data-testid="indeterminate-icon">I</span>}
      />
    ))

    const checkbox = screen.getByRole('checkbox', {
      name: 'Default indeterminate',
    })
    const input = getHiddenCheckbox(screen.container)
    const control = screen.container.querySelector('[data-slot="control"]')

    await waitFor(() => {
      expect(input.indeterminate).toBe(true)
      expect(input.checked).toBe(false)
      expectCheckboxChecked(checkbox, 'mixed')
      expect(control?.getAttribute('data-indeterminate')).not.toBeNull()
      expect(screen.getByTestId('indeterminate-icon').textContent).toBe('I')
    })
  })

  test('passes id, name, value and required attributes to input', () => {
    const screen = render(() => (
      <Checkbox id="terms-checkbox" name="terms" value="accepted" required label="Terms" />
    ))

    const checkbox = screen.getByRole('checkbox', { name: 'Terms' })
    const input = getHiddenCheckbox(screen.container)
    const control = screen.container.querySelector('[data-slot="control"]')

    expect(checkbox.getAttribute('id')).toBe('terms-checkbox')
    expect(input.getAttribute('id')).toBe('terms-checkbox-input')
    expect(input.getAttribute('name')).toBe('terms')
    expect(input.getAttribute('value')).toBe('accepted')
    expect(input.getAttribute('required')).not.toBeNull()
    expect(control?.getAttribute('data-required')).toBe('')
  })

  test('keeps controlled state while emitting onChange', async () => {
    const onChange = vi.fn()

    const screen = render(() => <Checkbox checked label="Controlled" onChange={onChange} />)
    const checkbox = screen.getByRole('checkbox', { name: 'Controlled' })

    await fireEvent.click(checkbox)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(false)

    await waitFor(() => {
      expectCheckboxChecked(checkbox, true)
    })
  })

  test('does not toggle a controlled readonly checkbox', async () => {
    const onChange = vi.fn()
    const screen = render(() => <Checkbox checked readOnly label="Readonly" onChange={onChange} />)
    const checkbox = screen.getByRole('checkbox', { name: 'Readonly' })

    expect(checkbox.getAttribute('aria-readonly')).toBe('true')

    await fireEvent.click(checkbox)

    expectCheckboxChecked(checkbox, true)
    expect(onChange).not.toHaveBeenCalled()

    await fireEvent.keyDown(checkbox, { key: ' ' })

    expectCheckboxChecked(checkbox, true)
    expect(onChange).not.toHaveBeenCalled()
  })

  test('does not toggle an uncontrolled readonly checkbox', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <Checkbox readOnly label="Readonly uncontrolled" onChange={onChange} />
    ))
    const checkbox = screen.getByRole('checkbox', {
      name: 'Readonly uncontrolled',
    })

    await fireEvent.click(checkbox)

    expectCheckboxChecked(checkbox, false)
    expect(onChange).not.toHaveBeenCalled()

    await fireEvent.keyDown(checkbox, { key: ' ' })

    expectCheckboxChecked(checkbox, false)
    expect(onChange).not.toHaveBeenCalled()
  })

  test('maps custom true and false values for controlled checkbox', async () => {
    const onChange = vi.fn()

    const screen = render(() => (
      <Checkbox
        checked="active"
        trueValue="active"
        falseValue="inactive"
        label="Status"
        onChange={onChange}
      />
    ))
    const checkbox = screen.getByRole('checkbox', { name: 'Status' })

    expectCheckboxChecked(checkbox, true)

    await fireEvent.click(checkbox)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('inactive')

    await waitFor(() => {
      expectCheckboxChecked(checkbox, true)
    })
  })

  test('submits hidden checkbox value only when checked and resets to default state', async () => {
    const onSubmit = vi.fn()
    const screen = render(() => (
      <form onSubmit={onSubmit}>
        <Checkbox name="agree" value="yes" defaultChecked label="Agree" />
        <button type="reset">Reset</button>
        <button type="submit">Submit</button>
      </form>
    ))

    const form = screen.container.querySelector('form') as HTMLFormElement
    const checkbox = screen.getByRole('checkbox', { name: 'Agree' })
    const input = getHiddenCheckbox(screen.container)

    expectCheckboxChecked(checkbox, true)
    expect(input.checked).toBe(true)
    expect(new FormData(form).get('agree')).toBe('yes')

    await fireEvent.click(checkbox)

    expectCheckboxChecked(checkbox, false)
    expect(input.checked).toBe(false)
    expect(new FormData(form).has('agree')).toBe(false)

    form.reset()

    await waitFor(() => {
      expectCheckboxChecked(checkbox, true)
      expect(input.checked).toBe(true)
      expect(new FormData(form).get('agree')).toBe('yes')
    })
  })

  test('applies card variant, end indicator and size classes', () => {
    const screen = render(() => (
      <Checkbox
        variant="card"
        indicator="end"
        size="xl"
        label="Classes"
        classes={{ root: 'root-override' }}
      />
    ))

    const root = screen.container.querySelector('[data-slot="root"]')
    const input = screen.container.querySelector('[data-slot="input"]')
    const base = screen.container.querySelector('[data-slot="control"]')

    expect(root?.className).toContain('rounded-lg')
    expect(root?.className).toContain('flex-row-reverse')
    expect(root?.className).toContain('root-override')
    expect(input?.className).toContain('peer')
    expect(base?.className).toContain('focus-visible:effect-fv-border')
    expect(base?.className).toContain('size-5')
  })

  test('applies style overrides', () => {
    const screen = render(() => (
      <Checkbox
        variant="card"
        label="Styles"
        styles={{
          root: { width: '200px' },
          control: { width: '200px' },
          label: { width: '200px' },
        }}
      />
    ))

    const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement | null
    const base = screen.container.querySelector('[data-slot="control"]') as HTMLElement | null
    const label = screen.container.querySelector('[data-slot="label"]') as HTMLElement | null

    expect(root?.style.width).toBe('200px')
    expect(base?.style.width).toBe('200px')
    expect(label?.style.width).toBe('200px')
  })

  test('toggles when clicking card root container', async () => {
    const screen = render(() => <Checkbox variant="card" label="Card root click" />)

    const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement
    const checkbox = screen.getByRole('checkbox', { name: 'Card root click' })

    expectCheckboxChecked(checkbox, false)

    await fireEvent.click(root)

    await waitFor(() => {
      expectCheckboxChecked(checkbox, true)
    })
  })

  test('does not toggle when clicking list root container', async () => {
    const screen = render(() => <Checkbox label="List root click" />)

    const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement
    const checkbox = screen.getByRole('checkbox', { name: 'List root click' })

    expectCheckboxChecked(checkbox, false)

    await fireEvent.click(root)

    await waitFor(() => {
      expectCheckboxChecked(checkbox, false)
    })
  })
})
