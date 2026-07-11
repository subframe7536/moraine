import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { Switch } from './switch'

function expectSwitchChecked(element: Element, checked: boolean): void {
  expect(element.getAttribute('aria-checked')).toBe(String(checked))
}

describe('Switch', () => {
  test('renders label and description with accessible switch input', () => {
    const screen = render(() => <Switch label="Email alerts" description="Receive updates" />)

    const switchInput = screen.getByRole('switch', { name: 'Email alerts' })
    const root = screen.container.querySelector('[data-slot="root"]')
    const track = screen.container.querySelector('[data-slot="track"]')

    expect(switchInput).not.toBeNull()
    const input = screen.container.querySelector('[data-slot="input"]')

    expect(root?.tagName).toBe('DIV')
    expect(track?.tagName).toBe('BUTTON')
    expect(input?.getAttribute('aria-hidden')).toBe('true')
    expect(screen.getByText('Receive updates')).not.toBeNull()
  })

  test('supports uncontrolled toggle', async () => {
    const screen = render(() => <Switch label="Marketing" />)
    const switchInput = screen.getByRole('switch', { name: 'Marketing' })

    expectSwitchChecked(switchInput, false)
    await fireEvent.click(switchInput)
    expectSwitchChecked(switchInput, true)
  })

  test('toggles with Space and Enter keys', async () => {
    const onChange = vi.fn()
    const screen = render(() => <Switch label="Keyboard" onChange={onChange} />)
    const switchInput = screen.getByRole('switch', { name: 'Keyboard' })

    await fireEvent.keyDown(switchInput, { key: ' ' })

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith(true)
    expectSwitchChecked(switchInput, true)

    await fireEvent.keyDown(switchInput, { key: 'Enter' })

    expect(onChange).toHaveBeenCalledTimes(2)
    expect(onChange).toHaveBeenLastCalledWith(false)
    expectSwitchChecked(switchInput, false)
  })

  test('does not toggle when disabled', async () => {
    const onChange = vi.fn()
    const screen = render(() => <Switch disabled label="Disabled" onChange={onChange} />)
    const switchInput = screen.getByRole('switch', { name: 'Disabled' })
    expect(switchInput.getAttribute('aria-disabled')).toBe('true')

    await fireEvent.click(switchInput)
    await fireEvent.keyDown(switchInput, { key: ' ' })
    await fireEvent.keyDown(switchInput, { key: 'Enter' })

    expectSwitchChecked(switchInput, false)
    expect(onChange).not.toHaveBeenCalled()
  })

  test('passes id, name, value and required attributes to input', () => {
    const screen = render(() => (
      <Switch id="newsletter-switch" name="newsletter" value="yes" required label="Newsletter" />
    ))

    const switchInput = screen.getByRole('switch', { name: 'Newsletter' })
    const input = screen.container.querySelector('[data-slot="input"]')

    expect(switchInput.getAttribute('id')).toBe('newsletter-switch')
    expect(input?.getAttribute('id')).toBe('newsletter-switch-input')
    expect(input?.getAttribute('name')).toBe('newsletter')
    expect(input?.getAttribute('value')).toBe('yes')
    expect(input?.getAttribute('required')).not.toBeNull()
  })

  test('keeps controlled state while emitting onChange', async () => {
    const onChange = vi.fn()
    const screen = render(() => <Switch checked label="Controlled" onChange={onChange} />)
    const switchInput = screen.getByRole('switch', { name: 'Controlled' })

    await fireEvent.click(switchInput)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(false)

    await waitFor(() => {
      expectSwitchChecked(switchInput, true)
    })
  })

  test('does not toggle a controlled readOnly switch', async () => {
    const onChange = vi.fn()
    const screen = render(() => <Switch checked readOnly label="Readonly" onChange={onChange} />)
    const switchInput = screen.getByRole('switch', { name: 'Readonly' })

    expect(switchInput.getAttribute('aria-readonly')).toBe('true')

    await fireEvent.click(switchInput)

    expectSwitchChecked(switchInput, true)
    expect(onChange).not.toHaveBeenCalled()

    await fireEvent.keyDown(switchInput, { key: ' ' })
    await fireEvent.keyDown(switchInput, { key: 'Enter' })

    expectSwitchChecked(switchInput, true)
    expect(onChange).not.toHaveBeenCalled()
  })

  test('does not toggle an uncontrolled readOnly switch', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <Switch readOnly label="Readonly uncontrolled" onChange={onChange} />
    ))
    const switchInput = screen.getByRole('switch', {
      name: 'Readonly uncontrolled',
    })

    await fireEvent.click(switchInput)

    expectSwitchChecked(switchInput, false)
    expect(onChange).not.toHaveBeenCalled()

    await fireEvent.keyDown(switchInput, { key: ' ' })
    await fireEvent.keyDown(switchInput, { key: 'Enter' })

    expectSwitchChecked(switchInput, false)
    expect(onChange).not.toHaveBeenCalled()
  })

  test('maps custom numeric values for controlled switch', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <Switch checked={1} trueValue={1} falseValue={0} label="Visibility" onChange={onChange} />
    ))
    const switchInput = screen.getByRole('switch', { name: 'Visibility' })

    expectSwitchChecked(switchInput, true)

    await fireEvent.click(switchInput)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(0)

    await waitFor(() => {
      expectSwitchChecked(switchInput, true)
    })
  })

  test('shows loading icon and disables interaction when loading', () => {
    const screen = render(() => (
      <Switch loading label="Loading" loadingIcon={<span data-testid="loading-icon">L</span>} />
    ))

    const switchInput = screen.getByRole('switch', { name: 'Loading' })
    expect(switchInput.getAttribute('aria-disabled')).toBe('true')
    expect(screen.getByTestId('loading-icon').textContent).toBe('L')
  })

  test('switches between unchecked and checked icons', async () => {
    const screen = render(() => (
      <Switch
        label="Icon state"
        checkedIcon={<span data-testid="checked-icon">C</span>}
        uncheckedIcon={<span data-testid="unchecked-icon">U</span>}
      />
    ))
    const switchInput = screen.getByRole('switch', { name: 'Icon state' })

    expect(screen.getByTestId('unchecked-icon').textContent).toBe('U')
    await fireEvent.click(switchInput)
    expect(screen.getByTestId('checked-icon').textContent).toBe('C')
  })

  test('submits hidden switch value only when checked and resets to default state', async () => {
    const screen = render(() => (
      <form>
        <Switch name="enabled" value="yes" defaultChecked label="Enabled" />
        <button type="reset">Reset</button>
      </form>
    ))

    const form = screen.container.querySelector('form') as HTMLFormElement
    const switchInput = screen.getByRole('switch', { name: 'Enabled' })

    expectSwitchChecked(switchInput, true)
    expect(new FormData(form).get('enabled')).toBe('yes')

    await fireEvent.click(switchInput)

    expectSwitchChecked(switchInput, false)
    expect(new FormData(form).has('enabled')).toBe(false)

    form.reset()

    await waitFor(() => {
      expectSwitchChecked(switchInput, true)
      expect(new FormData(form).get('enabled')).toBe('yes')
    })
  })

  test('applies xl size classes on base and wrapper', () => {
    const screen = render(() => <Switch label="Classes" size="xl" />)

    const root = screen.container.querySelector('[data-slot="root"]')
    const input = screen.container.querySelector('[data-slot="input"]')
    const track = screen.container.querySelector('[data-slot="track"]')
    const wrapper = screen.container.querySelector('[data-slot="wrapper"]')

    expect(root?.className).toContain('flex flex-row')
    expect(track?.className).toContain('cursor-pointer')
    expect(input?.className).toContain('peer')
    expect(track?.className).toContain('focus-visible:effect-fv-border')
    expect(track?.className).toContain('w-11')
    expect(wrapper?.className).toContain('ms-3')
    expect(wrapper?.className).toContain('text-base')
  })

  test('applies compact wrapper spacing on xs size', () => {
    const screen = render(() => <Switch label="Compact" size="xs" />)
    const wrapper = screen.container.querySelector('[data-slot="wrapper"]')

    expect(wrapper?.className).toContain('ms-1.5')
    expect(wrapper?.className).toContain('text-xs')
  })

  test('applies styles.root override', () => {
    const screen = render(() => <Switch label="Classes" styles={{ root: { width: '200px' } }} />)
    const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement | null

    expect(root?.style.width).toBe('200px')
  })
})
