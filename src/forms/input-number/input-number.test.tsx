import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { Form } from '../form'
import { FormField } from '../form-field'

import { InputNumber } from './input-number'

describe('InputNumber', () => {
  test('renders number input with increment and decrement controls', () => {
    const screen = render(() => <InputNumber defaultValue={1} placeholder="Qty" />)

    expect(screen.getByRole('spinbutton')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Increment' })).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Decrement' })).not.toBeNull()
  })

  test('supports uncontrolled increment and decrement behavior', async () => {
    const screen = render(() => <InputNumber defaultValue={1} />)
    const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement
    const incrementButton = screen.getByRole('button', { name: 'Increment' })
    const decrementButton = screen.getByRole('button', { name: 'Decrement' })

    expect(spinbutton.value).toBe('1')

    await fireEvent.click(incrementButton)
    expect(spinbutton.value).toBe('2')

    await fireEvent.click(decrementButton)
    expect(spinbutton.value).toBe('1')
  })

  test('keeps controlled value while emitting onRawValueChange', async () => {
    const onRawValueChange = vi.fn()
    const screen = render(() => <InputNumber value={5} onRawValueChange={onRawValueChange} />)
    const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement
    const incrementButton = screen.getByRole('button', { name: 'Increment' })

    await fireEvent.click(incrementButton)

    expect(onRawValueChange.mock.calls.length).toBeGreaterThanOrEqual(1)
    expect(onRawValueChange).toHaveBeenLastCalledWith(6)

    await waitFor(() => {
      expect(spinbutton.value).toBe('5')
    })
  })

  test('uses vertical orientation behavior and hides decrement control', () => {
    const screen = render(() => <InputNumber orientation="vertical" defaultValue={1} />)

    expect(screen.getByRole('button', { name: 'Increment' })).not.toBeNull()
    expect(screen.queryByRole('button', { name: 'Decrement' })).toBeNull()

    const icon = screen
      .getByRole('button', { name: 'Increment' })
      .querySelector('[data-slot="icon"]') as HTMLElement | null
    expect(icon?.className).toContain('icon-chevron-up')
  })

  test('hides both increment and decrement controls when disabled by props', () => {
    const screen = render(() => <InputNumber increment={false} decrement={false} />)

    expect(screen.queryByRole('button', { name: 'Increment' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Decrement' })).toBeNull()
  })

  test('integrates with form-field validation flow', async () => {
    const state = { count: 0 }

    const screen = render(() => (
      <Form
        state={state}
        validateOnInputDelay={0}
        validate={(currentState) => {
          if ((currentState?.count as number) > 0) {
            return []
          }

          return [{ name: 'count', message: 'Count must be greater than zero' }]
        }}
      >
        <FormField name="count" label="Count">
          <InputNumber
            value={state.count}
            onRawValueChange={(nextValue) => {
              state.count = nextValue
            }}
          />
        </FormField>
      </Form>
    ))

    await fireEvent.submit(screen.container.querySelector('form') as HTMLFormElement)

    await waitFor(() => {
      expect(screen.getByText('Count must be greater than zero')).not.toBeNull()
    })

    const spinbutton = screen.getByRole('spinbutton')
    expect(spinbutton.getAttribute('aria-invalid')).toBe('true')

    await fireEvent.click(screen.getByRole('button', { name: 'Increment' }))

    await waitFor(() => {
      expect(screen.queryByText('Count must be greater than zero')).toBeNull()
    })
  })

  test('applies size and variant classes', () => {
    const screen = render(() => <InputNumber size="xl" variant="subtle" highlight />)
    const base = screen.container.querySelector('[data-slot="base"]')

    expect(base?.className).toContain('h-11')
    expect(base?.className).toContain('surface-subtle')
  })

  test('applies classes.root override', () => {
    const screen = render(() => <InputNumber classes={{ root: 'root-override' }} />)
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.className).toContain('root-override')
  })

  test('validates on blur when validateOn is blur', async () => {
    const state = { count: 0 }

    const screen = render(() => (
      <Form
        state={state}
        validateOn={['blur']}
        validateOnInputDelay={0}
        validate={(currentState) => {
          if ((currentState?.count as number) === 1) {
            return []
          }

          return [{ name: 'count', message: 'Count must equal one' }]
        }}
      >
        <FormField name="count" label="Count">
          <InputNumber
            defaultValue={state.count}
            onRawValueChange={(nextValue) => {
              state.count = nextValue
            }}
          />
        </FormField>
      </Form>
    ))

    const spinbutton = screen.getByRole('spinbutton')
    const increment = screen.getByRole('button', { name: 'Increment' })

    await fireEvent.blur(spinbutton)
    await waitFor(() => {
      expect(screen.getByText('Count must equal one')).not.toBeNull()
    })

    await fireEvent.click(increment)
    await fireEvent.blur(spinbutton)
    await waitFor(() => {
      expect(screen.queryByText('Count must equal one')).toBeNull()
    })
  })

  test('validates on change when validateOn is change', async () => {
    const state = { count: 0 }

    const screen = render(() => (
      <Form
        state={state}
        validateOn={['change']}
        validateOnInputDelay={0}
        validate={(currentState) => {
          if ((currentState?.count as number) === 1) {
            return []
          }

          return [{ name: 'count', message: 'Count must equal one' }]
        }}
      >
        <FormField name="count" label="Count">
          <InputNumber
            value={state.count}
            onRawValueChange={(nextValue) => {
              state.count = nextValue
            }}
          />
        </FormField>
      </Form>
    ))

    const increment = screen.getByRole('button', { name: 'Increment' })
    const decrement = screen.getByRole('button', { name: 'Decrement' })

    await fireEvent.submit(screen.container.querySelector('form') as HTMLFormElement)
    await waitFor(() => {
      expect(screen.getByText('Count must equal one')).not.toBeNull()
    })

    await fireEvent.click(increment)
    await waitFor(() => {
      expect(screen.queryByText('Count must equal one')).toBeNull()
    })

    await fireEvent.click(decrement)
    await waitFor(() => {
      expect(screen.getByText('Count must equal one')).not.toBeNull()
    })
  })

  test('validates on input when validateOn is input', async () => {
    const state = { count: 0 }

    const screen = render(() => (
      <Form
        state={state}
        validateOn={['input']}
        validateOnInputDelay={0}
        validate={(currentState) => {
          if ((currentState?.count as number) === 1) {
            return []
          }

          return [{ name: 'count', message: 'Count must equal one' }]
        }}
      >
        <FormField name="count" label="Count">
          <InputNumber
            value={state.count}
            onRawValueChange={(nextValue) => {
              state.count = nextValue
            }}
          />
        </FormField>
      </Form>
    ))

    const increment = screen.getByRole('button', { name: 'Increment' })
    const decrement = screen.getByRole('button', { name: 'Decrement' })

    await fireEvent.submit(screen.container.querySelector('form') as HTMLFormElement)
    await waitFor(() => {
      expect(screen.getByText('Count must equal one')).not.toBeNull()
    })

    await fireEvent.click(increment)
    await waitFor(() => {
      expect(screen.queryByText('Count must equal one')).toBeNull()
    })

    await fireEvent.click(decrement)
    await waitFor(() => {
      expect(screen.getByText('Count must equal one')).not.toBeNull()
    })
  })
})
