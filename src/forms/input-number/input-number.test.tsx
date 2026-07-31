import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { InputNumber } from './input-number'

describe('InputNumber', () => {
  test('renders number input with increment and decrement controls', () => {
    const screen = render(() => <InputNumber defaultValue={1} placeholder="Qty" />)

    expect(screen.getByRole('spinbutton')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Increment' })).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Decrement' })).not.toBeNull()
  })

  test('supports tuple handlers for increment clicks', async () => {
    const onIncrementClick = vi.fn((_data: string, _event: MouseEvent) => undefined)
    const screen = render(() => (
      <InputNumber defaultValue={0} onIncrementClick={[onIncrementClick, 'payload']} />
    ))

    await fireEvent.click(screen.getByRole('button', { name: 'Increment' }))

    expect(onIncrementClick).toHaveBeenCalledWith('payload', expect.any(MouseEvent))
  })

  test('exposes required, disabled and readonly state through aria and data attributes', () => {
    const disabledScreen = render(() => (
      <InputNumber defaultValue={1} required disabled placeholder="Qty" />
    ))
    const disabledSpinbutton = disabledScreen.getByRole('spinbutton') as HTMLInputElement
    const disabledRoot = disabledScreen.container.querySelector('[data-slot="root"]')

    expect(disabledSpinbutton.required).toBe(true)
    expect(disabledSpinbutton.disabled).toBe(true)
    expect(disabledSpinbutton.getAttribute('aria-required')).toBe('true')
    expect(disabledSpinbutton.getAttribute('aria-disabled')).toBe('true')
    expect(disabledRoot?.getAttribute('data-required')).toBe('')
    expect(disabledRoot?.getAttribute('data-disabled')).toBe('')
    expect(disabledSpinbutton.getAttribute('data-required')).toBe('')
    expect(disabledSpinbutton.getAttribute('data-disabled')).toBe('')

    disabledScreen.unmount()

    const readOnlyScreen = render(() => <InputNumber defaultValue={1} readOnly />)
    const readOnlySpinbutton = readOnlyScreen.getByRole('spinbutton') as HTMLInputElement
    const readOnlyRoot = readOnlyScreen.container.querySelector('[data-slot="root"]')

    expect(readOnlySpinbutton.readOnly).toBe(true)
    expect(readOnlySpinbutton.getAttribute('aria-readonly')).toBe('true')
    expect(readOnlyRoot?.getAttribute('data-readonly')).toBe('')
    expect(readOnlySpinbutton.getAttribute('data-readonly')).toBe('')
  })

  test('disables steppers at min and max boundaries', async () => {
    const maxScreen = render(() => <InputNumber defaultValue={10} minValue={0} maxValue={10} />)
    const maxSpinbutton = maxScreen.getByRole('spinbutton') as HTMLInputElement
    const maxIncrement = maxScreen.getByRole('button', { name: 'Increment' }) as HTMLButtonElement
    const maxDecrement = maxScreen.getByRole('button', { name: 'Decrement' }) as HTMLButtonElement

    expect(maxIncrement.disabled).toBe(true)
    expect(maxDecrement.disabled).toBe(false)

    await fireEvent.click(maxIncrement)
    expect(maxSpinbutton.value).toBe('10')

    maxScreen.unmount()

    const minScreen = render(() => <InputNumber defaultValue={0} minValue={0} maxValue={10} />)
    const minSpinbutton = minScreen.getByRole('spinbutton') as HTMLInputElement
    const minIncrement = minScreen.getByRole('button', { name: 'Increment' }) as HTMLButtonElement
    const minDecrement = minScreen.getByRole('button', { name: 'Decrement' }) as HTMLButtonElement

    expect(minDecrement.disabled).toBe(true)
    expect(minIncrement.disabled).toBe(false)

    await fireEvent.click(minDecrement)
    expect(minSpinbutton.value).toBe('0')
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

  test('supports PageUp and PageDown using largeStep', async () => {
    const screen = render(() => <InputNumber defaultValue={0} step={4} />)
    const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement

    spinbutton.focus()

    await fireEvent.keyDown(spinbutton, { key: 'PageUp' })
    expect(spinbutton.value).toBe('40')

    await fireEvent.keyDown(spinbutton, { key: 'PageDown' })
    expect(spinbutton.value).toBe('0')
  })

  test('supports Home and End keyboard shortcuts for min and max', async () => {
    const screen = render(() => <InputNumber defaultValue={20} minValue={-100} maxValue={100} />)
    const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement

    spinbutton.focus()

    await fireEvent.keyDown(spinbutton, { key: 'End' })
    expect(spinbutton.value).toBe('100')

    await fireEvent.keyDown(spinbutton, { key: 'Home' })
    expect(spinbutton.value).toBe('-100')
  })

  test('does not change value with wheel by default', () => {
    const screen = render(() => <InputNumber defaultValue={5} />)
    const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement

    spinbutton.focus()

    const wheelEvent = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaY: -100,
    })

    spinbutton.dispatchEvent(wheelEvent)

    expect(spinbutton.value).toBe('5')
    expect(wheelEvent.defaultPrevented).toBe(false)
  })

  test('changes value with wheel when enabled and focused', () => {
    const screen = render(() => <InputNumber defaultValue={5} step={2} wheel />)
    const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement

    spinbutton.focus()

    const wheelUpEvent = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaY: -100,
    })
    spinbutton.dispatchEvent(wheelUpEvent)

    expect(spinbutton.value).toBe('7')
    expect(wheelUpEvent.defaultPrevented).toBe(true)

    const wheelDownEvent = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaY: 100,
    })
    spinbutton.dispatchEvent(wheelDownEvent)

    expect(spinbutton.value).toBe('5')
    expect(wheelDownEvent.defaultPrevented).toBe(true)
  })

  test('does not change value with enabled wheel when disabled or readOnly', () => {
    const disabledScreen = render(() => <InputNumber defaultValue={5} disabled wheel />)
    const disabledSpinbutton = disabledScreen.getByRole('spinbutton') as HTMLInputElement

    disabledSpinbutton.focus()

    const disabledWheelEvent = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaY: -100,
    })
    disabledSpinbutton.dispatchEvent(disabledWheelEvent)

    expect(disabledSpinbutton.value).toBe('5')
    expect(disabledWheelEvent.defaultPrevented).toBe(true)

    disabledScreen.unmount()

    const readOnlyScreen = render(() => <InputNumber defaultValue={5} readOnly wheel />)
    const readOnlySpinbutton = readOnlyScreen.getByRole('spinbutton') as HTMLInputElement

    readOnlySpinbutton.focus()

    const readOnlyWheelEvent = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaY: -100,
    })
    readOnlySpinbutton.dispatchEvent(readOnlyWheelEvent)

    expect(readOnlySpinbutton.value).toBe('5')
    expect(readOnlyWheelEvent.defaultPrevented).toBe(true)
  })

  test('serializes one native form value and honors disabled and readonly states', async () => {
    const screen = render(() => (
      <form>
        <InputNumber name="quantity" defaultValue={4} />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const input = screen.getByRole('spinbutton') as HTMLInputElement

    expect(input.value).toBe('4')
    expect(new FormData(form).getAll('quantity')).toEqual(['4'])

    await fireEvent.input(input, { currentTarget: { value: '40' }, target: { value: '40' } })

    expect(input.value).toBe('40')
    expect(new FormData(form).getAll('quantity')).toEqual(['40'])

    screen.unmount()

    const disabledScreen = render(() => (
      <form>
        <InputNumber name="quantity" defaultValue={4} disabled />
      </form>
    ))
    const disabledForm = disabledScreen.container.querySelector('form') as HTMLFormElement

    expect(new FormData(disabledForm).getAll('quantity')).toEqual([])

    disabledScreen.unmount()

    const readOnlyScreen = render(() => (
      <form>
        <InputNumber name="quantity" defaultValue={4} readOnly />
      </form>
    ))
    const readOnlyForm = readOnlyScreen.container.querySelector('form') as HTMLFormElement

    expect(new FormData(readOnlyForm).getAll('quantity')).toEqual(['4'])
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
    await fireEvent.click(incrementButton)

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

  test('uses configurable repeat delay and interval', async () => {
    vi.useFakeTimers()

    try {
      const screen = render(() => (
        <InputNumber defaultValue={0} repeatDelayMs={300} repeatIntervalMs={40} />
      ))
      const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement
      const incrementButton = screen.getByRole('button', { name: 'Increment' })

      await fireEvent.pointerDown(incrementButton, {
        button: 0,
        pointerId: 7,
        pointerType: 'mouse',
      })

      await vi.advanceTimersByTimeAsync(260)
      expect(spinbutton.value).toBe('0')

      await vi.advanceTimersByTimeAsync(100)
      expect(Number(spinbutton.value)).toBeGreaterThan(1)

      await fireEvent.pointerUp(incrementButton, {
        button: 0,
        pointerId: 7,
        pointerType: 'mouse',
      })
    } finally {
      vi.useRealTimers()
    }
  })

  test('applies repeat throttle threshold', async () => {
    vi.useFakeTimers()

    try {
      const screen = render(() => (
        <InputNumber
          defaultValue={0}
          repeatDelayMs={200}
          repeatIntervalMs={30}
          repeatThrottleMs={120}
        />
      ))
      const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement
      const incrementButton = screen.getByRole('button', { name: 'Increment' })

      await fireEvent.pointerDown(incrementButton, {
        button: 0,
        pointerId: 8,
        pointerType: 'mouse',
      })

      await vi.advanceTimersByTimeAsync(500)

      expect(Number(spinbutton.value)).toBeGreaterThan(1)
      expect(Number(spinbutton.value)).toBeLessThan(5)

      await fireEvent.pointerUp(incrementButton, {
        button: 0,
        pointerId: 8,
        pointerType: 'mouse',
      })
    } finally {
      vi.useRealTimers()
    }
  })

  test('respects holdRepeat=false by not repeating while holding', async () => {
    vi.useFakeTimers()

    try {
      const screen = render(() => <InputNumber defaultValue={0} holdRepeat={false} />)
      const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement
      const incrementButton = screen.getByRole('button', { name: 'Increment' })

      await fireEvent.pointerDown(incrementButton, {
        button: 0,
        pointerId: 9,
        pointerType: 'mouse',
      })

      await vi.advanceTimersByTimeAsync(1000)
      expect(spinbutton.value).toBe('0')

      await fireEvent.pointerUp(incrementButton, {
        button: 0,
        pointerId: 9,
        pointerType: 'mouse',
      })
      await fireEvent.click(incrementButton)
      expect(spinbutton.value).toBe('1')
    } finally {
      vi.useRealTimers()
    }
  })

  test('calls onIncrementClick for repeated press steps without extra release click', async () => {
    vi.useFakeTimers()

    try {
      const onIncrementClick = vi.fn()
      const screen = render(() => (
        <InputNumber defaultValue={0} onIncrementClick={onIncrementClick} />
      ))
      const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement
      const incrementButton = screen.getByRole('button', { name: 'Increment' })

      await fireEvent.pointerDown(incrementButton, {
        button: 0,
        pointerId: 10,
        pointerType: 'mouse',
      })
      await vi.advanceTimersByTimeAsync(620)
      await fireEvent.pointerUp(incrementButton, {
        button: 0,
        pointerId: 10,
        pointerType: 'mouse',
      })

      const value = Number(spinbutton.value)
      expect(value).toBeGreaterThan(1)
      expect(onIncrementClick).toHaveBeenCalledTimes(value)
    } finally {
      vi.useRealTimers()
    }
  })

  test('prevents contextmenu on touch long press', async () => {
    const screen = render(() => <InputNumber defaultValue={0} />)
    const incrementButton = screen.getByRole('button', { name: 'Increment' })

    await fireEvent.pointerDown(incrementButton, {
      button: 0,
      pointerId: 11,
      pointerType: 'touch',
    })

    const contextMenuEvent = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
    })

    incrementButton.dispatchEvent(contextMenuEvent)

    expect(contextMenuEvent.defaultPrevented).toBe(true)
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

  test('focuses the input after trigger clicks', async () => {
    const screen = render(() => <InputNumber defaultValue={0} />)
    const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement
    const incrementButton = screen.getByRole('button', { name: 'Increment' })

    await fireEvent.click(incrementButton)

    expect(document.activeElement).toBe(spinbutton)
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

  test('applies size and variant classes', () => {
    const screen = render(() => <InputNumber size="xl" variant="subtle" />)
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

  describe('partial input support', () => {
    test('allows typing minus sign without committing', async () => {
      const onRawValueChange = vi.fn()
      const screen = render(() => (
        <InputNumber defaultValue={5} onRawValueChange={onRawValueChange} />
      ))
      const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement

      spinbutton.focus()
      await fireEvent.input(spinbutton, { target: { value: '-' } })

      expect(spinbutton.value).toBe('-')
      expect(onRawValueChange).not.toHaveBeenCalled()
    })

    test('allows typing decimal point without committing', async () => {
      const onRawValueChange = vi.fn()
      const screen = render(() => (
        <InputNumber defaultValue={5} onRawValueChange={onRawValueChange} />
      ))
      const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement

      spinbutton.focus()
      await fireEvent.input(spinbutton, { target: { value: '.' } })

      expect(spinbutton.value).toBe('.')
      expect(onRawValueChange).not.toHaveBeenCalled()
    })

    test('allows typing minus and decimal point without committing', async () => {
      const onRawValueChange = vi.fn()
      const screen = render(() => (
        <InputNumber defaultValue={5} onRawValueChange={onRawValueChange} />
      ))
      const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement

      spinbutton.focus()
      await fireEvent.input(spinbutton, { target: { value: '-.' } })

      expect(spinbutton.value).toBe('-.')
      expect(onRawValueChange).not.toHaveBeenCalled()
    })

    test('allows typing number with trailing decimal point', async () => {
      const onRawValueChange = vi.fn()
      const screen = render(() => (
        <InputNumber defaultValue={5} onRawValueChange={onRawValueChange} />
      ))
      const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement

      spinbutton.focus()
      await fireEvent.input(spinbutton, { target: { value: '12.' } })

      expect(spinbutton.value).toBe('12.')
      expect(onRawValueChange).not.toHaveBeenCalled()
    })

    test('commits complete decimal number', async () => {
      const onRawValueChange = vi.fn()
      const screen = render(() => (
        <InputNumber defaultValue={5} onRawValueChange={onRawValueChange} />
      ))
      const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement

      spinbutton.focus()
      await fireEvent.input(spinbutton, { target: { value: '12.5' } })

      expect(spinbutton.value).toBe('12.5')
      expect(onRawValueChange).toHaveBeenCalledWith(12.5)
    })

    test('commits negative number', async () => {
      const onRawValueChange = vi.fn()
      const screen = render(() => (
        <InputNumber defaultValue={5} onRawValueChange={onRawValueChange} />
      ))
      const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement

      spinbutton.focus()
      await fireEvent.input(spinbutton, { target: { value: '-42' } })

      expect(spinbutton.value).toBe('-42')
      expect(onRawValueChange).toHaveBeenCalledWith(-42)
    })

    test('formats value on blur after partial input', async () => {
      const screen = render(() => <InputNumber defaultValue={5} />)
      const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement

      spinbutton.focus()
      await fireEvent.input(spinbutton, { target: { value: '-' } })
      expect(spinbutton.value).toBe('-')

      await fireEvent.blur(spinbutton)
      expect(spinbutton.value).toBe('5')
    })

    test('completes partial decimal on blur', async () => {
      const onRawValueChange = vi.fn()
      const screen = render(() => (
        <InputNumber defaultValue={5} onRawValueChange={onRawValueChange} />
      ))
      const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement

      spinbutton.focus()
      await fireEvent.input(spinbutton, { target: { value: '7.' } })
      expect(spinbutton.value).toBe('7.')

      await fireEvent.blur(spinbutton)
      expect(spinbutton.value).toBe('7')
      expect(onRawValueChange).toHaveBeenCalledWith(7)
    })
  })

  describe('locale-aware parsing', () => {
    test('parses comma as decimal separator in de-DE locale', async () => {
      const onRawValueChange = vi.fn()
      const screen = render(() => (
        <InputNumber defaultValue={5} locale="de-DE" onRawValueChange={onRawValueChange} />
      ))
      const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement

      spinbutton.focus()
      await fireEvent.input(spinbutton, { target: { value: '12,5' } })

      expect(onRawValueChange).toHaveBeenCalledWith(12.5)
    })

    test('allows typing comma as partial input in de-DE locale', async () => {
      const onRawValueChange = vi.fn()
      const screen = render(() => (
        <InputNumber defaultValue={5} locale="de-DE" onRawValueChange={onRawValueChange} />
      ))
      const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement

      spinbutton.focus()
      await fireEvent.input(spinbutton, { target: { value: ',' } })

      expect(spinbutton.value).toBe(',')
      expect(onRawValueChange).not.toHaveBeenCalled()
    })

    test('allows typing number with trailing comma in de-DE locale', async () => {
      const onRawValueChange = vi.fn()
      const screen = render(() => (
        <InputNumber defaultValue={5} locale="de-DE" onRawValueChange={onRawValueChange} />
      ))
      const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement

      spinbutton.focus()
      await fireEvent.input(spinbutton, { target: { value: '12,' } })

      expect(spinbutton.value).toBe('12,')
      expect(onRawValueChange).not.toHaveBeenCalled()
    })

    test('formats numbers with comma in de-DE locale', async () => {
      const screen = render(() => <InputNumber defaultValue={12.5} locale="de-DE" />)
      const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement

      expect(spinbutton.value).toBe('12,5')
    })

    test('parses dot as decimal separator in en-US locale', async () => {
      const onRawValueChange = vi.fn()
      const screen = render(() => (
        <InputNumber defaultValue={5} locale="en-US" onRawValueChange={onRawValueChange} />
      ))
      const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement

      spinbutton.focus()
      await fireEvent.input(spinbutton, { target: { value: '12.5' } })

      expect(onRawValueChange).toHaveBeenCalledWith(12.5)
    })

    test('formats numbers with dot in en-US locale', async () => {
      const screen = render(() => <InputNumber defaultValue={12.5} locale="en-US" />)
      const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement

      expect(spinbutton.value).toBe('12.5')
    })

    test('handles fr-FR locale with comma separator', async () => {
      const onRawValueChange = vi.fn()
      const screen = render(() => (
        <InputNumber defaultValue={5} locale="fr-FR" onRawValueChange={onRawValueChange} />
      ))
      const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement

      spinbutton.focus()
      await fireEvent.input(spinbutton, { target: { value: '99,99' } })

      expect(onRawValueChange).toHaveBeenCalledWith(99.99)
    })

    test('increments and decrements preserve locale formatting', async () => {
      const screen = render(() => <InputNumber defaultValue={10.5} locale="de-DE" />)
      const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement
      const incrementButton = screen.getByRole('button', { name: 'Increment' })
      const decrementButton = screen.getByRole('button', { name: 'Decrement' })

      expect(spinbutton.value).toBe('10,5')

      await fireEvent.click(incrementButton)
      expect(spinbutton.value).toBe('11,5')

      await fireEvent.click(decrementButton)
      expect(spinbutton.value).toBe('10,5')
    })
  })
})
