import { fireEvent, render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { CheckControl } from './check-control'

describe('CheckControl', () => {
  test('exposes the check state through aria-checked and data attributes', () => {
    const [checked, setChecked] = createSignal<boolean | 'indeterminate'>(false)
    const { getByRole } = render(() => (
      <CheckControl
        slotName="test-check"
        aria-label="Select"
        checked={checked()}
        onCheckedChange={() => {}}
      />
    ))
    const control = getByRole('checkbox', { name: 'Select' })
    expect(control.getAttribute('data-slot')).toBe('test-check')
    expect(control.getAttribute('aria-checked')).toBe('false')
    expect(control.hasAttribute('data-unchecked')).toBe(true)
    expect(control.querySelector('[data-slot="test-check-icon"]')).toBeNull()

    setChecked('indeterminate')
    expect(control.getAttribute('aria-checked')).toBe('mixed')
    expect(control.hasAttribute('data-indeterminate')).toBe(true)
    const icon = control.querySelector('[data-slot="test-check-icon"]')!
    expect(icon.className).toContain('icon-minus')

    setChecked(true)
    expect(control.getAttribute('aria-checked')).toBe('true')
    expect(control.hasAttribute('data-checked')).toBe(true)
    expect(control.querySelector('[data-slot="test-check-icon"]')!.className).toContain(
      'icon-check',
    )
  })

  test('reports the next value and checks an indeterminate control', () => {
    const onCheckedChange = vi.fn()
    const [checked, setChecked] = createSignal<boolean | 'indeterminate'>('indeterminate')
    const { getByRole } = render(() => (
      <CheckControl slotName="test-check" checked={checked()} onCheckedChange={onCheckedChange} />
    ))

    fireEvent.click(getByRole('checkbox'))
    expect(onCheckedChange).toHaveBeenLastCalledWith(true)

    setChecked(true)
    fireEvent.click(getByRole('checkbox'))
    expect(onCheckedChange).toHaveBeenLastCalledWith(false)
  })

  test('skips the change when disabled or when onClick prevents default', () => {
    const onCheckedChange = vi.fn()
    const [disabled, setDisabled] = createSignal(true)
    const { getByRole } = render(() => (
      <CheckControl
        slotName="test-check"
        checked={false}
        disabled={disabled()}
        onClick={(event) => event.preventDefault()}
        onCheckedChange={onCheckedChange}
      />
    ))
    const control = getByRole('checkbox')
    expect(control.hasAttribute('disabled')).toBe(true)
    expect(control.hasAttribute('data-disabled')).toBe(true)

    setDisabled(false)
    fireEvent.click(control)
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  test('does not let Enter activate the control', () => {
    const { getByRole } = render(() => (
      <CheckControl slotName="test-check" checked={false} onCheckedChange={() => {}} />
    ))
    const control = getByRole('checkbox')

    expect(fireEvent.keyDown(control, { key: 'Enter' })).toBe(false)
    expect(fireEvent.keyDown(control, { key: ' ' })).toBe(true)
  })
})
