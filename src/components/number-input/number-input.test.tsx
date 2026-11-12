import { getInput, setInput } from '@formisch/solid'
import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import * as v from 'valibot'
import { describe, expect, expectTypeOf, test, vi } from 'vitest'

import { renderWithOwner } from '../../test-util/owner-render'
import { Field } from '../field'
import { createForm } from '../form'

import { NumberInput } from './number-input'
import type { NumberInputT } from './number-input.types'

describe('NumberInput', () => {
  test('forwards root ref and inner inputRef', () => {
    let rootEl: HTMLDivElement | undefined
    let inputEl: HTMLInputElement | undefined

    render(() => (
      <NumberInput
        ref={(el) => (rootEl = el)}
        inputRef={(el) => (inputEl = el)}
        placeholder="ref test"
      />
    ))

    expect(rootEl).toBeInstanceOf(HTMLDivElement)
    expect(rootEl?.getAttribute('data-slot')).toBe('number-input')
    expect(inputEl).toBeInstanceOf(HTMLInputElement)
    expect(inputEl?.placeholder).toBe('ref test')
  })
  test('uses a text keyboard on iOS when negative values are allowed', () => {
    const userAgent = vi
      .spyOn(navigator, 'userAgent', 'get')
      .mockReturnValue('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')
    try {
      const negative = render(() => <NumberInput />)
      expect(negative.getByRole('spinbutton').getAttribute('inputmode')).toBe('text')
      const nonNegative = render(() => <NumberInput minValue={0} />)
      expect(nonNegative.getByRole('spinbutton').getAttribute('inputmode')).toBe('decimal')
    } finally {
      userAgent.mockRestore()
    }
  })
  test('keeps a decimal keyboard off iOS', () => {
    expect(
      render(() => <NumberInput />)
        .getByRole('spinbutton')
        .getAttribute('inputmode'),
    ).toBe('decimal')
  })
  test('renders number input with spinbutton semantics and increment/decrement controls', async () => {
    const onIncrementClick = vi.fn()
    const screen = render(() => (
      <NumberInput
        defaultValue={1}
        minValue={0}
        maxValue={10}
        placeholder="Qty"
        onIncrementClick={[onIncrementClick, 'increment-payload']}
      />
    ))

    const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')
    const increment = screen.getByRole('button', { name: 'Increment' })
    const decrement = screen.getByRole('button', { name: 'Decrement' })

    expect(spinbutton.value).toBe('1')
    expect(spinbutton.getAttribute('aria-valuenow')).toBe('1')
    expect(spinbutton.getAttribute('aria-valuemin')).toBe('0')
    expect(spinbutton.getAttribute('aria-valuemax')).toBe('10')
    expect(increment).not.toBeNull()
    expect(decrement).not.toBeNull()

    fireEvent.click(increment)
    expect(onIncrementClick).toHaveBeenCalledWith('increment-payload', expect.any(MouseEvent))
  })

  test('omits aria-valuemin and aria-valuemax when explicit bounds are not provided', () => {
    const screen = render(() => <NumberInput defaultValue={5} />)
    const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

    expect(spinbutton.getAttribute('aria-valuemin')).toBeNull()
    expect(spinbutton.getAttribute('aria-valuemax')).toBeNull()
  })

  test('places caller naming and Field relationships on the spinbutton', () => {
    const screen = render(() => (
      <>
        <span id="caller-description">Caller description</span>
        <NumberInput aria-label="Standalone quantity" />
        <Field label="Field quantity" description="Field description">
          <NumberInput aria-describedby="caller-description" />
        </Field>
      </>
    ))
    const standalone = screen.getByRole<HTMLInputElement>('spinbutton', {
      name: 'Standalone quantity',
    })
    const fieldInput = screen.getByRole<HTMLInputElement>('spinbutton', { name: 'Field quantity' })
    const root = standalone.closest('[data-slot="number-input"]')

    expect(root?.getAttribute('aria-label')).toBeNull()
    expect(standalone.getAttribute('aria-label')).toBe('Standalone quantity')
    expect(fieldInput.getAttribute('aria-labelledby')).toBe(screen.getByText('Field quantity').id)
    expect(fieldInput.getAttribute('aria-describedby')).toContain('caller-description')
    expect(fieldInput.getAttribute('aria-describedby')).toContain(
      screen.getByText('Field description').id,
    )
  })

  test('associates the native spinbutton with an external form and resets through it', async () => {
    const externalForm = document.createElement('form')
    externalForm.id = 'external-form'
    document.body.append(externalForm)

    try {
      const screen = render(() => (
        <NumberInput form="external-form" name="quantity" defaultValue={4} />
      ))
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

      expect(spinbutton.getAttribute('form')).toBe('external-form')
      expect(spinbutton.closest('[data-slot="number-input"]')?.getAttribute('form')).toBeNull()
      expect(new FormData(externalForm).get('quantity')).toBe('4')

      fireEvent.input(spinbutton, { target: { value: '7' } })
      expect(new FormData(externalForm).get('quantity')).toBe('7')

      externalForm.reset()
      await Promise.resolve()

      expect(spinbutton.value).toBe('4')
    } finally {
      externalForm.remove()
    }
  })

  test('exposes required, disabled and readonly state through aria and data attributes', () => {
    const disabledScreen = render(() => (
      <NumberInput defaultValue={1} required disabled placeholder="Qty" />
    ))
    const disabledSpinbutton = disabledScreen.getByRole<HTMLInputElement>('spinbutton')
    const disabledRoot = disabledScreen.container.querySelector('[data-slot="number-input"]')

    expect(disabledSpinbutton.required).toBe(true)
    expect(disabledSpinbutton.disabled).toBe(true)
    expect(disabledSpinbutton.getAttribute('aria-required')).toBe('true')
    expect(disabledSpinbutton.getAttribute('aria-disabled')).toBe('true')
    expect(disabledRoot?.getAttribute('data-required')).toBe('')
    expect(disabledRoot?.getAttribute('data-disabled')).toBe('')
    expect(disabledSpinbutton.getAttribute('data-required')).toBe('')
    expect(disabledSpinbutton.getAttribute('data-disabled')).toBe('')

    disabledScreen.unmount()

    const readOnlyScreen = render(() => <NumberInput defaultValue={1} readOnly />)
    const readOnlySpinbutton = readOnlyScreen.getByRole<HTMLInputElement>('spinbutton')
    const readOnlyRoot = readOnlyScreen.container.querySelector('[data-slot="number-input"]')

    expect(readOnlySpinbutton.readOnly).toBe(true)
    expect(readOnlySpinbutton.getAttribute('aria-readonly')).toBe('true')
    expect(readOnlyRoot?.getAttribute('data-readonly')).toBe('')
    expect(readOnlySpinbutton.getAttribute('data-readonly')).toBe('')
  })

  test('disables steppers at min and max boundaries', async () => {
    const maxScreen = render(() => <NumberInput defaultValue={10} minValue={0} maxValue={10} />)
    const maxSpinbutton = maxScreen.getByRole<HTMLInputElement>('spinbutton')
    const maxIncrement = maxScreen.getByRole<HTMLButtonElement>('button', { name: 'Increment' })
    const maxDecrement = maxScreen.getByRole<HTMLButtonElement>('button', { name: 'Decrement' })

    expect(maxIncrement.disabled).toBe(true)
    expect(maxDecrement.disabled).toBe(false)

    fireEvent.click(maxIncrement)
    expect(maxSpinbutton.value).toBe('10')

    maxScreen.unmount()

    const minScreen = render(() => <NumberInput defaultValue={0} minValue={0} maxValue={10} />)
    const minSpinbutton = minScreen.getByRole<HTMLInputElement>('spinbutton')
    const minIncrement = minScreen.getByRole<HTMLButtonElement>('button', { name: 'Increment' })
    const minDecrement = minScreen.getByRole<HTMLButtonElement>('button', { name: 'Decrement' })

    expect(minDecrement.disabled).toBe(true)
    expect(minIncrement.disabled).toBe(false)

    fireEvent.click(minDecrement)
    expect(minSpinbutton.value).toBe('0')
  })

  test('reactively disables steppers after reaching a boundary', async () => {
    const screen = render(() => <NumberInput defaultValue={9} minValue={0} maxValue={10} />)
    const incrementButton = screen.getByRole<HTMLButtonElement>('button', { name: 'Increment' })
    const decrementButton = screen.getByRole<HTMLButtonElement>('button', { name: 'Decrement' })

    expect(incrementButton.disabled).toBe(false)
    fireEvent.click(incrementButton)

    expect(incrementButton.disabled).toBe(true)
    expect(decrementButton.disabled).toBe(false)
  })

  test('supports uncontrolled increment and decrement behavior', async () => {
    const screen = render(() => <NumberInput defaultValue={1} />)
    const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')
    const incrementButton = screen.getByRole('button', { name: 'Increment' })
    const decrementButton = screen.getByRole('button', { name: 'Decrement' })

    expect(spinbutton.value).toBe('1')

    fireEvent.click(incrementButton)
    expect(spinbutton.value).toBe('2')

    fireEvent.click(decrementButton)
    expect(spinbutton.value).toBe('1')
  })

  test('supports ArrowUp and ArrowDown keyboard controls', async () => {
    const screen = render(() => <NumberInput defaultValue={5} />)
    const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

    spinbutton.focus()

    fireEvent.keyDown(spinbutton, { key: 'ArrowUp' })
    expect(spinbutton.value).toBe('6')

    fireEvent.keyDown(spinbutton, { key: 'ArrowDown' })
    expect(spinbutton.value).toBe('5')
  })

  test.each([
    ['tenths', 0.1, 0.2, '0.2'],
    ['small exponent steps', 0, 1e-7, '0.0000001'],
  ])(
    'steps %s without exposing binary floating-point noise',
    async (_name, value, step, expected) => {
      const onRawValueChange = vi.fn()
      const screen = render(() => (
        <NumberInput defaultValue={value} step={step} onRawValueChange={onRawValueChange} />
      ))

      fireEvent.click(screen.getByRole('button', { name: 'Increment' }))

      expect(screen.getByRole<HTMLInputElement>('spinbutton').value).toBe(expected)
      expect(onRawValueChange).toHaveBeenLastCalledWith(Number(expected))
    },
  )

  test('steps from parseable dirty text when a controlled value lags', async () => {
    const onRawValueChange = vi.fn()
    const screen = render(() => <NumberInput value={0} onRawValueChange={onRawValueChange} />)
    const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

    fireEvent.input(spinbutton, { target: { value: '7.5' } })
    fireEvent.keyDown(spinbutton, { key: 'ArrowUp' })

    expect(onRawValueChange).toHaveBeenLastCalledWith(8)
    expect(spinbutton.value).toBe('7.5')
  })

  test('does not emit changes for keyboard or wheel boundary no-ops', async () => {
    const onChange = vi.fn()
    const onRawValueChange = vi.fn()
    const screen = render(() => (
      <NumberInput
        defaultValue={10}
        maxValue={10}
        wheel
        onValueChange={onChange}
        onRawValueChange={onRawValueChange}
      />
    ))
    const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

    spinbutton.focus()
    fireEvent.keyDown(spinbutton, { key: 'ArrowUp' })
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
    const screen = render(() => <NumberInput defaultValue={0} step={4} />)
    const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

    spinbutton.focus()

    fireEvent.keyDown(spinbutton, { key: 'PageUp' })
    expect(spinbutton.value).toBe('40')

    fireEvent.keyDown(spinbutton, { key: 'PageDown' })
    expect(spinbutton.value).toBe('0')
  })

  test('supports Home and End keyboard shortcuts for min and max', async () => {
    const screen = render(() => <NumberInput defaultValue={20} minValue={-100} maxValue={100} />)
    const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

    spinbutton.focus()

    fireEvent.keyDown(spinbutton, { key: 'End' })
    expect(spinbutton.value).toBe('100')

    fireEvent.keyDown(spinbutton, { key: 'Home' })
    expect(spinbutton.value).toBe('-100')
  })

  test('leaves Home and End native when their corresponding bounds are absent', () => {
    const onRawValueChange = vi.fn()
    const screen = render(() => (
      <NumberInput defaultValue={20} onRawValueChange={onRawValueChange} />
    ))
    const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')
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
      <NumberInput defaultValue={5} onRawValueChange={onRawValueChange} />
    ))
    const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

    fireEvent.input(spinbutton, { target: { value: '7.' } })
    fireEvent.keyDown(spinbutton, { key: 'Enter' })

    expect(spinbutton.value).toBe('7')
    expect(onRawValueChange).toHaveBeenCalledOnce()
    expect(onRawValueChange).toHaveBeenCalledWith(7)
  })

  test.each(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', 'Enter'])(
    'does not handle %s while an IME composition is active',
    (key) => {
      const onRawValueChange = vi.fn()
      const screen = render(() => (
        <NumberInput
          defaultValue={5}
          minValue={0}
          maxValue={10}
          onRawValueChange={onRawValueChange}
        />
      ))
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')
      const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key })
      Object.defineProperty(event, 'isComposing', { value: true })

      spinbutton.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(false)
      expect(spinbutton.value).toBe('5')
      expect(onRawValueChange).not.toHaveBeenCalled()
    },
  )

  test('does not handle composition fallback key events', () => {
    const onRawValueChange = vi.fn()
    const screen = render(() => (
      <NumberInput defaultValue={5} onRawValueChange={onRawValueChange} />
    ))
    const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'ArrowUp',
    })
    Object.defineProperty(event, 'which', { value: 229 })

    spinbutton.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
    expect(spinbutton.value).toBe('5')
    expect(onRawValueChange).not.toHaveBeenCalled()
  })

  test('does not change value with wheel by default', () => {
    const screen = render(() => <NumberInput defaultValue={5} />)
    const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

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
    const screen = render(() => <NumberInput defaultValue={5} step={2} wheel />)
    const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

    spinbutton.focus()

    const wheelUpEvent = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaY: -100,
    })
    spinbutton.dispatchEvent(wheelUpEvent)

    expect(spinbutton.value).toBe('6')
    expect(wheelUpEvent.defaultPrevented).toBe(true)

    const wheelDownEvent = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaY: 100,
    })
    spinbutton.dispatchEvent(wheelDownEvent)

    expect(spinbutton.value).toBe('4')
    expect(wheelDownEvent.defaultPrevented).toBe(true)
  })

  test('uses the input owner document for wheel and selection locks', () => {
    const frame = document.createElement('iframe')
    document.body.append(frame)
    const frameDocument = frame.contentDocument
    const frameWindow = frame.contentWindow
    if (!frameDocument || !frameWindow) {
      throw new TypeError('Expected iframe owner document and window')
    }

    const parentSelection = document.body.style.getPropertyValue('user-select')
    const frameSelection = frameDocument.body.style.getPropertyValue('user-select')
    document.body.style.setProperty('user-select', 'text')
    frameDocument.body.style.setProperty('user-select', 'text')

    try {
      const screen = render(() => <NumberInput defaultValue={1} wheel />, {
        container: frameDocument.body,
      })
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')
      const increment = screen.getByRole<HTMLButtonElement>('button', { name: 'Increment' })
      const iframeGlobal = frameWindow as Window & typeof globalThis
      const FrameWheelEvent = iframeGlobal.WheelEvent ?? WheelEvent
      const FramePointerEvent = iframeGlobal.PointerEvent ?? iframeGlobal.MouseEvent
      const createFramePointerEvent = (type: string, pointerId: number) => {
        const event = new FramePointerEvent(type, { bubbles: true, button: 0, cancelable: true })
        Object.defineProperties(event, {
          pointerId: { value: pointerId },
          pointerType: { value: 'mouse' },
        })
        return event
      }
      const wheelEvent = new FrameWheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaY: -1,
      })

      spinbutton.focus()
      spinbutton.dispatchEvent(wheelEvent)
      expect(spinbutton.value).toBe('2')
      expect(wheelEvent.defaultPrevented).toBe(true)

      increment.dispatchEvent(createFramePointerEvent('pointerdown', 1))
      expect(frameDocument.body.style.getPropertyValue('user-select')).toBe('none')
      expect(document.body.style.getPropertyValue('user-select')).toBe('text')

      increment.dispatchEvent(createFramePointerEvent('pointercancel', 1))
      expect(frameDocument.body.style.getPropertyValue('user-select')).toBe('text')

      increment.dispatchEvent(createFramePointerEvent('pointerdown', 2))
      expect(frameDocument.body.style.getPropertyValue('user-select')).toBe('none')
      increment.dispatchEvent(createFramePointerEvent('pointerup', 2))
      expect(frameDocument.body.style.getPropertyValue('user-select')).toBe('text')
      increment.click()
      expect(spinbutton.value).toBe('3')

      increment.dispatchEvent(createFramePointerEvent('pointerdown', 3))
      expect(frameDocument.body.style.getPropertyValue('user-select')).toBe('none')
      screen.unmount()
      expect(frameDocument.body.style.getPropertyValue('user-select')).toBe('text')
    } finally {
      document.body.style.setProperty('user-select', parentSelection)
      frameDocument.body.style.setProperty('user-select', frameSelection)
      frame.remove()
    }
  })

  test('does not change value with enabled wheel when disabled or readOnly', () => {
    const disabledScreen = render(() => <NumberInput defaultValue={5} disabled wheel />)
    const disabledSpinbutton = disabledScreen.getByRole<HTMLInputElement>('spinbutton')

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

    const readOnlyScreen = render(() => <NumberInput defaultValue={5} readOnly wheel />)
    const readOnlySpinbutton = readOnlyScreen.getByRole<HTMLInputElement>('spinbutton')

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
    const screen = render(() => <NumberInput defaultValue={5} wheel />)
    const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')
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

  test('ignores horizontal wheel noise and uses Shift with the large step', () => {
    const screen = render(() => <NumberInput defaultValue={5} step={2} largeStep={10} wheel />)
    const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')
    spinbutton.focus()

    const horizontalEvent = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaX: -100,
      deltaY: 0,
    })
    spinbutton.dispatchEvent(horizontalEvent)

    expect(spinbutton.value).toBe('5')
    expect(horizontalEvent.defaultPrevented).toBe(false)

    const shiftedHorizontalEvent = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaX: -100,
      deltaY: 0,
      shiftKey: true,
    })
    spinbutton.dispatchEvent(shiftedHorizontalEvent)

    expect(spinbutton.value).toBe('10')
    expect(shiftedHorizontalEvent.defaultPrevented).toBe(true)
  })

  test('exposes formatted spinbutton text and stepper relationships', () => {
    const screen = render(() => <NumberInput id="quantity" defaultValue={12.5} locale="de-DE" />)
    const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')
    const incrementButton = screen.getByRole('button', { name: 'Increment' })
    const decrementButton = screen.getByRole('button', { name: 'Decrement' })

    expect(spinbutton.getAttribute('aria-valuetext')).toBe('12,5')
    expect(incrementButton.getAttribute('aria-controls')).toBe('quantity')
    expect(decrementButton.getAttribute('aria-controls')).toBe('quantity')
  })

  test('makes readonly step controls unavailable', () => {
    const screen = render(() => <NumberInput defaultValue={5} readOnly />)

    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Increment' }).disabled).toBe(true)
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Decrement' }).disabled).toBe(true)
  })

  test('serializes one native form value and honors disabled and readonly states', async () => {
    const screen = render(() => (
      <form>
        <NumberInput name="quantity" defaultValue={4} />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const input = screen.getByRole<HTMLInputElement>('spinbutton')

    expect(input.value).toBe('4')
    expect(new FormData(form).getAll('quantity')).toEqual(['4'])

    fireEvent.input(input, { currentTarget: { value: '40' }, target: { value: '40' } })

    expect(input.value).toBe('40')
    expect(new FormData(form).getAll('quantity')).toEqual(['40'])

    screen.unmount()

    const disabledScreen = render(() => (
      <form>
        <NumberInput name="quantity" defaultValue={4} disabled />
      </form>
    ))
    const disabledForm = disabledScreen.container.querySelector('form') as HTMLFormElement

    expect(new FormData(disabledForm).getAll('quantity')).toEqual([])

    disabledScreen.unmount()

    const readOnlyScreen = render(() => (
      <form>
        <NumberInput name="quantity" defaultValue={4} readOnly />
      </form>
    ))
    const readOnlyForm = readOnlyScreen.container.querySelector('form') as HTMLFormElement

    expect(new FormData(readOnlyForm).getAll('quantity')).toEqual(['4'])
  })

  test('submits canonical numeric value in non-English locale and removes name from visible spinbutton', () => {
    const screen = render(() => (
      <form>
        <NumberInput name="price" value="1,5" locale="de-DE" required />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')
    const hiddenInput = form.querySelector('input[type="text"][name="price"]') as HTMLInputElement

    expect(spinbutton.getAttribute('name')).toBeNull()
    expect(spinbutton.value).toBe('1,5')
    expect(hiddenInput).not.toBeNull()
    expect(hiddenInput.value).toBe('1.5')
    expect(new FormData(form).get('price')).toBe('1.5')

    // Test hidden input validation handling
    const invalidEvent = new Event('invalid', { cancelable: true })
    const preventDefaultSpy = vi.spyOn(invalidEvent, 'preventDefault')
    hiddenInput.dispatchEvent(invalidEvent)
    expect(preventDefaultSpy).toHaveBeenCalled()
    expect(document.activeElement).toBe(spinbutton)
  })

  test('parses locale-formatted string props and emits locale-formatted changes in order', async () => {
    const calls: Array<string> = []
    const screen = render(() => (
      <NumberInput
        value="12,5"
        rawValue={13.5}
        locale="de-DE"
        onRawValueChange={(value) => calls.push(`raw:${value}`)}
        onValueChange={(value) => calls.push(`text:${value}`)}
      />
    ))
    const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

    expect(spinbutton.value).toBe('13,5')
    fireEvent.keyDown(spinbutton, { key: 'ArrowUp' })

    expect(calls).toEqual(['raw:14', 'text:14'])
  })

  test('replaces dirty text when the explicit controlled value changes externally', async () => {
    const [value, setValue] = createSignal(5)
    const screen = render(() => <NumberInput value={value()} />)
    const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

    fireEvent.input(spinbutton, { target: { value: '-' } })
    expect(spinbutton.value).toBe('-')

    setValue(8)
    expect(spinbutton.value).toBe('8')
  })

  test('keeps Field aligned with explicit controlled and external Formisch values', async () => {
    const [value, setValue] = createSignal(5)
    const onRawValueChange = vi.fn()
    const { screen, value: form } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ quantity: v.number() }),
          initialInput: { quantity: 5 },
        }),
      (form) => (
        <form.Form>
          <form.Field name="quantity" label="Quantity">
            <NumberInput value={value()} onRawValueChange={onRawValueChange} />
          </form.Field>
        </form.Form>
      ),
    )
    const spinbutton = screen.getByLabelText<HTMLInputElement>('Quantity')

    fireEvent.input(spinbutton, { target: { value: '7' } })
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
        <form.Form>
          <form.Field name="quantity" label="Quantity">
            <NumberInput onRawValueChange={onRawValueChange} />
          </form.Field>
        </form.Form>
      ),
    )
    const spinbutton = screen.getByLabelText<HTMLInputElement>('Quantity')

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
        <NumberInput
          name="quantity"
          defaultValue={defaultValue()}
          onValueChange={onChange}
          onRawValueChange={onRawValueChange}
        />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

    setDefaultValue(9)
    fireEvent.input(spinbutton, { target: { value: '7' } })
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
        <NumberInput
          value={value()}
          defaultValue={1}
          onValueChange={onChange}
          onRawValueChange={onRawValueChange}
        />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

    fireEvent.input(spinbutton, { target: { value: '7' } })
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
        <NumberInput defaultValue={2} />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

    fireEvent.input(spinbutton, { target: { value: '7' } })
    form.reset()
    await Promise.resolve()

    expect(spinbutton.value).toBe('7')
  })

  test('repeats increment while the trigger is held', async () => {
    vi.useFakeTimers()

    try {
      const screen = render(() => <NumberInput defaultValue={0} />)
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')
      const incrementButton = screen.getByRole<HTMLButtonElement>('button', { name: 'Increment' })

      fireEvent.pointerDown(incrementButton, {
        button: 0,
        pointerId: 1,
        pointerType: 'mouse',
      })

      await vi.advanceTimersByTimeAsync(620)

      expect(Number(spinbutton.value)).toBeGreaterThan(1)

      fireEvent.pointerUp(incrementButton, {
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

  test('ends an active hold as soon as its callback disables the control', async () => {
    vi.useFakeTimers()

    try {
      const [disabled, setDisabled] = createSignal(false)
      const onRawValueChange = vi.fn(() => setDisabled(true))
      const screen = render(() => (
        <NumberInput defaultValue={0} disabled={disabled()} onRawValueChange={onRawValueChange} />
      ))
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')
      const incrementButton = screen.getByRole<HTMLButtonElement>('button', { name: 'Increment' })

      fireEvent.pointerDown(incrementButton, {
        button: 0,
        pointerId: 91,
        pointerType: 'mouse',
      })
      await vi.advanceTimersByTimeAsync(500)

      expect(spinbutton.value).toBe('1')
      expect(incrementButton.disabled).toBe(true)
      expect(incrementButton.getAttribute('data-active')).toBeNull()

      await vi.advanceTimersByTimeAsync(1_000)

      expect(spinbutton.value).toBe('1')
      expect(onRawValueChange).toHaveBeenCalledOnce()
    } finally {
      vi.useRealTimers()
    }
  })

  test.each(['disabled', 'readOnly'] as const)(
    'releases an active hold immediately when %s changes',
    async (property) => {
      vi.useFakeTimers()
      const previousUserSelect = document.body.style.getPropertyValue('user-select')
      try {
        const [inactive, setInactive] = createSignal(false)
        const onRawValueChange = vi.fn()
        const screen = render(() => (
          <NumberInput
            defaultValue={0}
            disabled={property === 'disabled' && inactive()}
            readOnly={property === 'readOnly' && inactive()}
            onRawValueChange={onRawValueChange}
          />
        ))
        const increment = screen.getByRole('button', { name: 'Increment' })
        fireEvent.pointerDown(increment, { button: 0, pointerId: 92, pointerType: 'mouse' })
        expect(increment.getAttribute('data-active')).toBe('')
        expect(document.body.style.getPropertyValue('user-select')).toBe('none')

        setInactive(true)

        expect(increment.getAttribute('data-active')).toBeNull()
        expect(document.body.style.getPropertyValue('user-select')).toBe(previousUserSelect)
        await vi.advanceTimersByTimeAsync(1_000)
        expect(onRawValueChange).not.toHaveBeenCalled()
        screen.unmount()
      } finally {
        document.body.style.setProperty('user-select', previousUserSelect)
        vi.useRealTimers()
      }
    },
  )

  test('increments once on pointer press and release without hold repeat', async () => {
    const screen = render(() => <NumberInput defaultValue={0} />)
    const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')
    const incrementButton = screen.getByRole('button', { name: 'Increment' })

    fireEvent.pointerDown(incrementButton, {
      button: 0,
      pointerId: 3,
      pointerType: 'mouse',
    })
    fireEvent.pointerUp(incrementButton, {
      button: 0,
      pointerId: 3,
      pointerType: 'mouse',
    })
    fireEvent.click(incrementButton)

    expect(spinbutton.value).toBe('1')
  })

  test('does not add extra increment when releasing after hold repeat', async () => {
    vi.useFakeTimers()

    try {
      const screen = render(() => <NumberInput defaultValue={0} />)
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')
      const incrementButton = screen.getByRole('button', { name: 'Increment' })

      fireEvent.pointerDown(incrementButton, {
        button: 0,
        pointerId: 4,
        pointerType: 'mouse',
      })
      await vi.advanceTimersByTimeAsync(620)

      const valueBeforeRelease = Number(spinbutton.value)
      expect(valueBeforeRelease).toBeGreaterThan(1)

      fireEvent.pointerUp(incrementButton, {
        button: 0,
        pointerId: 4,
        pointerType: 'mouse',
      })

      expect(Number(spinbutton.value)).toBe(valueBeforeRelease)
    } finally {
      vi.useRealTimers()
    }
  })

  test.each([
    ['pointer cancel', 'pointerCancel'],
    ['lost pointer capture', 'lostPointerCapture'],
    ['pointer leave', 'pointerLeave'],
  ] as const)('stops hold repeat on %s without an extra increment', async (_label, endEvent) => {
    vi.useFakeTimers()

    try {
      const screen = render(() => <NumberInput defaultValue={0} />)
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')
      const incrementButton = screen.getByRole('button', { name: 'Increment' })

      fireEvent.pointerDown(incrementButton, { button: 0, pointerId: 5, pointerType: 'mouse' })
      expect(incrementButton.getAttribute('data-active')).toBe('')
      await vi.advanceTimersByTimeAsync(620)

      const valueBeforeStop = Number(spinbutton.value)
      expect(valueBeforeStop).toBeGreaterThan(1)

      fireEvent[endEvent](incrementButton, { button: 0, pointerId: 5, pointerType: 'mouse' })
      expect(incrementButton.getAttribute('data-active')).toBeNull()

      await vi.advanceTimersByTimeAsync(240)

      expect(Number(spinbutton.value)).toBe(valueBeforeStop)
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
        <NumberInput defaultValue={0} onRawValueChange={onRawValueChange} />
      ))

      fireEvent.pointerDown(screen.getByRole('button', { name: 'Increment' }), {
        button: 0,
        pointerId: 61,
        pointerType: 'mouse',
      })
      const decrementButton = screen.getByRole('button', { name: 'Decrement' })
      fireEvent.pointerDown(decrementButton, {
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

  test('uses configurable repeat delay and interval', async () => {
    vi.useFakeTimers()

    try {
      const screen = render(() => (
        <NumberInput defaultValue={0} repeat={{ delay: 300, interval: 40 }} />
      ))
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')
      const incrementButton = screen.getByRole('button', { name: 'Increment' })

      fireEvent.pointerDown(incrementButton, {
        button: 0,
        pointerId: 7,
        pointerType: 'mouse',
      })

      await vi.advanceTimersByTimeAsync(260)
      expect(spinbutton.value).toBe('0')

      await vi.advanceTimersByTimeAsync(100)
      expect(Number(spinbutton.value)).toBeGreaterThan(1)

      fireEvent.pointerUp(incrementButton, {
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
        <NumberInput defaultValue={0} repeat={{ delay: 200, interval: 30, throttle: 120 }} />
      ))
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')
      const incrementButton = screen.getByRole('button', { name: 'Increment' })

      fireEvent.pointerDown(incrementButton, {
        button: 0,
        pointerId: 8,
        pointerType: 'mouse',
      })

      await vi.advanceTimersByTimeAsync(500)

      expect(Number(spinbutton.value)).toBeGreaterThan(1)
      expect(Number(spinbutton.value)).toBeLessThan(5)

      fireEvent.pointerUp(incrementButton, {
        button: 0,
        pointerId: 8,
        pointerType: 'mouse',
      })
    } finally {
      vi.useRealTimers()
    }
  })

  test('respects repeat=false by not repeating while holding', async () => {
    vi.useFakeTimers()

    try {
      const screen = render(() => <NumberInput defaultValue={0} repeat={false} />)
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')
      const incrementButton = screen.getByRole('button', { name: 'Increment' })

      fireEvent.pointerDown(incrementButton, {
        button: 0,
        pointerId: 9,
        pointerType: 'mouse',
      })

      await vi.advanceTimersByTimeAsync(1000)
      expect(spinbutton.value).toBe('0')

      fireEvent.pointerUp(incrementButton, {
        button: 0,
        pointerId: 9,
        pointerType: 'mouse',
      })
      fireEvent.click(incrementButton)
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
        <NumberInput defaultValue={0} onIncrementClick={onIncrementClick} />
      ))
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')
      const incrementButton = screen.getByRole('button', { name: 'Increment' })

      fireEvent.pointerDown(incrementButton, {
        button: 0,
        pointerId: 10,
        pointerType: 'mouse',
      })
      await vi.advanceTimersByTimeAsync(620)
      fireEvent.pointerUp(incrementButton, {
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
    const screen = render(() => <NumberInput defaultValue={0} />)
    const incrementButton = screen.getByRole('button', { name: 'Increment' })

    fireEvent.pointerDown(incrementButton, {
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
    const screen = render(() => <NumberInput value={5} onRawValueChange={onRawValueChange} />)
    const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')
    const incrementButton = screen.getByRole('button', { name: 'Increment' })

    fireEvent.click(incrementButton)

    expect(onRawValueChange.mock.calls.length).toBeGreaterThanOrEqual(1)
    expect(onRawValueChange).toHaveBeenLastCalledWith(6)

    await waitFor(() => {
      expect(spinbutton.value).toBe('5')
    })
  })

  test('focuses the input after trigger clicks', async () => {
    const screen = render(() => <NumberInput defaultValue={0} />)
    const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')
    const incrementButton = screen.getByRole('button', { name: 'Increment' })

    fireEvent.click(incrementButton)

    expect(document.activeElement).toBe(spinbutton)
  })

  test('rechecks disabled state before delayed autofocus and clears the timer on unmount', async () => {
    vi.useFakeTimers()

    try {
      const [disabled, setDisabled] = createSignal(false)
      const screen = render(() => (
        <NumberInput autofocus autofocusDelay={100} disabled={disabled()} />
      ))
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

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

  test.each(['vertical', 'horizontal'] as const)(
    'steps with both controls in %s orientation',
    (orientation) => {
      const screen = render(() => <NumberInput orientation={orientation} defaultValue={1} />)
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')
      const incrementButton = screen.getByRole('button', { name: 'Increment' })
      const decrementButton = screen.getByRole('button', { name: 'Decrement' })

      fireEvent.click(incrementButton)
      expect(spinbutton.value).toBe('2')

      fireEvent.click(decrementButton)
      expect(spinbutton.value).toBe('1')
    },
  )

  test('hides both increment and decrement controls when disabled by props', () => {
    const screen = render(() => <NumberInput increment={false} decrement={false} />)

    expect(screen.queryByRole('button', { name: 'Increment' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Decrement' })).toBeNull()
  })

  test('updates orientation and conditional controls while preserving the native input', () => {
    const [orientation, setOrientation] = createSignal<'vertical' | 'horizontal'>('vertical')
    const [controls, setControls] = createSignal(true)
    const screen = render(() => (
      <NumberInput orientation={orientation()} increment={controls()} decrement={controls()} />
    ))
    const input = screen.getByRole('spinbutton')
    expect(screen.getByRole('button', { name: 'Increment' })).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Decrement' })).not.toBeNull()
    expect(screen.container.querySelector('[data-slot="number-input-controls"]')).not.toBeNull()
    setOrientation('horizontal')
    expect(screen.container.querySelector('[data-slot="number-input-controls"]')).toBeNull()
    setControls(false)
    expect(screen.queryByRole('button', { name: 'Increment' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Decrement' })).toBeNull()
    expect(screen.getByRole('spinbutton')).toBe(input)
  })

  test('keeps the active state throughout a held press', async () => {
    vi.useFakeTimers()

    try {
      const screen = render(() => <NumberInput defaultValue={0} />)
      const incrementButton = screen.getByRole('button', { name: 'Increment' })
      const decrementButton = screen.getByRole('button', { name: 'Decrement' })

      fireEvent.pointerDown(incrementButton, {
        button: 0,
        pointerId: 101,
        pointerType: 'mouse',
      })

      expect(incrementButton.getAttribute('data-active')).toBe('')
      expect(decrementButton.getAttribute('data-active')).toBeNull()

      await vi.advanceTimersByTimeAsync(620)
      expect(incrementButton.getAttribute('data-active')).toBe('')

      fireEvent.pointerUp(incrementButton, {
        button: 0,
        pointerId: 101,
        pointerType: 'mouse',
      })

      expect(incrementButton.getAttribute('data-active')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  test('keeps step controls as non-submitting buttons outside the tab order', () => {
    const screen = render(() => <NumberInput />)
    const incrementButton = screen.getByRole<HTMLButtonElement>('button', { name: 'Increment' })
    const decrementButton = screen.getByRole<HTMLButtonElement>('button', { name: 'Decrement' })

    expect(incrementButton.type).toBe('button')
    expect(decrementButton.type).toBe('button')
    expect(incrementButton.tabIndex).toBe(-1)
    expect(decrementButton.tabIndex).toBe(-1)
  })

  test('exposes only the supported variants', () => {
    expectTypeOf<NumberInputT.Variants['variant']>().toEqualTypeOf<
      'outline' | 'subtle' | 'ghost' | 'none' | undefined
    >()
  })

  test('applies classes.root to the root element', () => {
    const screen = render(() => <NumberInput classes={{ root: 'root-override' }} />)
    const root = screen.container.querySelector('[data-slot="number-input"]')

    expect(root?.className).toContain('root-override')
  })

  test('applies styles.root override', () => {
    const screen = render(() => <NumberInput styles={{ root: { width: '200px' } }} />)
    const root = screen.container.querySelector<HTMLElement>('[data-slot="number-input"]')

    expect(root?.style.width).toBe('200px')
  })

  describe('partial input support', () => {
    test('allows typing minus sign without committing', async () => {
      const onRawValueChange = vi.fn()
      const screen = render(() => (
        <NumberInput defaultValue={5} onRawValueChange={onRawValueChange} />
      ))
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

      spinbutton.focus()
      fireEvent.input(spinbutton, { target: { value: '-' } })

      expect(spinbutton.value).toBe('-')
      expect(onRawValueChange).not.toHaveBeenCalled()
    })

    test('allows typing decimal point without committing', async () => {
      const onRawValueChange = vi.fn()
      const screen = render(() => (
        <NumberInput defaultValue={5} onRawValueChange={onRawValueChange} />
      ))
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

      spinbutton.focus()
      fireEvent.input(spinbutton, { target: { value: '.' } })

      expect(spinbutton.value).toBe('.')
      expect(onRawValueChange).not.toHaveBeenCalled()
    })

    test('allows typing minus and decimal point without committing', async () => {
      const onRawValueChange = vi.fn()
      const screen = render(() => (
        <NumberInput defaultValue={5} onRawValueChange={onRawValueChange} />
      ))
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

      spinbutton.focus()
      fireEvent.input(spinbutton, { target: { value: '-.' } })

      expect(spinbutton.value).toBe('-.')
      expect(onRawValueChange).not.toHaveBeenCalled()
    })

    test('allows typing number with trailing decimal point', async () => {
      const onRawValueChange = vi.fn()
      const screen = render(() => (
        <NumberInput defaultValue={5} onRawValueChange={onRawValueChange} />
      ))
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

      spinbutton.focus()
      fireEvent.input(spinbutton, { target: { value: '12.' } })

      expect(spinbutton.value).toBe('12.')
      expect(onRawValueChange).not.toHaveBeenCalled()
    })

    test('commits complete decimal number', async () => {
      const onRawValueChange = vi.fn()
      const screen = render(() => (
        <NumberInput defaultValue={5} onRawValueChange={onRawValueChange} />
      ))
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

      spinbutton.focus()
      fireEvent.input(spinbutton, { target: { value: '12.5' } })

      expect(spinbutton.value).toBe('12.5')
      expect(onRawValueChange).toHaveBeenCalledWith(12.5)
    })

    test('commits negative number', async () => {
      const onRawValueChange = vi.fn()
      const screen = render(() => (
        <NumberInput defaultValue={5} onRawValueChange={onRawValueChange} />
      ))
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

      spinbutton.focus()
      fireEvent.input(spinbutton, { target: { value: '-42' } })

      expect(spinbutton.value).toBe('-42')
      expect(onRawValueChange).toHaveBeenCalledWith(-42)
    })

    test('formats value on blur after partial input', async () => {
      const screen = render(() => <NumberInput defaultValue={5} />)
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

      spinbutton.focus()
      fireEvent.input(spinbutton, { target: { value: '-' } })
      expect(spinbutton.value).toBe('-')

      fireEvent.blur(spinbutton)
      expect(spinbutton.value).toBe('5')
    })

    test('completes partial decimal on blur', async () => {
      const onRawValueChange = vi.fn()
      const screen = render(() => (
        <NumberInput defaultValue={5} onRawValueChange={onRawValueChange} />
      ))
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

      spinbutton.focus()
      fireEvent.input(spinbutton, { target: { value: '7.' } })
      expect(spinbutton.value).toBe('7.')

      fireEvent.blur(spinbutton)
      expect(spinbutton.value).toBe('7')
      expect(onRawValueChange).toHaveBeenCalledWith(7)
    })
  })

  describe('locale-aware parsing', () => {
    test('parses comma as decimal separator in de-DE locale', async () => {
      const onRawValueChange = vi.fn()
      const screen = render(() => (
        <NumberInput defaultValue={5} locale="de-DE" onRawValueChange={onRawValueChange} />
      ))
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

      spinbutton.focus()
      fireEvent.input(spinbutton, { target: { value: '12,5' } })

      expect(onRawValueChange).toHaveBeenCalledWith(12.5)
    })

    test('allows typing comma as partial input in de-DE locale', async () => {
      const onRawValueChange = vi.fn()
      const screen = render(() => (
        <NumberInput defaultValue={5} locale="de-DE" onRawValueChange={onRawValueChange} />
      ))
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

      spinbutton.focus()
      fireEvent.input(spinbutton, { target: { value: ',' } })

      expect(spinbutton.value).toBe(',')
      expect(onRawValueChange).not.toHaveBeenCalled()
    })

    test('allows typing number with trailing comma in de-DE locale', async () => {
      const onRawValueChange = vi.fn()
      const screen = render(() => (
        <NumberInput defaultValue={5} locale="de-DE" onRawValueChange={onRawValueChange} />
      ))
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

      spinbutton.focus()
      fireEvent.input(spinbutton, { target: { value: '12,' } })

      expect(spinbutton.value).toBe('12,')
      expect(onRawValueChange).not.toHaveBeenCalled()
    })

    test('formats numbers with comma in de-DE locale', async () => {
      const screen = render(() => <NumberInput defaultValue={12.5} locale="de-DE" />)
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

      expect(spinbutton.value).toBe('12,5')
    })

    test('parses dot as decimal separator in en-US locale', async () => {
      const onRawValueChange = vi.fn()
      const screen = render(() => (
        <NumberInput defaultValue={5} locale="en-US" onRawValueChange={onRawValueChange} />
      ))
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

      spinbutton.focus()
      fireEvent.input(spinbutton, { target: { value: '12.5' } })

      expect(onRawValueChange).toHaveBeenCalledWith(12.5)
    })

    test('formats numbers with dot in en-US locale', async () => {
      const screen = render(() => <NumberInput defaultValue={12.5} locale="en-US" />)
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

      expect(spinbutton.value).toBe('12.5')
    })

    test('handles fr-FR locale with comma separator', async () => {
      const onRawValueChange = vi.fn()
      const screen = render(() => (
        <NumberInput defaultValue={5} locale="fr-FR" onRawValueChange={onRawValueChange} />
      ))
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

      spinbutton.focus()
      fireEvent.input(spinbutton, { target: { value: '99,99' } })

      expect(onRawValueChange).toHaveBeenCalledWith(99.99)
    })

    test('increments and decrements preserve locale formatting', async () => {
      const screen = render(() => <NumberInput defaultValue={10.5} locale="de-DE" />)
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')
      const incrementButton = screen.getByRole('button', { name: 'Increment' })
      const decrementButton = screen.getByRole('button', { name: 'Decrement' })

      expect(spinbutton.value).toBe('10,5')

      fireEvent.click(incrementButton)
      expect(spinbutton.value).toBe('11')

      fireEvent.click(decrementButton)
      expect(spinbutton.value).toBe('10')
    })

    test.each([
      ['fa-IR', '۱۲٫۳۴', 12.34],
      ['ar-EG', '١٢٬٣٤٥٫٦', 12345.6],
      ['ja-JP-u-nu-fullwide', '１２，３４５．６', 12345.6],
    ])('commits localized numerals for %s', (locale, localizedValue, expectedValue) => {
      const onRawValueChange = vi.fn()
      const screen = render(() => (
        <NumberInput defaultValue={0} locale={locale} onRawValueChange={onRawValueChange} />
      ))
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

      fireEvent.input(spinbutton, { target: { value: localizedValue } })
      fireEvent.blur(spinbutton)

      const formattedValue = new Intl.NumberFormat(locale, {
        useGrouping: false,
        maximumFractionDigits: 20,
      }).format(expectedValue)
      expect(onRawValueChange).toHaveBeenCalledWith(expectedValue)
      expect(spinbutton.value).toBe(formattedValue)
      expect(spinbutton.getAttribute('aria-valuetext')).toBe(formattedValue)
    })

    test('clamps Persian numeral input and synchronizes the numeric Formisch value', () => {
      const { screen, value: form } = renderWithOwner(
        () =>
          createForm({
            schema: v.object({ quantity: v.number() }),
            initialInput: { quantity: 0 },
          }),
        (form) => (
          <form.Form>
            <form.Field name="quantity" label="Quantity">
              <NumberInput locale="fa-IR" maxValue={10} />
            </form.Field>
          </form.Form>
        ),
      )
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton', { name: 'Quantity' })

      fireEvent.input(spinbutton, { target: { value: '۱۲٫۳۴' } })

      expect(getInput(form)).toEqual({ quantity: 10 })
      expect(spinbutton.getAttribute('aria-valuetext')).toBe('۱۰')
    })
  })

  describe('formatOptions', () => {
    test('formats and parses currency values', () => {
      const onRawValueChange = vi.fn()
      const screen = render(() => (
        <NumberInput
          defaultValue={12.5}
          locale="en-US"
          formatOptions={{ style: 'currency', currency: 'USD' }}
          onRawValueChange={onRawValueChange}
        />
      ))
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

      expect(spinbutton.value).toBe('$12.50')

      fireEvent.input(spinbutton, { target: { value: '$1,234.56' } })

      expect(onRawValueChange).toHaveBeenLastCalledWith(1234.56)

      fireEvent.blur(spinbutton)

      expect(spinbutton.value).toBe('$1,234.56')
    })

    test('scales percent values by the format style', () => {
      const onRawValueChange = vi.fn()
      const screen = render(() => (
        <NumberInput
          defaultValue={0.25}
          locale="en-US"
          formatOptions={{ style: 'percent' }}
          onRawValueChange={onRawValueChange}
        />
      ))
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

      expect(spinbutton.value).toBe('25%')

      fireEvent.input(spinbutton, { target: { value: '40%' } })

      expect(onRawValueChange).toHaveBeenLastCalledWith(0.4)
    })

    test('parses localized currency in de-DE', () => {
      const onRawValueChange = vi.fn()
      const screen = render(() => (
        <NumberInput
          defaultValue={0}
          locale="de-DE"
          formatOptions={{ style: 'currency', currency: 'EUR' }}
          onRawValueChange={onRawValueChange}
        />
      ))
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

      fireEvent.input(spinbutton, { target: { value: '1.234,56 €' } })

      expect(onRawValueChange).toHaveBeenLastCalledWith(1234.56)
    })
  })

  describe('stepSnapping', () => {
    test('snaps an off-grid value onto the step grid in the direction of travel', () => {
      const screen = render(() => <NumberInput defaultValue={5} step={2} />)
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

      spinbutton.focus()
      fireEvent.keyDown(spinbutton, { key: 'ArrowUp' })
      expect(spinbutton.value).toBe('6')

      fireEvent.keyDown(spinbutton, { key: 'ArrowUp' })
      expect(spinbutton.value).toBe('8')
    })

    test('anchors the step grid at minValue', () => {
      const screen = render(() => <NumberInput defaultValue={4} minValue={1} step={2} />)
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

      spinbutton.focus()
      fireEvent.keyDown(spinbutton, { key: 'ArrowUp' })
      expect(spinbutton.value).toBe('5')

      fireEvent.keyDown(spinbutton, { key: 'ArrowDown' })
      expect(spinbutton.value).toBe('3')
    })

    test('adds the step verbatim when stepSnapping is false', () => {
      const screen = render(() => <NumberInput defaultValue={5} step={2} stepSnapping={false} />)
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

      spinbutton.focus()
      fireEvent.keyDown(spinbutton, { key: 'ArrowUp' })
      expect(spinbutton.value).toBe('7')
    })

    test('does not snap typed or externally provided values', () => {
      const onRawValueChange = vi.fn()
      const screen = render(() => (
        <NumberInput defaultValue={0} step={2} onRawValueChange={onRawValueChange} />
      ))
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

      fireEvent.input(spinbutton, { target: { value: '5' } })

      expect(onRawValueChange).toHaveBeenLastCalledWith(5)

      fireEvent.blur(spinbutton)
      expect(spinbutton.value).toBe('5')
    })

    test('steps from an empty value onto the min-anchored grid', () => {
      const screen = render(() => <NumberInput defaultValue={5} minValue={1} step={2} />)
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

      fireEvent.input(spinbutton, { target: { value: '' } })
      fireEvent.blur(spinbutton)
      expect(spinbutton.value).toBe('')

      spinbutton.focus()
      fireEvent.keyDown(spinbutton, { key: 'ArrowUp' })
      expect(spinbutton.value).toBe('1')
    })
  })

  describe('clearing the input', () => {
    test('keeps an empty display and emits an empty value', () => {
      const onRawValueChange = vi.fn()
      const onValueChange = vi.fn()
      const screen = render(() => (
        <form>
          <NumberInput
            name="quantity"
            defaultValue={5}
            onRawValueChange={onRawValueChange}
            onValueChange={onValueChange}
          />
        </form>
      ))
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')
      const form = screen.container.querySelector('form') as HTMLFormElement

      fireEvent.input(spinbutton, { target: { value: '' } })
      expect(spinbutton.value).toBe('')

      fireEvent.blur(spinbutton)

      expect(spinbutton.value).toBe('')
      expect(onRawValueChange).toHaveBeenLastCalledWith(undefined)
      expect(onValueChange).toHaveBeenLastCalledWith('')
      expect(new FormData(form).get('quantity')).toBe('')
      expect(spinbutton.getAttribute('aria-valuenow')).toBeNull()
    })

    test('typing a new value after clearing commits normally', () => {
      const onRawValueChange = vi.fn()
      const screen = render(() => (
        <NumberInput defaultValue={5} onRawValueChange={onRawValueChange} />
      ))
      const spinbutton = screen.getByRole<HTMLInputElement>('spinbutton')

      fireEvent.input(spinbutton, { target: { value: '' } })
      fireEvent.blur(spinbutton)
      fireEvent.input(spinbutton, { target: { value: '42' } })

      expect(onRawValueChange).toHaveBeenLastCalledWith(42)
      expect(spinbutton.value).toBe('42')
    })
  })
})
