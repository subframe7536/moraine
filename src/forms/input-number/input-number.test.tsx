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

  test('supports ArrowUp and ArrowDown keyboard controls', async () => {
    const screen = render(() => <InputNumber defaultValue={5} />)
    const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement

    spinbutton.focus()

    await fireEvent.keyDown(spinbutton, { key: 'ArrowUp' })
    expect(spinbutton.value).toBe('6')

    await fireEvent.keyDown(spinbutton, { key: 'ArrowDown' })
    expect(spinbutton.value).toBe('5')
  })

  test('repeats increment while the trigger is held', async () => {
    vi.useFakeTimers()

    try {
      const screen = render(() => <InputNumber defaultValue={0} />)
      const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement
      const incrementButton = screen.getByRole('button', { name: 'Increment' })

      await fireEvent.pointerDown(incrementButton, {
        button: 0,
        pointerId: 1,
        pointerType: 'mouse',
      })

      await vi.advanceTimersByTimeAsync(620)

      expect(Number(spinbutton.value)).toBeGreaterThan(1)

      await fireEvent.pointerUp(incrementButton, {
        button: 0,
        pointerId: 1,
        pointerType: 'mouse',
      })

      const stoppedValue = Number(spinbutton.value)

      await vi.advanceTimersByTimeAsync(240)

      expect(Number(spinbutton.value)).toBe(stoppedValue)
    } finally {
      vi.useRealTimers()
    }
  })

  test('increments once on pointer press and release without hold repeat', async () => {
    const screen = render(() => <InputNumber defaultValue={0} />)
    const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement
    const incrementButton = screen.getByRole('button', { name: 'Increment' })

    await fireEvent.pointerDown(incrementButton, {
      button: 0,
      pointerId: 3,
      pointerType: 'mouse',
    })
    await fireEvent.pointerUp(incrementButton, {
      button: 0,
      pointerId: 3,
      pointerType: 'mouse',
    })

    expect(spinbutton.value).toBe('1')
  })

  test('does not add extra increment when releasing after hold repeat', async () => {
    vi.useFakeTimers()

    try {
      const screen = render(() => <InputNumber defaultValue={0} />)
      const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement
      const incrementButton = screen.getByRole('button', { name: 'Increment' })

      await fireEvent.pointerDown(incrementButton, {
        button: 0,
        pointerId: 4,
        pointerType: 'mouse',
      })
      await vi.advanceTimersByTimeAsync(620)

      const valueBeforeRelease = Number(spinbutton.value)
      expect(valueBeforeRelease).toBeGreaterThan(1)

      await fireEvent.pointerUp(incrementButton, {
        button: 0,
        pointerId: 4,
        pointerType: 'mouse',
      })

      expect(Number(spinbutton.value)).toBe(valueBeforeRelease)
    } finally {
      vi.useRealTimers()
    }
  })

  test('stops hold repeat on pointer cancel without extra increment', async () => {
    vi.useFakeTimers()

    try {
      const screen = render(() => <InputNumber defaultValue={0} />)
      const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement
      const incrementButton = screen.getByRole('button', { name: 'Increment' })

      await fireEvent.pointerDown(incrementButton, {
        button: 0,
        pointerId: 5,
        pointerType: 'mouse',
      })
      await vi.advanceTimersByTimeAsync(620)

      const valueBeforeCancel = Number(spinbutton.value)
      expect(valueBeforeCancel).toBeGreaterThan(1)

      await fireEvent.pointerCancel(incrementButton, {
        button: 0,
        pointerId: 5,
        pointerType: 'mouse',
      })

      await vi.advanceTimersByTimeAsync(240)

      expect(Number(spinbutton.value)).toBe(valueBeforeCancel)
    } finally {
      vi.useRealTimers()
    }
  })

  test('stops hold repeat on pointer leave without extra increment', async () => {
    vi.useFakeTimers()

    try {
      const screen = render(() => <InputNumber defaultValue={0} />)
      const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement
      const incrementButton = screen.getByRole('button', { name: 'Increment' })

      await fireEvent.pointerDown(incrementButton, {
        button: 0,
        pointerId: 6,
        pointerType: 'mouse',
      })
      await vi.advanceTimersByTimeAsync(620)

      const valueBeforeLeave = Number(spinbutton.value)
      expect(valueBeforeLeave).toBeGreaterThan(1)

      await fireEvent.pointerLeave(incrementButton, {
        button: 0,
        pointerId: 6,
        pointerType: 'mouse',
      })

      await vi.advanceTimersByTimeAsync(240)

      expect(Number(spinbutton.value)).toBe(valueBeforeLeave)
    } finally {
      vi.useRealTimers()
    }
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

  test('uses vertical orientation behavior with both controls', async () => {
    const screen = render(() => <InputNumber orientation="vertical" defaultValue={1} />)
    const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement
    const incrementButton = screen.getByRole('button', { name: 'Increment' })
    const decrementButton = screen.getByRole('button', { name: 'Decrement' })
    const controls = screen.container.querySelector('[data-slot="controls"]') as HTMLElement | null

    expect(incrementButton.querySelector('[data-slot="icon"]')?.className).toContain(
      'icon-chevron-up',
    )
    expect(decrementButton.querySelector('[data-slot="icon"]')?.className).toContain(
      'icon-chevron-down',
    )
    expect(controls?.className).toContain('flex-col')
    expect(controls?.className).toContain('w-9')
    expect(controls?.className).toContain('border-s')
    expect(incrementButton.getAttribute('data-slot')).toBe('increment')
    expect(decrementButton.getAttribute('data-slot')).toBe('decrement')
    expect(incrementButton.className).toContain('flex-1')
    expect(decrementButton.className).toContain('flex-1')
    expect(decrementButton.className).toContain('border-t')
    expect(incrementButton.className).toContain('h-full')
    expect(decrementButton.className).toContain('h-full')

    await fireEvent.click(incrementButton)
    expect(spinbutton.value).toBe('2')

    await fireEvent.click(decrementButton)
    expect(spinbutton.value).toBe('1')
  })

  test('uses explicit horizontal orientation behavior with both controls', async () => {
    const screen = render(() => <InputNumber orientation="horizontal" defaultValue={1} />)
    const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement
    const incrementButton = screen.getByRole('button', { name: 'Increment' })
    const decrementButton = screen.getByRole('button', { name: 'Decrement' })

    expect(incrementButton.querySelector('[data-slot="icon"]')?.className).toContain('icon-plus')
    expect(decrementButton.querySelector('[data-slot="icon"]')?.className).toContain('icon-minus')

    await fireEvent.click(incrementButton)
    expect(spinbutton.value).toBe('2')

    await fireEvent.click(decrementButton)
    expect(spinbutton.value).toBe('1')
  })

  test('lays out horizontal controls as sibling slots instead of overlaying the input', () => {
    const incrementOnly = render(() => <InputNumber size="lg" decrement={false} />)
    const incrementOnlyRoot = incrementOnly.container.querySelector(
      '[data-slot="root"]',
    ) as HTMLElement | null
    const incrementOnlyBase = incrementOnly.container.querySelector(
      '[data-slot="input"]',
    ) as HTMLElement | null
    const incrementOnlyButton = incrementOnly.container.querySelector(
      '[data-slot="increment"]',
    ) as HTMLElement | null

    expect(incrementOnlyRoot?.className).toContain('overflow-hidden')
    expect(incrementOnlyButton?.className).toContain('border-s')
    expect(incrementOnlyButton?.className).not.toContain('absolute')
    expect(incrementOnlyBase?.className).not.toContain('pe-10')
    expect(incrementOnlyBase?.className).not.toContain('ps-10')
    expect(incrementOnlyBase?.className).toContain('text-start')

    incrementOnly.unmount()

    const decrementOnly = render(() => <InputNumber size="lg" increment={false} />)
    const decrementOnlyBase = decrementOnly.container.querySelector(
      '[data-slot="input"]',
    ) as HTMLElement | null
    const decrementOnlyButton = decrementOnly.container.querySelector(
      '[data-slot="decrement"]',
    ) as HTMLElement | null

    expect(decrementOnlyButton?.className).toContain('border-e')
    expect(decrementOnlyButton?.className).not.toContain('absolute')
    expect(decrementOnlyBase?.className).not.toContain('pe-10')
    expect(decrementOnlyBase?.className).not.toContain('ps-10')
    expect(decrementOnlyBase?.className).not.toContain('text-start')
  })

  test('uses a dedicated vertical control column instead of end-padding the input', () => {
    const incrementOnly = render(() => (
      <InputNumber size="sm" orientation="vertical" decrement={false} />
    ))
    const incrementOnlyControls = incrementOnly.container.querySelector(
      '[data-slot="controls"]',
    ) as HTMLElement | null
    const incrementOnlyBase = incrementOnly.container.querySelector(
      '[data-slot="input"]',
    ) as HTMLElement | null

    expect(incrementOnlyControls?.className).toContain('w-8')
    expect(incrementOnlyControls?.className).toContain('border-s')
    expect(incrementOnlyBase?.className).not.toContain('ps-8')
    expect(incrementOnlyBase?.className).not.toContain('pe-8')

    incrementOnly.unmount()

    const decrementOnly = render(() => (
      <InputNumber size="sm" orientation="vertical" increment={false} />
    ))
    const decrementOnlyControls = decrementOnly.container.querySelector(
      '[data-slot="controls"]',
    ) as HTMLElement | null
    const decrementOnlyBase = decrementOnly.container.querySelector(
      '[data-slot="input"]',
    ) as HTMLElement | null

    expect(decrementOnlyControls?.className).toContain('w-8')
    expect(decrementOnlyControls?.className).toContain('border-s')
    expect(decrementOnlyBase?.className).not.toContain('ps-8')
    expect(decrementOnlyBase?.className).not.toContain('pe-8')
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
    const root = screen.container.querySelector('[data-slot="root"]')
    const base = screen.container.querySelector('[data-slot="input"]')

    expect(root?.className).toContain('h-11')
    expect(root?.className).toContain('bg-input/30')
    expect(base?.className).toContain('text-base')
  })

  test('applies classes.root override', () => {
    const screen = render(() => <InputNumber classes={{ root: 'root-override' }} />)
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.className).toContain('root-override')
  })

  test('applies styles.root override', () => {
    const screen = render(() => <InputNumber styles={{ root: { width: '200px' } }} />)
    const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement | null

    expect(root?.style.width).toBe('200px')
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
