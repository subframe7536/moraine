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
    expect(checkbox.getAttribute('aria-describedby')).toBe(
      `${checkbox.getAttribute('id')}-description`,
    )
  })

  test('combines local description with form field aria description', async () => {
    const state = { agree: false }

    const screen = render(() => (
      <Form state={state}>
        <FormField name="agree" label="Agree" description="Field description" help="Field help">
          <Checkbox description="Checkbox description" />
        </FormField>
      </Form>
    ))

    const checkbox = screen.getByRole('checkbox', { name: 'Agree' }) as HTMLInputElement
    const describedBy = checkbox.getAttribute('aria-describedby') ?? ''

    expect(screen.getByText('Field description')).not.toBeNull()
    expect(screen.getByText('Field help')).not.toBeNull()
    expect(screen.getByText('Checkbox description')).not.toBeNull()
    expect(describedBy).toContain('-description')
    expect(describedBy).toContain('-help')
    expect(describedBy).toContain(`${checkbox.id}-description`)
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

  test('toggles with Space key', async () => {
    const onChange = vi.fn()
    const screen = render(() => <Checkbox label="Keyboard" onChange={onChange} />)
    const checkbox = screen.getByRole('checkbox', { name: 'Keyboard' }) as HTMLInputElement

    await fireEvent.keyDown(checkbox, { key: ' ' })

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith(true)
    expect(checkbox.checked).toBe(true)

    await fireEvent.keyDown(checkbox, { key: ' ' })

    expect(onChange).toHaveBeenCalledTimes(2)
    expect(onChange).toHaveBeenLastCalledWith(false)
    expect(checkbox.checked).toBe(false)
  })

  test('does not toggle when disabled', async () => {
    const onChange = vi.fn()
    const screen = render(() => <Checkbox disabled label="Disabled" onChange={onChange} />)
    const checkbox = screen.getByRole('checkbox', { name: 'Disabled' }) as HTMLInputElement
    const control = screen.container.querySelector('[data-slot="control"]') as HTMLElement

    expect(checkbox.disabled).toBe(true)

    await fireEvent.click(checkbox)
    await fireEvent.click(control)
    await fireEvent.keyDown(checkbox, { key: ' ' })

    expect(checkbox.checked).toBe(false)
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

    const checkbox = screen.getByRole('checkbox', { name: 'Select all' }) as HTMLInputElement
    const root = screen.container.querySelector('[data-slot="root"]')

    await waitFor(() => {
      expect(checkbox.indeterminate).toBe(true)
      expect(checkbox.checked).toBe(false)
      expect(checkbox.getAttribute('aria-checked')).toBe('mixed')
      expect(root?.getAttribute('data-indeterminate')).not.toBeNull()
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
    }) as HTMLInputElement
    const root = screen.container.querySelector('[data-slot="root"]')

    await waitFor(() => {
      expect(checkbox.indeterminate).toBe(true)
      expect(checkbox.checked).toBe(false)
      expect(root?.getAttribute('data-indeterminate')).not.toBeNull()
      expect(screen.getByTestId('indeterminate-icon').textContent).toBe('I')
    })
  })

  test('passes id, name, value and required attributes to input', () => {
    const screen = render(() => (
      <Checkbox id="terms-checkbox" name="terms" value="accepted" required label="Terms" />
    ))

    const checkbox = screen.getByRole('checkbox', { name: 'Terms' })
    const root = screen.container.querySelector('[data-slot="root"]')
    const control = screen.container.querySelector('[data-slot="control"]')

    expect(checkbox.getAttribute('id')).toBe('terms-checkbox')
    expect(checkbox.getAttribute('name')).toBe('terms')
    expect(checkbox.getAttribute('value')).toBe('accepted')
    expect(checkbox.getAttribute('required')).not.toBeNull()
    expect(root?.getAttribute('data-required')).toBe('')
    expect(control?.getAttribute('data-required')).toBe('')
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

  test('does not toggle a controlled readonly checkbox', async () => {
    const onChange = vi.fn()
    const screen = render(() => <Checkbox checked readOnly label="Readonly" onChange={onChange} />)
    const checkbox = screen.getByRole('checkbox', { name: 'Readonly' }) as HTMLInputElement

    expect(checkbox.getAttribute('aria-readonly')).toBe('true')

    await fireEvent.click(checkbox)

    expect(checkbox.checked).toBe(true)
    expect(onChange).not.toHaveBeenCalled()

    await fireEvent.keyDown(checkbox, { key: ' ' })

    expect(checkbox.checked).toBe(true)
    expect(onChange).not.toHaveBeenCalled()
  })

  test('does not toggle an uncontrolled readonly checkbox', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <Checkbox readOnly label="Readonly uncontrolled" onChange={onChange} />
    ))
    const checkbox = screen.getByRole('checkbox', {
      name: 'Readonly uncontrolled',
    }) as HTMLInputElement

    await fireEvent.click(checkbox)

    expect(checkbox.checked).toBe(false)
    expect(onChange).not.toHaveBeenCalled()

    await fireEvent.keyDown(checkbox, { key: ' ' })

    expect(checkbox.checked).toBe(false)
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
    const checkbox = screen.getByRole('checkbox', { name: 'Status' }) as HTMLInputElement

    expect(checkbox.checked).toBe(true)

    await fireEvent.click(checkbox)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('inactive')

    await waitFor(() => {
      expect(checkbox.checked).toBe(true)
    })
  })

  test('derives checked state from custom form values', async () => {
    const state: { status: 'active' | 'inactive' } = { status: 'active' }

    const screen = render(() => (
      <Form state={state}>
        <FormField name="status" label="Status">
          <Checkbox trueValue="active" falseValue="inactive" />
        </FormField>
      </Form>
    ))

    const checkbox = screen.getByRole('checkbox', { name: 'Status' }) as HTMLInputElement

    expect(state.status).toBe('active')
    expect(checkbox.checked).toBe(true)

    await fireEvent.click(checkbox)

    await waitFor(() => {
      expect(state.status).toBe('inactive')
      expect(checkbox.checked).toBe(false)
    })

    await fireEvent.click(checkbox)

    await waitFor(() => {
      expect(state.status).toBe('active')
      expect(checkbox.checked).toBe(true)
    })
  })

  test('initializes form state from defaultChecked with custom values', async () => {
    const state: { status?: 'active' | 'inactive' } = {}

    const screen = render(() => (
      <Form state={state}>
        <FormField name="status" label="Status">
          <Checkbox defaultChecked trueValue="active" falseValue="inactive" />
        </FormField>
      </Form>
    ))

    const checkbox = screen.getByRole('checkbox', { name: 'Status' }) as HTMLInputElement

    await waitFor(() => {
      expect(state.status).toBe('active')
      expect(checkbox.checked).toBe(true)
    })
  })

  test('initializes form state to custom falseValue when unchecked by default', async () => {
    const state: { status?: 'active' | 'inactive' } = {}

    const screen = render(() => (
      <Form state={state}>
        <FormField name="status" label="Status">
          <Checkbox trueValue="active" falseValue="inactive" />
        </FormField>
      </Form>
    ))

    const checkbox = screen.getByRole('checkbox', { name: 'Status' }) as HTMLInputElement

    await waitFor(() => {
      expect(state.status).toBe('inactive')
      expect(checkbox.checked).toBe(false)
    })
  })

  test('does not overwrite existing form value on mount when defaultChecked differs', async () => {
    const state: { status: 'active' | 'inactive' } = { status: 'active' }

    const screen = render(() => (
      <Form state={state}>
        <FormField name="status" label="Status">
          <Checkbox defaultChecked={false} trueValue="active" falseValue="inactive" />
        </FormField>
      </Form>
    ))

    const checkbox = screen.getByRole('checkbox', { name: 'Status' }) as HTMLInputElement

    await waitFor(() => {
      expect(state.status).toBe('active')
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
              state.agree = Boolean(nextChecked)
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
    const checkbox = screen.getByRole('checkbox', { name: 'Agree' }) as HTMLInputElement

    expect(checkbox.checked).toBe(true)
    expect(new FormData(form).get('agree')).toBe('yes')

    await fireEvent.click(checkbox)

    expect(checkbox.checked).toBe(false)
    expect(new FormData(form).has('agree')).toBe(false)

    form.reset()

    await waitFor(() => {
      expect(checkbox.checked).toBe(true)
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
    expect(root?.className).toContain('data-checked:border-primary')
    expect(root?.className).toContain('flex-row-reverse')
    expect(root?.className).toContain('root-override')
    expect(input?.className).toContain('peer')
    expect(base?.className).toContain('peer-focus-visible:effect-fv-border')
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
    const checkbox = screen.container.querySelector(
      'input[type="checkbox"][data-slot="input"]',
    ) as HTMLInputElement
    const hitArea = root.querySelector(`label[for="${checkbox.id}"]`) as HTMLLabelElement

    expect(checkbox.checked).toBe(false)

    // JSDOM doesn't compute layout, so clicking the root won't hit the absolute-positioned label.
    await fireEvent.click(hitArea)

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
              state.agree = Boolean(nextChecked)
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
              state.agree = Boolean(nextChecked)
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
