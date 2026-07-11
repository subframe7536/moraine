import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { FormField } from '../form-field'

import { RadioGroup } from './radio-group'

describe('RadioGroup', () => {
  test('renders radio options with form-field label and no legacy wrappers', () => {
    const screen = render(() => (
      <FormField label="Plan" description="Select one plan">
        <RadioGroup items={['Basic', 'Pro']} />
      </FormField>
    ))

    expect(screen.getByText('Plan')).not.toBeNull()
    expect(screen.getByRole('radio', { name: 'Basic' })).not.toBeNull()
    expect(screen.getByRole('radio', { name: 'Pro' })).not.toBeNull()

    const group = screen.getByRole('radiogroup')
    const label = screen.getByText('Plan')

    expect(label.getAttribute('for')).toBeNull()
    expect(group.getAttribute('aria-describedby')).toContain('description')
    expect(screen.container.querySelector('[data-slot="fieldset"]')).toBeNull()
    expect(screen.container.querySelector('[data-slot="legend"]')).toBeNull()
    expect(screen.container.querySelector('[data-slot="container"]')).toBeNull()
  })

  test('exposes required, disabled and readonly state through aria and data attributes', () => {
    const disabledScreen = render(() => <RadioGroup required disabled items={['Basic', 'Pro']} />)
    const disabledGroup = disabledScreen.getByRole('radiogroup')
    const disabledRadio = disabledScreen.getByRole('radio', { name: 'Basic' }) as HTMLInputElement
    const disabledControl = disabledScreen.container.querySelector('[data-slot="control"]')

    expect(disabledGroup.getAttribute('aria-required')).toBe('true')
    expect(disabledGroup.getAttribute('aria-disabled')).toBe('true')
    expect(disabledGroup.getAttribute('data-required')).toBe('')
    expect(disabledGroup.getAttribute('data-disabled')).toBe('')
    expect(disabledRadio.required).toBe(true)
    expect(disabledRadio.disabled).toBe(true)
    expect(disabledRadio.getAttribute('aria-required')).toBe('true')
    expect(disabledRadio.getAttribute('aria-disabled')).toBe('true')
    expect(disabledControl?.getAttribute('data-required')).toBe('')
    expect(disabledControl?.getAttribute('data-disabled')).toBe('')

    disabledScreen.unmount()

    const readOnlyScreen = render(() => <RadioGroup readOnly items={['Basic']} />)
    const readOnlyGroup = readOnlyScreen.getByRole('radiogroup')
    const readOnlyRadio = readOnlyScreen.getByRole('radio', { name: 'Basic' }) as HTMLInputElement

    expect(readOnlyGroup.getAttribute('aria-readonly')).toBe('true')
    expect(readOnlyGroup.getAttribute('data-readonly')).toBe('')
    expect(readOnlyRadio.readOnly).toBe(true)
    expect(readOnlyRadio.getAttribute('aria-readonly')).toBe('true')
  })

  test('maps object items using default value/label/description fields', () => {
    const items = [{ value: 'pro', label: 'Pro', description: 'Best value' }]
    const screen = render(() => <RadioGroup items={items} />)

    const input = screen.container.querySelector('[data-slot="input"]')
    expect(input?.getAttribute('value')).toBe('pro')
    expect(screen.getByText('Best value')).not.toBeNull()
  })

  test('supports uncontrolled selection changes', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <RadioGroup items={['A', 'B']} defaultValue="A" onChange={onChange} />
    ))

    const radioA = screen.getByRole('radio', { name: 'A' }) as HTMLInputElement
    const radioB = screen.getByRole('radio', { name: 'B' }) as HTMLInputElement

    expect(radioA.checked).toBe(true)
    expect(radioB.checked).toBe(false)

    await fireEvent.click(radioB)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith('B')
    expect(radioB.checked).toBe(true)
  })

  test('changes selection with keyboard navigation', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <RadioGroup items={['A', 'B', 'C']} defaultValue="A" onChange={onChange} />
    ))

    const radioA = screen.getByRole('radio', { name: 'A' }) as HTMLInputElement
    const radioB = screen.getByRole('radio', { name: 'B' }) as HTMLInputElement
    const radioC = screen.getByRole('radio', { name: 'C' }) as HTMLInputElement

    radioA.focus()

    await fireEvent.keyDown(radioA, { key: 'ArrowDown' })
    expect(radioB.checked).toBe(true)

    await fireEvent.keyDown(radioB, { key: 'End' })
    expect(radioC.checked).toBe(true)

    await fireEvent.keyDown(radioC, { key: 'Home' })
    expect(radioA.checked).toBe(true)
    expect(onChange).toHaveBeenCalledWith('B')
    expect(onChange).toHaveBeenCalledWith('C')
    expect(onChange).toHaveBeenCalledWith('A')
  })

  test('keeps controlled value until parent updates', async () => {
    const onChange = vi.fn()
    const screen = render(() => <RadioGroup items={['A', 'B']} value="A" onChange={onChange} />)

    const radioA = screen.getByRole('radio', { name: 'A' }) as HTMLInputElement
    const radioB = screen.getByRole('radio', { name: 'B' }) as HTMLInputElement

    await fireEvent.click(radioB)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith('B')

    await waitFor(() => {
      expect(radioA.checked).toBe(true)
      expect(radioB.checked).toBe(false)
    })
  })

  test('applies horizontal table layout classes', () => {
    const screen = render(() => (
      <RadioGroup items={['A', 'B']} orientation="horizontal" variant="table" size="xl" />
    ))

    const group = screen.getByRole('radiogroup')
    const firstItem = screen.container.querySelector('[data-slot="item"]')
    const firstInput = screen.container.querySelector('[data-slot="input"]')
    const firstBase = screen.container.querySelector('[data-slot="control"]')

    expect(group.className).toContain('flex-row')
    expect(firstItem?.className).toContain('p-4.5')
    expect(firstItem?.className).toContain('first-of-type:rounded-s-lg')
    expect(firstItem?.className).toContain('last-of-type:rounded-e-lg')
    expect(firstItem?.className).toContain('not-first-of-type:-ms-px')
    expect(firstInput?.className).toContain('peer')
    expect(firstBase?.className).toContain('peer-focus-visible:effect-fv-border')
  })

  test('applies vertical table layout classes', () => {
    const screen = render(() => <RadioGroup items={['A', 'B']} variant="table" size="xl" />)

    const group = screen.getByRole('radiogroup')
    const firstItem = screen.container.querySelector('[data-slot="item"]')

    expect(group.className).toContain('flex-col')
    expect(firstItem?.className).toContain('first-of-type:rounded-t-lg')
    expect(firstItem?.className).toContain('last-of-type:rounded-b-lg')
    expect(firstItem?.className).toContain('not-first-of-type:-mt-px')
  })

  test('selects option when clicking table item container', async () => {
    const screen = render(() => <RadioGroup items={['A', 'B']} variant="table" defaultValue="A" />)

    const radioA = screen.getByRole('radio', { name: 'A' }) as HTMLInputElement
    const radioB = screen.getByRole('radio', { name: 'B' }) as HTMLInputElement
    const items = screen.container.querySelectorAll('[data-slot="item"]')

    expect(radioA.checked).toBe(true)
    expect(radioB.checked).toBe(false)

    await fireEvent.click(items[1] as HTMLElement)

    await waitFor(() => {
      expect(radioA.checked).toBe(false)
      expect(radioB.checked).toBe(true)
    })
  })

  test('does not select option when clicking list item container', async () => {
    const screen = render(() => <RadioGroup items={['A', 'B']} defaultValue="A" />)

    const radioA = screen.getByRole('radio', { name: 'A' }) as HTMLInputElement
    const radioB = screen.getByRole('radio', { name: 'B' }) as HTMLInputElement
    const items = screen.container.querySelectorAll('[data-slot="item"]')

    expect(radioA.checked).toBe(true)
    expect(radioB.checked).toBe(false)

    await fireEvent.click(items[1] as HTMLElement)

    await waitFor(() => {
      expect(radioA.checked).toBe(true)
      expect(radioB.checked).toBe(false)
    })
  })

  test('sets aria-readonly and prevents changes when readOnly', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <RadioGroup items={['Dogs', 'Cats', 'Dragons']} readOnly onChange={onChange} />
    ))

    const group = screen.getByRole('radiogroup')
    const dragons = screen.getByRole('radio', { name: 'Dragons' }) as HTMLInputElement

    expect(group.getAttribute('aria-readonly')).toBe('true')
    expect(dragons.checked).toBe(false)

    await fireEvent.click(dragons)

    expect(dragons.checked).toBe(false)
    expect(onChange).not.toHaveBeenCalled()
  })

  test('applies style overrides to item and radio slots', () => {
    const screen = render(() => (
      <RadioGroup
        items={['A']}
        styles={{
          item: { width: '200px' },
          control: { width: '200px' },
          label: { width: '200px' },
        }}
      />
    ))

    const item = screen.container.querySelector('[data-slot="item"]') as HTMLElement | null
    const base = screen.container.querySelector('[data-slot="control"]') as HTMLElement | null
    const label = screen.container.querySelector('[data-slot="label"]') as HTMLElement | null

    expect(item?.style.width).toBe('200px')
    expect(base?.style.width).toBe('200px')
    expect(label?.style.width).toBe('200px')
  })
})
