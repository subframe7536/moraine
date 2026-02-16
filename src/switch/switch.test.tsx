import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { Form } from '../form'
import { FormField } from '../form-field'

import { Switch } from './switch'

describe('Switch', () => {
  test('renders label and description with accessible switch input', () => {
    const screen = render(() => <Switch label="Email alerts" description="Receive updates" />)

    const switchInput = screen.getByRole('switch', { name: 'Email alerts' })
    const label = screen.getByText('Email alerts')

    expect(switchInput).not.toBeNull()
    expect(label.getAttribute('for')).toBe(switchInput.getAttribute('id'))
    expect(screen.getByText('Receive updates')).not.toBeNull()
  })

  test('supports uncontrolled toggle', async () => {
    const screen = render(() => <Switch label="Marketing" />)
    const switchInput = screen.getByRole('switch', { name: 'Marketing' }) as HTMLInputElement

    expect(switchInput.checked).toBe(false)
    await fireEvent.click(switchInput)
    expect(switchInput.checked).toBe(true)
  })

  test('passes id, name, value and required attributes to input', () => {
    const screen = render(() => (
      <Switch id="newsletter-switch" name="newsletter" value="yes" required label="Newsletter" />
    ))

    const switchInput = screen.getByRole('switch', { name: 'Newsletter' })

    expect(switchInput.getAttribute('id')).toBe('newsletter-switch')
    expect(switchInput.getAttribute('name')).toBe('newsletter')
    expect(switchInput.getAttribute('value')).toBe('yes')
    expect(switchInput.getAttribute('required')).not.toBeNull()
  })

  test('keeps controlled state while emitting onChange', async () => {
    const onChange = vi.fn()
    const screen = render(() => <Switch checked label="Controlled" onChange={onChange} />)
    const switchInput = screen.getByRole('switch', { name: 'Controlled' }) as HTMLInputElement

    await fireEvent.click(switchInput)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(false)

    await waitFor(() => {
      expect(switchInput.checked).toBe(true)
    })
  })

  test('shows loading icon and disables interaction when loading', () => {
    const screen = render(() => (
      <Switch loading label="Loading" loadingIcon={<span data-testid="loading-icon">L</span>} />
    ))

    const switchInput = screen.getByRole('switch', { name: 'Loading' })
    expect((switchInput as HTMLInputElement).disabled).toBe(true)
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
    const switchInput = screen.getByRole('switch', { name: 'Icon state' }) as HTMLInputElement

    expect(screen.getByTestId('unchecked-icon').textContent).toBe('U')
    await fireEvent.click(switchInput)
    expect(screen.getByTestId('checked-icon').textContent).toBe('C')
  })

  test('integrates with form-field validation aria attributes', async () => {
    const state = { enabled: false }

    const screen = render(() => (
      <Form
        data-testid="form"
        state={state}
        validateOnInputDelay={0}
        validate={(currentState) => {
          if (currentState?.enabled) {
            return []
          }

          return [{ name: 'enabled', message: 'Enable this option' }]
        }}
      >
        <FormField name="enabled" label="Enable option">
          <Switch
            defaultChecked={state.enabled}
            onChange={(nextChecked) => {
              state.enabled = nextChecked
            }}
          />
        </FormField>
      </Form>
    ))

    await fireEvent.submit(screen.getByTestId('form'))

    await waitFor(() => {
      expect(screen.getByText('Enable this option')).not.toBeNull()
    })

    const switchInput = screen.getByRole('switch', { name: 'Enable option' })
    expect(switchInput.getAttribute('aria-invalid')).toBe('true')

    await fireEvent.click(switchInput)
    await waitFor(() => {
      expect(screen.queryByText('Enable this option')).toBeNull()
    })
  })

  test('applies xl size classes on base and wrapper', () => {
    const screen = render(() => <Switch label="Classes" size="xl" />)

    const base = screen.container.querySelector('[data-slot="base"]')
    const wrapper = screen.container.querySelector('[data-slot="wrapper"]')

    expect(base?.className).toContain('w-11')
    expect(wrapper?.className).toContain('text-base')
  })

  test('applies classes.root override', () => {
    const screen = render(() => <Switch label="Classes" classes={{ root: 'root-override' }} />)
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.className).toContain('root-override')
  })

  test('validates on change when validateOn is change', async () => {
    const state = { enabled: false }

    const screen = render(() => (
      <Form
        state={state}
        validateOn={['change']}
        validateOnInputDelay={0}
        validate={(currentState) => {
          if (currentState?.enabled) {
            return []
          }

          return [{ name: 'enabled', message: 'Enable this option' }]
        }}
      >
        <FormField name="enabled" label="Enable option">
          <Switch
            defaultChecked={state.enabled}
            onChange={(nextChecked) => {
              state.enabled = nextChecked
            }}
          />
        </FormField>
      </Form>
    ))

    const switchInput = screen.getByRole('switch', { name: 'Enable option' })

    await fireEvent.click(switchInput)
    await waitFor(() => {
      expect(screen.queryByText('Enable this option')).toBeNull()
    })

    await fireEvent.click(switchInput)
    await waitFor(() => {
      expect(screen.getByText('Enable this option')).not.toBeNull()
    })

    await fireEvent.click(switchInput)
    await waitFor(() => {
      expect(screen.queryByText('Enable this option')).toBeNull()
    })
  })

  test('validates on input when validateOn is input', async () => {
    const state = { enabled: false }

    const screen = render(() => (
      <Form
        data-testid="form"
        state={state}
        validateOn={['input']}
        validateOnInputDelay={0}
        validate={(currentState) => {
          if (currentState?.enabled) {
            return []
          }

          return [{ name: 'enabled', message: 'Enable this option' }]
        }}
      >
        <FormField name="enabled" label="Enable option">
          <Switch
            checked={state.enabled}
            onChange={(nextChecked) => {
              state.enabled = nextChecked
            }}
          />
        </FormField>
      </Form>
    ))

    const switchInput = screen.getByRole('switch', { name: 'Enable option' })

    await fireEvent.submit(screen.getByTestId('form'))
    await waitFor(() => {
      expect(screen.getByText('Enable this option')).not.toBeNull()
    })

    await fireEvent.click(switchInput)
    await waitFor(() => {
      expect(screen.queryByText('Enable this option')).toBeNull()
    })
  })
})
