import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { Form } from '../form'
import { FormField } from '../form-field'

import { Checkbox } from './checkbox'

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

    const checkbox = screen.getByRole('checkbox', { name: 'Custom' }) as HTMLInputElement

    expect(checkbox.checked).toBe(true)
    expect(screen.getByTestId('checked-icon').textContent).toBe('C')

    await fireEvent.click(checkbox)

    expect(checkbox.checked).toBe(false)
  })

  test('passes id, name, value and required attributes to input', () => {
    const screen = render(() => (
      <Checkbox id="terms-checkbox" name="terms" value="accepted" required label="Terms" />
    ))

    const checkbox = screen.getByRole('checkbox', { name: 'Terms' })

    expect(checkbox.getAttribute('id')).toBe('terms-checkbox')
    expect(checkbox.getAttribute('name')).toBe('terms')
    expect(checkbox.getAttribute('value')).toBe('accepted')
    expect(checkbox.getAttribute('required')).not.toBeNull()
  })

  test('keeps controlled state while emitting onChange', async () => {
    const onChange = vi.fn()

    const screen = render(() => <Checkbox checked label="Controlled" onChange={onChange} />)
    const checkbox = screen.getByRole('checkbox', { name: 'Controlled' }) as HTMLInputElement

    await fireEvent.click(checkbox)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(false)

    await waitFor(() => {
      expect(checkbox.checked).toBe(true)
    })
  })

  test('integrates with form field aria and validation flow', async () => {
    const state = { agree: false }

    const screen = render(() => (
      <Form
        state={state}
        validateOnInputDelay={0}
        validate={(currentState) => {
          if (!currentState?.agree) {
            return [{ name: 'agree', message: 'You must agree' }]
          }

          return []
        }}
      >
        <FormField name="agree" label="Agree">
          <Checkbox
            checked={state.agree}
            onChange={(nextChecked) => {
              state.agree = nextChecked
            }}
          />
        </FormField>
      </Form>
    ))

    await fireEvent.submit(screen.container.querySelector('form') as HTMLFormElement)
    await waitFor(() => {
      expect(screen.getByText('You must agree')).not.toBeNull()
    })

    const checkbox = screen.getByRole('checkbox', { name: 'Agree' })
    expect(checkbox.getAttribute('aria-invalid')).toBe('true')

    await fireEvent.click(checkbox)

    await waitFor(() => {
      expect(screen.queryByText('You must agree')).toBeNull()
    })
  })

  test('updates form state for uncontrolled checkbox inside form', async () => {
    const state = { agree: false }

    const screen = render(() => (
      <Form
        state={state}
        validateOn={['change']}
        validateOnInputDelay={0}
        validate={(currentState) => {
          if (currentState?.agree) {
            return []
          }

          return [{ name: 'agree', message: 'You must agree' }]
        }}
      >
        <FormField name="agree" label="Agree">
          <Checkbox />
        </FormField>
      </Form>
    ))

    await fireEvent.submit(screen.container.querySelector('form') as HTMLFormElement)
    await waitFor(() => {
      expect(screen.getByText('You must agree')).not.toBeNull()
    })

    const checkbox = screen.getByRole('checkbox', { name: 'Agree' })
    await fireEvent.click(checkbox)

    await waitFor(() => {
      expect(state.agree).toBe(true)
      expect(screen.queryByText('You must agree')).toBeNull()
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
    const base = screen.container.querySelector('[data-slot="base"]')

    expect(root?.className).toContain('rounded-lg')
    expect(root?.className).toContain('data-checked:border-primary')
    expect(root?.className).toContain('flex-row-reverse')
    expect(root?.className).toContain('root-override')
    expect(input?.className).toContain('peer')
    expect(base?.className).toContain('peer-focus-visible:effect-fv-border')
    expect(base?.className).toContain('size-5')
  })

  test('toggles when clicking card root container', async () => {
    const screen = render(() => <Checkbox variant="card" label="Card root click" />)

    const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement
    const checkbox = screen.getByRole('checkbox', { name: 'Card root click' }) as HTMLInputElement

    expect(checkbox.checked).toBe(false)

    await fireEvent.click(root)

    await waitFor(() => {
      expect(checkbox.checked).toBe(true)
    })
  })

  test('does not toggle when clicking list root container', async () => {
    const screen = render(() => <Checkbox label="List root click" />)

    const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement
    const checkbox = screen.getByRole('checkbox', { name: 'List root click' }) as HTMLInputElement

    expect(checkbox.checked).toBe(false)

    await fireEvent.click(root)

    await waitFor(() => {
      expect(checkbox.checked).toBe(false)
    })
  })

  test('validates on change when validateOn is change', async () => {
    const state = { agree: false }

    const screen = render(() => (
      <Form
        state={state}
        validateOn={['change']}
        validateOnInputDelay={0}
        validate={(currentState) => {
          if (currentState?.agree) {
            return []
          }

          return [{ name: 'agree', message: 'You must agree' }]
        }}
      >
        <FormField name="agree" label="Agree">
          <Checkbox
            defaultChecked={state.agree}
            onChange={(nextChecked) => {
              state.agree = nextChecked
            }}
          />
        </FormField>
      </Form>
    ))

    const checkbox = screen.getByRole('checkbox', { name: 'Agree' })

    await fireEvent.click(checkbox)
    await waitFor(() => {
      expect(screen.queryByText('You must agree')).toBeNull()
    })

    await fireEvent.click(checkbox)
    await waitFor(() => {
      expect(screen.getByText('You must agree')).not.toBeNull()
    })

    await fireEvent.click(checkbox)
    await waitFor(() => {
      expect(screen.queryByText('You must agree')).toBeNull()
    })
  })

  test('validates on input when validateOn is input', async () => {
    const state = { agree: false }

    const screen = render(() => (
      <Form
        state={state}
        validateOn={['input']}
        validateOnInputDelay={0}
        validate={(currentState) => {
          if (currentState?.agree) {
            return []
          }

          return [{ name: 'agree', message: 'You must agree' }]
        }}
      >
        <FormField name="agree" label="Agree">
          <Checkbox
            checked={state.agree}
            onChange={(nextChecked) => {
              state.agree = nextChecked
            }}
          />
        </FormField>
      </Form>
    ))

    const checkbox = screen.getByRole('checkbox', { name: 'Agree' })

    await fireEvent.submit(screen.container.querySelector('form') as HTMLFormElement)
    await waitFor(() => {
      expect(screen.getByText('You must agree')).not.toBeNull()
    })

    await fireEvent.click(checkbox)
    await waitFor(() => {
      expect(screen.queryByText('You must agree')).toBeNull()
    })
  })
})
