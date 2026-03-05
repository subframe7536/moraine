import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { Form } from '../form'
import { FormField } from '../form-field'

import { RadioGroup } from './radio-group'

describe('RadioGroup', () => {
  test('renders legend and radio options', () => {
    const screen = render(() => <RadioGroup legend="Plan" items={['Basic', 'Pro']} />)

    expect(screen.getByText('Plan')).not.toBeNull()
    expect(screen.getByRole('radio', { name: 'Basic' })).not.toBeNull()
    expect(screen.getByRole('radio', { name: 'Pro' })).not.toBeNull()
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

  test('integrates with form-field aria validation', async () => {
    const state = { plan: '' }

    const screen = render(() => (
      <Form
        state={state}
        validateOnInputDelay={0}
        validate={(currentState) => {
          if (currentState?.plan) {
            return []
          }

          return [{ name: 'plan', message: 'Select a plan' }]
        }}
      >
        <FormField name="plan" label="Plan">
          <RadioGroup
            items={['Basic', 'Pro']}
            value={state.plan}
            onChange={(nextValue) => {
              state.plan = nextValue
            }}
          />
        </FormField>
      </Form>
    ))

    await fireEvent.submit(screen.container.querySelector('form') as HTMLFormElement)

    await waitFor(() => {
      expect(screen.getByText('Select a plan')).not.toBeNull()
    })

    const group = screen.getByRole('radiogroup')
    expect(group.getAttribute('aria-invalid')).toBe('true')

    const radio = screen.getByRole('radio', { name: 'Pro' })
    await fireEvent.click(radio)

    await waitFor(() => {
      expect(screen.queryByText('Select a plan')).toBeNull()
    })
  })

  test('applies horizontal table layout classes', () => {
    const screen = render(() => (
      <RadioGroup items={['A', 'B']} orientation="horizontal" variant="table" size="xl" />
    ))

    const fieldset = screen.container.querySelector('[data-slot="fieldset"]')
    const firstItem = screen.container.querySelector('[data-slot="item"]')
    const firstInput = screen.container.querySelector('[data-slot="input"]')
    const firstBase = screen.container.querySelector('[data-slot="base"]')

    expect(fieldset?.className).toContain('flex-row')
    expect(firstItem?.className).toContain('border')
    expect(firstItem?.className).toContain('border-muted')
    expect(firstItem?.className).toContain('p-4.5')
    expect(firstItem?.className).toContain('first-of-type:rounded-s-lg')
    expect(firstItem?.className).toContain('last-of-type:rounded-e-lg')
    expect(firstItem?.className).toContain('not-first-of-type:-ms-px')
    expect(firstInput?.className).toContain('peer')
    expect(firstBase?.className).toContain('peer-focus-visible:effect-fv-border')
  })

  test('applies vertical table layout classes', () => {
    const screen = render(() => <RadioGroup items={['A', 'B']} variant="table" size="xl" />)

    const fieldset = screen.container.querySelector('[data-slot="fieldset"]')
    const firstItem = screen.container.querySelector('[data-slot="item"]')

    expect(fieldset?.className).toContain('flex-col')
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

  test('validates on change when validateOn is change', async () => {
    const state = { plan: '' }

    const screen = render(() => (
      <Form
        state={state}
        validateOn={['change']}
        validateOnInputDelay={0}
        validate={(currentState) => {
          if (currentState?.plan === 'Pro') {
            return []
          }

          return [{ name: 'plan', message: 'Select Pro' }]
        }}
      >
        <FormField name="plan" label="Plan">
          <RadioGroup
            id="plan-input"
            items={['Basic', 'Pro']}
            defaultValue={state.plan}
            onChange={(nextValue) => {
              state.plan = nextValue
            }}
          />
        </FormField>
      </Form>
    ))

    await fireEvent.click(screen.getByRole('radio', { name: 'Basic' }))
    await waitFor(() => {
      expect(screen.getByText('Select Pro')).not.toBeNull()
    })

    await fireEvent.click(screen.getByRole('radio', { name: 'Pro' }))
    await waitFor(() => {
      expect(screen.queryByText('Select Pro')).toBeNull()
    })
  })

  test('validates on input when validateOn is input', async () => {
    const state = { plan: '' }

    const screen = render(() => (
      <Form
        state={state}
        validateOn={['input']}
        validateOnInputDelay={0}
        validate={(currentState) => {
          if (currentState?.plan === 'Pro') {
            return []
          }

          return [{ name: 'plan', message: 'Select Pro' }]
        }}
      >
        <FormField name="plan" label="Plan">
          <RadioGroup
            id="plan-input"
            items={['Basic', 'Pro']}
            defaultValue={state.plan}
            onChange={(nextValue) => {
              state.plan = nextValue
            }}
          />
        </FormField>
      </Form>
    ))

    await fireEvent.click(screen.getByRole('radio', { name: 'Basic' }))
    await waitFor(() => {
      expect(screen.getByText('Select Pro')).not.toBeNull()
    })

    await fireEvent.click(screen.getByRole('radio', { name: 'Pro' }))
    await waitFor(() => {
      expect(screen.queryByText('Select Pro')).toBeNull()
    })
  })

  test('does not bind form-field label for grouped controls', () => {
    const state = { plan: '' }

    const screen = render(() => (
      <Form state={state} validate={() => []}>
        <FormField name="plan" label="Radio group">
          <RadioGroup id="plan-input" items={['Basic', 'Pro']} defaultValue={state.plan} />
        </FormField>
      </Form>
    ))

    const label = screen.getByText('Radio group')
    expect(label.getAttribute('for')).toBeNull()
  })
})
