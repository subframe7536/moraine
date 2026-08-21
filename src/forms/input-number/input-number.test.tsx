import { getInput, setInput } from '@formisch/solid'
import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createComponent, createSignal } from 'solid-js'
import { hydrate } from 'solid-js/web'
import * as v from 'valibot'
import { describe, expect, expectTypeOf, test, vi } from 'vitest'

import { renderWithOwner } from '../../test-utils/owner-render.tsx'
import { installHydrationState, renderSsrFixture } from '../../test-utils/ssr-test.ts'
import { FormField } from '../form-field/index.ts'
import { createForm, Form } from '../form/index.ts'

import { InputNumber } from './input-number.tsx'
import type { InputNumberT } from './input-number.tsx'

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

  test('reactively disables steppers after reaching a boundary', async () => {
    const screen = render(() => <InputNumber defaultValue={9} minValue={0} maxValue={10} />)
    const incrementButton = screen.getByRole('button', { name: 'Increment' }) as HTMLButtonElement
    const decrementButton = screen.getByRole('button', { name: 'Decrement' }) as HTMLButtonElement

    expect(incrementButton.disabled).toBe(false)
    await fireEvent.click(incrementButton)

    expect(incrementButton.disabled).toBe(true)
    expect(decrementButton.disabled).toBe(false)
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

  test.each([
    ['tenths', 0.1, 0.2, '0.3'],
    ['small exponent steps', 0, 1e-7, '0.0000001'],
  ])(
    'steps %s without exposing binary floating-point noise',
    async (_name, value, step, expected) => {
      const onRawValueChange = vi.fn()
      const screen = render(() => (
        <InputNumber defaultValue={value} step={step} onRawValueChange={onRawValueChange} />
      ))

      await fireEvent.click(screen.getByRole('button', { name: 'Increment' }))

      expect((screen.getByRole('spinbutton') as HTMLInputElement).value).toBe(expected)
      expect(onRawValueChange).toHaveBeenLastCalledWith(Number(expected))
    },
  )

  test('steps from parseable dirty text when a controlled value lags', async () => {
    const onRawValueChange = vi.fn()
    const screen = render(() => <InputNumber value={0} onRawValueChange={onRawValueChange} />)
    const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement

    await fireEvent.input(spinbutton, { target: { value: '7.5' } })
    await fireEvent.keyDown(spinbutton, { key: 'ArrowUp' })

    expect(onRawValueChange).toHaveBeenLastCalledWith(8.5)
    expect(spinbutton.value).toBe('7.5')
  })

  test('does not emit changes for keyboard or wheel boundary no-ops', async () => {
    const onChange = vi.fn()
    const onRawValueChange = vi.fn()
    const screen = render(() => (
      <InputNumber
        defaultValue={10}
        maxValue={10}
        wheel
        onChange={onChange}
        onRawValueChange={onRawValueChange}
      />
    ))
    const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement

    spinbutton.focus()
    await fireEvent.keyDown(spinbutton, { key: 'ArrowUp' })
    const wheelEvent = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaY: -1,
    })
    spinbutton.dispatchEvent(wheelEvent)

    expect(spinbutton.value).toBe('10')
    expect(onChange).not.toHaveBeenCalled()
    expect(onRawValueChange).not.toHaveBeenCalled()
    expect(wheelEvent.defaultPrevented).toBe(true)
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

  test('leaves Home and End native when their corresponding bounds are absent', () => {
    const onRawValueChange = vi.fn()
    const screen = render(() => (
      <InputNumber defaultValue={20} onRawValueChange={onRawValueChange} />
    ))
    const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement
    const homeEvent = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Home' })
    const endEvent = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'End' })

    spinbutton.dispatchEvent(homeEvent)
    spinbutton.dispatchEvent(endEvent)

    expect(homeEvent.defaultPrevented).toBe(false)
    expect(endEvent.defaultPrevented).toBe(false)
    expect(onRawValueChange).not.toHaveBeenCalled()
    expect(spinbutton.value).toBe('20')
  })

  test('commits and formats parseable dirty text on Enter', async () => {
    const onRawValueChange = vi.fn()
    const screen = render(() => (
      <InputNumber defaultValue={5} onRawValueChange={onRawValueChange} />
    ))
    const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement

    await fireEvent.input(spinbutton, { target: { value: '7.' } })
    await fireEvent.keyDown(spinbutton, { key: 'Enter' })

    expect(spinbutton.value).toBe('7')
    expect(onRawValueChange).toHaveBeenCalledOnce()
    expect(onRawValueChange).toHaveBeenCalledWith(7)
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
    expect(disabledWheelEvent.defaultPrevented).toBe(false)

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
    expect(readOnlyWheelEvent.defaultPrevented).toBe(false)
  })

  test('does not cancel wheel events when unfocused or when deltaY is zero', () => {
    const screen = render(() => <InputNumber defaultValue={5} wheel />)
    const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement
    const unfocusedEvent = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaY: -1,
    })

    spinbutton.dispatchEvent(unfocusedEvent)
    expect(unfocusedEvent.defaultPrevented).toBe(false)

    spinbutton.focus()
    const zeroEvent = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaY: 0,
    })
    spinbutton.dispatchEvent(zeroEvent)

    expect(zeroEvent.defaultPrevented).toBe(false)
    expect(spinbutton.value).toBe('5')
  })

  test('exposes formatted spinbutton text and stepper relationships', () => {
    const screen = render(() => <InputNumber id="quantity" defaultValue={12.5} locale="de-DE" />)
    const spinbutton = screen.getByRole('spinbutton')
    const incrementButton = screen.getByRole('button', { name: 'Increment' })
    const decrementButton = screen.getByRole('button', { name: 'Decrement' })

    expect(spinbutton.getAttribute('aria-valuetext')).toBe('12,5')
    expect(incrementButton.getAttribute('aria-controls')).toBe('quantity')
    expect(decrementButton.getAttribute('aria-controls')).toBe('quantity')
  })

  test('makes readonly step controls unavailable', () => {
    const screen = render(() => <InputNumber defaultValue={5} readOnly />)

    expect((screen.getByRole('button', { name: 'Increment' }) as HTMLButtonElement).disabled).toBe(
      true,
    )
    expect((screen.getByRole('button', { name: 'Decrement' }) as HTMLButtonElement).disabled).toBe(
      true,
    )
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

  test('parses locale-formatted string props and emits locale-formatted changes in order', async () => {
    const calls: Array<string> = []
    const screen = render(() => (
      <InputNumber
        value="12,5"
        rawValue={13.5}
        locale="de-DE"
        onRawValueChange={(value) => calls.push(`raw:${value}`)}
        onChange={(value) => calls.push(`text:${value}`)}
      />
    ))
    const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement

    expect(spinbutton.value).toBe('13,5')
    await fireEvent.keyDown(spinbutton, { key: 'ArrowUp' })

    expect(calls).toEqual(['raw:14.5', 'text:14,5'])
  })

  test('replaces dirty text when the explicit controlled value changes externally', async () => {
    const [value, setValue] = createSignal(5)
    const screen = render(() => <InputNumber value={value()} />)
    const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement

    await fireEvent.input(spinbutton, { target: { value: '-' } })
    expect(spinbutton.value).toBe('-')

    setValue(8)
    expect(spinbutton.value).toBe('8')
  })

  test('keeps FormField aligned with explicit controlled and external Formisch values', async () => {
    const [value, setValue] = createSignal(5)
    const onRawValueChange = vi.fn()
    const { screen, value: form } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ quantity: v.number() }),
          initialInput: { quantity: 5 },
        }),
      (form) => (
        <Form of={form}>
          <FormField name="quantity" label="Quantity">
            <InputNumber value={value()} onRawValueChange={onRawValueChange} />
          </FormField>
        </Form>
      ),
    )
    const spinbutton = screen.getByLabelText('Quantity') as HTMLInputElement

    await fireEvent.input(spinbutton, { target: { value: '7' } })
    expect(onRawValueChange).toHaveBeenCalledWith(7)
    expect(getInput(form)).toEqual({ quantity: 5 })

    setValue(8)
    expect(spinbutton.value).toBe('8')
    expect(getInput(form)).toEqual({ quantity: 8 })

    setInput(form, { path: ['quantity'], input: 9 })
    expect(spinbutton.value).toBe('8')
    expect(getInput(form)).toEqual({ quantity: 8 })
  })

  test('reacts to external Formisch input without publishing callbacks', () => {
    const onRawValueChange = vi.fn()
    const { screen, value: form } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ quantity: v.number() }),
          initialInput: { quantity: 4 },
        }),
      (form) => (
        <Form of={form}>
          <FormField name="quantity" label="Quantity">
            <InputNumber onRawValueChange={onRawValueChange} />
          </FormField>
        </Form>
      ),
    )
    const spinbutton = screen.getByLabelText('Quantity') as HTMLInputElement

    setInput(form, { path: ['quantity'], input: 6 })

    expect(spinbutton.value).toBe('6')
    expect(onRawValueChange).not.toHaveBeenCalled()
  })

  test('restores the initial uncontrolled snapshot on reset without reset callbacks', async () => {
    const [defaultValue, setDefaultValue] = createSignal(2)
    const onChange = vi.fn()
    const onRawValueChange = vi.fn()
    const screen = render(() => (
      <form>
        <InputNumber
          name="quantity"
          defaultValue={defaultValue()}
          onChange={onChange}
          onRawValueChange={onRawValueChange}
        />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement

    setDefaultValue(9)
    await fireEvent.input(spinbutton, { target: { value: '7' } })
    expect(spinbutton.value).toBe('7')

    form.reset()
    await Promise.resolve()

    expect(spinbutton.value).toBe('2')
    expect(new FormData(form).get('quantity')).toBe('2')
    expect(onRawValueChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  test('restores the latest explicit controlled value on reset without callbacks', async () => {
    const [value, setValue] = createSignal(5)
    const onChange = vi.fn()
    const onRawValueChange = vi.fn()
    const screen = render(() => (
      <form>
        <InputNumber
          value={value()}
          defaultValue={1}
          onChange={onChange}
          onRawValueChange={onRawValueChange}
        />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement

    await fireEvent.input(spinbutton, { target: { value: '7' } })
    expect(spinbutton.value).toBe('7')

    setValue(6)
    expect(spinbutton.value).toBe('6')
    const callbackCounts = [onChange.mock.calls.length, onRawValueChange.mock.calls.length]

    form.reset()
    await Promise.resolve()

    expect(spinbutton.value).toBe('6')
    expect([onChange.mock.calls.length, onRawValueChange.mock.calls.length]).toEqual(callbackCounts)
  })

  test('does not reset state when native reset is canceled', async () => {
    const screen = render(() => (
      <form onReset={(event) => event.preventDefault()}>
        <InputNumber defaultValue={2} />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement

    await fireEvent.input(spinbutton, { target: { value: '7' } })
    form.reset()
    await Promise.resolve()

    expect(spinbutton.value).toBe('7')
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
      expect(incrementButton.getAttribute('data-active')).toBe('')
      await vi.advanceTimersByTimeAsync(620)

      const valueBeforeCancel = Number(spinbutton.value)
      expect(valueBeforeCancel).toBeGreaterThan(1)

      await fireEvent.pointerCancel(incrementButton, {
        button: 0,
        pointerId: 5,
        pointerType: 'mouse',
      })
      expect(incrementButton.getAttribute('data-active')).toBeNull()

      await vi.advanceTimersByTimeAsync(240)

      expect(Number(spinbutton.value)).toBe(valueBeforeCancel)
    } finally {
      vi.useRealTimers()
    }
  })

  test('stops hold repeat when pointer capture is lost', async () => {
    vi.useFakeTimers()

    try {
      const screen = render(() => <InputNumber defaultValue={0} />)
      const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement
      const incrementButton = screen.getByRole('button', { name: 'Increment' })

      await fireEvent.pointerDown(incrementButton, {
        button: 0,
        pointerId: 51,
        pointerType: 'mouse',
      })
      expect(incrementButton.getAttribute('data-active')).toBe('')
      await vi.advanceTimersByTimeAsync(620)

      const valueBeforeCaptureLoss = Number(spinbutton.value)
      await fireEvent.lostPointerCapture(incrementButton, {
        pointerId: 51,
        pointerType: 'mouse',
      })
      expect(incrementButton.getAttribute('data-active')).toBeNull()
      await vi.advanceTimersByTimeAsync(240)

      expect(Number(spinbutton.value)).toBe(valueBeforeCaptureLoss)
    } finally {
      vi.useRealTimers()
    }
  })

  test('clears all repeat timers and restores selection styles on unmount', async () => {
    vi.useFakeTimers()
    const previousUserSelect = document.body.style.getPropertyValue('user-select')
    const previousWebkitUserSelect = document.body.style.getPropertyValue('-webkit-user-select')

    try {
      document.body.style.setProperty('user-select', 'text')
      document.body.style.setProperty('-webkit-user-select', 'text')
      const onRawValueChange = vi.fn()
      const screen = render(() => (
        <InputNumber defaultValue={0} onRawValueChange={onRawValueChange} />
      ))

      await fireEvent.pointerDown(screen.getByRole('button', { name: 'Increment' }), {
        button: 0,
        pointerId: 61,
        pointerType: 'mouse',
      })
      const decrementButton = screen.getByRole('button', { name: 'Decrement' })
      await fireEvent.pointerDown(decrementButton, {
        button: 0,
        pointerId: 62,
        pointerType: 'mouse',
      })
      expect(screen.getByRole('button', { name: 'Increment' }).getAttribute('data-active')).toBe('')
      expect(decrementButton.getAttribute('data-active')).toBe('')
      expect(document.body.style.getPropertyValue('user-select')).toBe('none')

      screen.unmount()
      await vi.advanceTimersByTimeAsync(1_000)

      expect(onRawValueChange).not.toHaveBeenCalled()
      expect(document.body.style.getPropertyValue('user-select')).toBe('text')
      expect(document.body.style.getPropertyValue('-webkit-user-select')).toBe('text')
    } finally {
      document.body.style.setProperty('user-select', previousUserSelect)
      document.body.style.setProperty('-webkit-user-select', previousWebkitUserSelect)
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
      expect(incrementButton.getAttribute('data-active')).toBe('')
      await vi.advanceTimersByTimeAsync(620)

      const valueBeforeLeave = Number(spinbutton.value)
      expect(valueBeforeLeave).toBeGreaterThan(1)

      await fireEvent.pointerLeave(incrementButton, {
        button: 0,
        pointerId: 6,
        pointerType: 'mouse',
      })
      expect(incrementButton.getAttribute('data-active')).toBeNull()

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

  test('rechecks disabled state before delayed autofocus and clears the timer on unmount', async () => {
    vi.useFakeTimers()

    try {
      const [disabled, setDisabled] = createSignal(false)
      const screen = render(() => (
        <InputNumber autofocus autofocusDelay={100} disabled={disabled()} />
      ))
      const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement

      setDisabled(true)
      await vi.advanceTimersByTimeAsync(100)
      expect(document.activeElement).not.toBe(spinbutton)

      screen.unmount()
      await vi.advanceTimersByTimeAsync(100)
      expect(document.activeElement).not.toBe(spinbutton)
    } finally {
      vi.useRealTimers()
    }
  })

  test('uses vertical orientation behavior with both controls', async () => {
    const screen = render(() => <InputNumber orientation="vertical" defaultValue={1} />)
    const spinbutton = screen.getByRole('spinbutton') as HTMLInputElement
    const incrementButton = screen.getByRole('button', { name: 'Increment' })
    const decrementButton = screen.getByRole('button', { name: 'Decrement' })
    const controls = screen.container.querySelector('[data-slot="controls"]') as HTMLElement | null

    expect(incrementButton.querySelector('[data-slot="leading"]')?.className).toContain(
      'icon-chevron-up',
    )
    expect(decrementButton.querySelector('[data-slot="leading"]')?.className).toContain(
      'icon-chevron-down',
    )
    expect(controls?.className).toContain('flex-col')
    expect(controls?.className).toContain('w-9')
    expect(controls?.className).toContain('pe-1')
    expect(controls?.className).not.toContain('border-s')
    expect(incrementButton.getAttribute('data-slot')).toBe('increment')
    expect(decrementButton.getAttribute('data-slot')).toBe('decrement')
    expect(incrementButton.className).toContain('flex-1')
    expect(decrementButton.className).toContain('flex-1')
    expect(decrementButton.className).not.toContain('border-t')
    expect(incrementButton.className).toContain('w-full')
    expect(decrementButton.className).toContain('w-full')
    expect(incrementButton.className).toContain('scale-80')
    expect(decrementButton.className).toContain('scale-80')

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

    expect(incrementButton.querySelector('[data-slot="leading"]')?.className).toContain('icon-plus')
    expect(decrementButton.querySelector('[data-slot="leading"]')?.className).toContain(
      'icon-minus',
    )

    await fireEvent.click(incrementButton)
    expect(spinbutton.value).toBe('2')

    await fireEvent.click(decrementButton)
    expect(spinbutton.value).toBe('1')
  })

  test('lays out horizontal link controls as sibling slots instead of overlaying the input', () => {
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
    expect(incrementOnlyButton?.getAttribute('data-variant')).toBe('link')
    expect(incrementOnlyButton?.className).toContain('w-9')
    expect(incrementOnlyButton?.className).toContain('rounded-e-none')
    expect(incrementOnlyButton?.className).not.toContain('border-s')
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

    expect(decrementOnlyButton?.getAttribute('data-variant')).toBe('link')
    expect(decrementOnlyButton?.className).toContain('w-9')
    expect(decrementOnlyButton?.className).toContain('rounded-s-none')
    expect(decrementOnlyButton?.className).not.toContain('border-e')
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
    expect(incrementOnlyControls?.className).toContain('pe-1')
    expect(incrementOnlyControls?.className).not.toContain('border-s')
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
    expect(decrementOnlyControls?.className).toContain('pe-1')
    expect(decrementOnlyControls?.className).not.toContain('border-s')
    expect(decrementOnlyBase?.className).not.toContain('ps-8')
    expect(decrementOnlyBase?.className).not.toContain('pe-8')
  })

  test('hides both increment and decrement controls when disabled by props', () => {
    const screen = render(() => <InputNumber increment={false} decrement={false} />)

    expect(screen.queryByRole('button', { name: 'Increment' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Decrement' })).toBeNull()
  })

  test('single-evaluates orientation and conditional control props', () => {
    const reads = { decrement: 0, increment: 0, orientation: 0 }
    const screen = render(() =>
      createComponent(InputNumber, {
        get decrement() {
          reads.decrement += 1
          return true
        },
        get increment() {
          reads.increment += 1
          return true
        },
        get orientation() {
          reads.orientation += 1
          return 'vertical' as const
        },
      }),
    )

    expect(screen.getByRole('button', { name: 'Increment' })).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Decrement' })).not.toBeNull()
    expect(reads).toEqual({ decrement: 1, increment: 1, orientation: 1 })
  })

  test('applies size classes', () => {
    const screen = render(() => <InputNumber size="lg" />)
    const root = screen.container.querySelector('[data-slot="root"]')
    const base = screen.container.querySelector('[data-slot="input"]')

    expect(root?.className).toContain('h-9')
    expect(base?.className).toContain('text-sm')
    expect(base?.className).toContain('leading-5')
    expect(base?.className).toContain('px-3')
  })

  test.each([
    ['outline', ['border', 'border-input', 'bg-transparent', 'shadow-xs']],
    ['subtle', ['border', 'border-input', 'bg-input/30', 'shadow-xs']],
    ['ghost', ['hover:bg-muted-hover', 'focus-within:bg-muted-hover']],
    ['none', ['focus-within:ring-0']],
  ] as const)('applies %s variant classes', (variant, expectedClasses) => {
    const screen = render(() => <InputNumber variant={variant} />)
    const root = screen.container.querySelector('[data-slot="root"]')

    for (const expectedClass of expectedClasses) {
      expect(root?.className).toContain(expectedClass)
    }
  })

  test('defaults to outline and exposes only the supported variants', () => {
    const screen = render(() => <InputNumber />)
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.className).toContain('bg-transparent')
    expectTypeOf<InputNumberT.Variant['variant']>().toEqualTypeOf<
      'outline' | 'subtle' | 'ghost' | 'none' | undefined
    >()
  })

  test('renders native link controls outside the tab order without a press translation effect', () => {
    const screen = render(() => <InputNumber />)
    const incrementButton = screen.getByRole('button', { name: 'Increment' })
    const decrementButton = screen.getByRole('button', { name: 'Decrement' })

    expect(incrementButton).toBeInstanceOf(HTMLButtonElement)
    expect(decrementButton).toBeInstanceOf(HTMLButtonElement)
    expect(incrementButton.getAttribute('type')).toBe('button')
    expect(decrementButton.getAttribute('type')).toBe('button')
    expect(incrementButton.tabIndex).toBe(-1)
    expect(decrementButton.tabIndex).toBe(-1)
    expect(incrementButton.getAttribute('data-variant')).toBe('link')
    expect(decrementButton.getAttribute('data-variant')).toBe('link')
    expect(incrementButton.className).toContain('text-primary')
    expect(incrementButton.className).toContain('hover:text-primary/75')
    expect(incrementButton.className).toContain('data-active:text-primary/75')
    expect(incrementButton.className).not.toContain('bg-muted-active')
    expect(incrementButton.className).not.toContain('translate-y-px')
    expect(decrementButton.className).not.toContain('translate-y-px')
  })

  test.each([
    ['sm', 'w-7', 'size-4'],
    ['md', 'w-8', 'size-5'],
    ['lg', 'w-9', 'size-5'],
  ] as const)('applies Nuxt UI %s control and icon sizes', (size, buttonSize, iconSize) => {
    const screen = render(() => <InputNumber size={size} />)
    const incrementButton = screen.getByRole('button', { name: 'Increment' })
    const incrementIcon = incrementButton.querySelector('[data-slot="leading"]')

    expect(incrementButton.className).toContain(buttonSize)
    expect(incrementIcon?.className).toContain(iconSize)
    expect(incrementIcon?.getAttribute('style')).toBeNull()
  })

  test('keeps the active state throughout a held press', async () => {
    vi.useFakeTimers()

    try {
      const screen = render(() => <InputNumber defaultValue={0} />)
      const incrementButton = screen.getByRole('button', { name: 'Increment' })
      const decrementButton = screen.getByRole('button', { name: 'Decrement' })

      await fireEvent.pointerDown(incrementButton, {
        button: 0,
        pointerId: 101,
        pointerType: 'mouse',
      })

      expect(incrementButton.getAttribute('data-active')).toBe('')
      expect(decrementButton.getAttribute('data-active')).toBeNull()

      await vi.advanceTimersByTimeAsync(620)
      expect(incrementButton.getAttribute('data-active')).toBe('')

      await fireEvent.pointerUp(incrementButton, {
        button: 0,
        pointerId: 101,
        pointerType: 'mouse',
      })

      expect(incrementButton.getAttribute('data-active')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
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

  test('hydrates a formatted controlled value without replacing horizontal nodes', async () => {
    const markup = renderSsrFixture(
      '/src/forms/input-number/input-number.ssr.fixture.tsx',
      'renderInputNumberFixture',
    )
    const container = document.createElement('div')
    container.innerHTML = markup
    document.body.append(container)
    const serverHorizontalRoot = container.querySelector('#horizontal-number-root')
    const serverHorizontalInput = container.querySelector('#horizontal-number') as HTMLInputElement
    const [value, setValue] = createSignal(12.5)
    const restoreHydrationState = installHydrationState()

    const dispose = hydrate(
      () => <InputNumber id="horizontal-number" value={value()} locale="de-DE" />,
      container,
    )
    const horizontalRoot = container.querySelector('#horizontal-number-root')!
    const horizontalInput = container.querySelector('#horizontal-number') as HTMLInputElement

    expect(horizontalRoot).toBe(serverHorizontalRoot)
    expect(horizontalInput).toBe(serverHorizontalInput)
    expect(horizontalInput.value).toBe('12,5')
    expect(
      Array.from(horizontalRoot.children).map((child) => child.getAttribute('data-slot')),
    ).toEqual(['decrement', 'input', 'increment'])

    setValue(13.5)
    await waitFor(() => expect(horizontalInput.value).toBe('13,5'))

    dispose()
    container.remove()
    restoreHydrationState()
  }, 20_000)

  test('hydrates vertical control order without replacing server nodes', () => {
    const markup = renderSsrFixture(
      '/src/forms/input-number/input-number.ssr.fixture.tsx',
      'renderVerticalInputNumberFixture',
    )
    const container = document.createElement('div')
    container.innerHTML = markup
    document.body.append(container)
    const serverRoot = container.querySelector('#vertical-number-root')
    const serverInput = container.querySelector('#vertical-number') as HTMLInputElement
    const serverControls = serverRoot?.querySelector('[data-slot="controls"]')
    const restoreHydrationState = installHydrationState()

    const dispose = hydrate(
      () => (
        <InputNumber
          id="vertical-number"
          defaultValue={-2.5}
          locale="en-US"
          orientation="vertical"
        />
      ),
      container,
    )
    const root = container.querySelector('#vertical-number-root')!
    const input = container.querySelector('#vertical-number') as HTMLInputElement

    expect(root).toBe(serverRoot)
    expect(input).toBe(serverInput)
    expect(root.querySelector('[data-slot="controls"]')).toBe(serverControls)
    expect(input.value).toBe('-2.5')
    expect(Array.from(root.children).map((child) => child.getAttribute('data-slot'))).toEqual([
      'input',
      'controls',
    ])

    dispose()
    container.remove()
    restoreHydrationState()
  }, 20_000)

  test('hydrates with both conditional controls hidden', () => {
    const markup = renderSsrFixture(
      '/src/forms/input-number/input-number.ssr.fixture.tsx',
      'renderHiddenInputNumberFixture',
    )
    const container = document.createElement('div')
    container.innerHTML = markup
    document.body.append(container)
    const serverRoot = container.querySelector('#hidden-controls-number-root')
    const serverInput = container.querySelector('#hidden-controls-number') as HTMLInputElement
    const restoreHydrationState = installHydrationState()

    const dispose = hydrate(
      () => (
        <InputNumber
          id="hidden-controls-number"
          defaultValue={3.25}
          locale="en-US"
          increment={false}
          decrement={false}
        />
      ),
      container,
    )
    const root = container.querySelector('#hidden-controls-number-root')!
    const input = container.querySelector('#hidden-controls-number') as HTMLInputElement

    expect(root).toBe(serverRoot)
    expect(input).toBe(serverInput)
    expect(input.value).toBe('3.25')
    expect(Array.from(root.children).map((child) => child.getAttribute('data-slot'))).toEqual([
      'input',
    ])

    dispose()
    container.remove()
    restoreHydrationState()
  }, 20_000)
})
