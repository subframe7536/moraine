import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import * as v from 'valibot'
import { describe, expect, test, vi } from 'vitest'

import { createForm } from '../form'

import { PinInput } from './pin-input'

describe('PinInput', () => {
  test('renders correct number of inputs and forwards refs', () => {
    let rootEl: HTMLDivElement | undefined
    let inputs: HTMLInputElement[] = []

    render(() => (
      <PinInput
        ref={(el) => (rootEl = el)}
        inputsRef={(els) => (inputs = els)}
        length={4}
        placeholder="○"
      />
    ))

    expect(rootEl).toBeInstanceOf(HTMLDivElement)
    expect(rootEl?.getAttribute('data-slot')).toBe('pin-input')
    expect(inputs).toHaveLength(4)
    expect(inputs[0]?.getAttribute('data-slot')).toBe('pin-input-input')
    expect(inputs[0]?.placeholder).toBe('○')
    expect(inputs[0]?.getAttribute('aria-label')).toBe('Pin input 1 of 4')
    expect(inputs[3]?.getAttribute('aria-label')).toBe('Pin input 4 of 4')
  })

  test('clears placeholder when an input is focused and restores it on blur', () => {
    const screen = render(() => <PinInput length={3} placeholder="○" />)
    const inputs = screen.container.querySelectorAll<HTMLInputElement>('input[type="text"]')

    expect(inputs[0]?.placeholder).toBe('○')
    expect(inputs[1]?.placeholder).toBe('○')

    fireEvent.focus(inputs[0]!)
    expect(inputs[0]?.placeholder).toBe('')
    expect(inputs[1]?.placeholder).toBe('○')

    fireEvent.blur(inputs[0]!)
    expect(inputs[0]?.placeholder).toBe('○')
  })

  test('keeps text selected when clicking on an already focused input', () => {
    const screen = render(() => <PinInput defaultValue="1234" length={4} />)
    const inputs = screen.container.querySelectorAll<HTMLInputElement>('input[type="text"]')

    inputs[0]?.focus()
    expect(inputs[0]?.selectionStart).toBe(0)
    expect(inputs[0]?.selectionEnd).toBe(1)

    // Simulate clicking on the already focused input
    fireEvent.mouseDown(inputs[0]!)
    expect(inputs[0]?.selectionStart).toBe(0)
    expect(inputs[0]?.selectionEnd).toBe(1)

    fireEvent.click(inputs[0]!)
    expect(inputs[0]?.selectionStart).toBe(0)
    expect(inputs[0]?.selectionEnd).toBe(1)
  })

  test('allows selecting any entered input and the first empty input, redirecting later empty inputs', () => {
    const screen = render(() => <PinInput defaultValue="12" length={4} />)
    const inputs = screen.container.querySelectorAll<HTMLInputElement>('input[type="text"]')

    // Click on input 0 (already entered) -> focuses input 0 with text selected
    fireEvent.click(inputs[0]!)
    expect(document.activeElement).toBe(inputs[0])
    expect(inputs[0]?.selectionStart).toBe(0)
    expect(inputs[0]?.selectionEnd).toBe(1)

    // Click on input 1 (already entered) -> focuses input 1 with text selected
    fireEvent.click(inputs[1]!)
    expect(document.activeElement).toBe(inputs[1])
    expect(inputs[1]?.selectionStart).toBe(0)
    expect(inputs[1]?.selectionEnd).toBe(1)

    // Click on input 2 (first empty input) -> focuses input 2
    fireEvent.click(inputs[2]!)
    expect(document.activeElement).toBe(inputs[2])

    // Click on input 3 (empty after first empty) -> redirects to input 2
    fireEvent.click(inputs[3]!)
    expect(document.activeElement).toBe(inputs[2])
  })

  test('redirects focus to the first empty slot when a later empty slot is focused directly', () => {
    const screen = render(() => <PinInput defaultValue="12" length={4} />)
    const inputs = screen.container.querySelectorAll<HTMLInputElement>('input[type="text"]')

    inputs[3]?.focus()
    expect(document.activeElement).toBe(inputs[2])
  })

  test('focuses the last input on click when all inputs are filled by default', () => {
    const screen = render(() => <PinInput defaultValue="1234" length={4} separator />)
    const inputs = screen.container.querySelectorAll<HTMLInputElement>('input[type="text"]')
    const separator = screen.container.querySelector<HTMLElement>(
      '[data-slot="pin-input-separator"]',
    )

    // Click on separator when all filled -> focuses last input with text selected
    fireEvent.click(separator!)
    expect(document.activeElement).toBe(inputs[3])
    expect(inputs[3]?.selectionStart).toBe(0)
    expect(inputs[3]?.selectionEnd).toBe(1)
  })

  test('renders default value from string or array', () => {
    const arrayScreen = render(() => <PinInput defaultValue={['1', '2', '3']} length={5} />)
    const arrayInputs =
      arrayScreen.container.querySelectorAll<HTMLInputElement>('input[type="text"]')
    expect(arrayInputs[0]?.value).toBe('1')
    expect(arrayInputs[1]?.value).toBe('2')
    expect(arrayInputs[2]?.value).toBe('3')
    expect(arrayInputs[3]?.value).toBe('')

    const stringScreen = render(() => <PinInput defaultValue="987" length={4} />)
    const stringInputs =
      stringScreen.container.querySelectorAll<HTMLInputElement>('input[type="text"]')
    expect(stringInputs[0]?.value).toBe('9')
    expect(stringInputs[1]?.value).toBe('8')
    expect(stringInputs[2]?.value).toBe('7')
    expect(stringInputs[3]?.value).toBe('')
  })

  test('supports controlled value updates', () => {
    const [value, setValue] = createSignal(['a', 'b'])
    const screen = render(() => <PinInput value={value()} length={4} />)
    const inputs = screen.container.querySelectorAll<HTMLInputElement>('input[type="text"]')

    expect(inputs[0]?.value).toBe('a')
    expect(inputs[1]?.value).toBe('b')
    expect(inputs[2]?.value).toBe('')

    setValue(['x', 'y', 'z'])
    expect(inputs[0]?.value).toBe('x')
    expect(inputs[1]?.value).toBe('y')
    expect(inputs[2]?.value).toBe('z')
  })

  test('typing a character advances focus to the next input', () => {
    const screen = render(() => <PinInput length={3} />)
    const inputs = screen.container.querySelectorAll<HTMLInputElement>('input[type="text"]')

    inputs[0]?.focus()
    fireEvent.input(inputs[0]!, { target: { value: '1' } })

    expect(inputs[0]?.value).toBe('1')
    expect(document.activeElement).toBe(inputs[1])

    fireEvent.input(inputs[1]!, { target: { value: '2' } })
    expect(inputs[1]?.value).toBe('2')
    expect(document.activeElement).toBe(inputs[2])
  })

  test('triggers onComplete when all slots are filled', () => {
    const onComplete = vi.fn()
    const onValueChange = vi.fn()
    const screen = render(() => (
      <PinInput length={3} onComplete={onComplete} onValueChange={onValueChange} />
    ))
    const inputs = screen.container.querySelectorAll<HTMLInputElement>('input[type="text"]')

    fireEvent.input(inputs[0]!, { target: { value: 'A' } })
    expect(onComplete).not.toHaveBeenCalled()
    expect(onValueChange).toHaveBeenCalledWith(['A', '', ''])

    fireEvent.input(inputs[1]!, { target: { value: 'B' } })
    expect(onComplete).not.toHaveBeenCalled()

    fireEvent.input(inputs[2]!, { target: { value: 'C' } })
    expect(onComplete).toHaveBeenCalledWith('ABC')
    expect(onValueChange).toHaveBeenCalledWith(['A', 'B', 'C'])
  })

  test('validationType="number" only accepts digits', () => {
    const screen = render(() => <PinInput validationType="number" length={3} />)
    const inputs = screen.container.querySelectorAll<HTMLInputElement>('input')

    expect(inputs[0]?.inputMode).toBe('numeric')
    expect(inputs[0]?.pattern).toBe('[0-9]*')

    fireEvent.input(inputs[0]!, { target: { value: 'a' } })
    expect(inputs[0]?.value).toBe('')

    fireEvent.input(inputs[0]!, { target: { value: '5' } })
    expect(inputs[0]?.value).toBe('5')
  })

  test('mask prop renders inputs with type="password"', () => {
    const screen = render(() => <PinInput mask length={3} />)
    const inputs = screen.container.querySelectorAll<HTMLInputElement>('input[type="password"]')
    expect(inputs).toHaveLength(3)
  })

  test('otp prop sets autocomplete="one-time-code" on the first input', () => {
    const screen = render(() => <PinInput otp length={3} />)
    const inputs = screen.container.querySelectorAll<HTMLInputElement>('input')
    expect(inputs[0]?.autocomplete).toBe('one-time-code')
    expect(inputs[1]?.autocomplete).toBe('off')
  })

  test('handles backspace on non-empty and empty inputs', () => {
    const screen = render(() => <PinInput defaultValue={['1', '2', '3']} length={3} />)
    const inputs = screen.container.querySelectorAll<HTMLInputElement>('input[type="text"]')

    inputs[2]?.focus()
    // Backspace on non-empty slot clears that slot, keeps focus
    fireEvent.keyDown(inputs[2]!, { key: 'Backspace' })
    expect(inputs[2]?.value).toBe('')
    expect(document.activeElement).toBe(inputs[2])

    // Backspace on already-empty slot clears previous slot and moves focus there
    fireEvent.keyDown(inputs[2]!, { key: 'Backspace' })
    expect(inputs[1]?.value).toBe('')
    expect(document.activeElement).toBe(inputs[1])
  })

  test('Cmd/Ctrl+Backspace clears all slots and focuses first input', () => {
    const screen = render(() => <PinInput defaultValue={['1', '2', '3']} length={3} />)
    const inputs = screen.container.querySelectorAll<HTMLInputElement>('input[type="text"]')

    inputs[2]?.focus()
    fireEvent.keyDown(inputs[2]!, { key: 'Backspace', metaKey: true })

    expect(inputs[0]?.value).toBe('')
    expect(inputs[1]?.value).toBe('')
    expect(inputs[2]?.value).toBe('')
    expect(document.activeElement).toBe(inputs[0])
  })

  test('Delete key clears current slot without moving focus', () => {
    const screen = render(() => <PinInput defaultValue={['1', '2', '3']} length={3} />)
    const inputs = screen.container.querySelectorAll<HTMLInputElement>('input[type="text"]')

    inputs[1]?.focus()
    fireEvent.keyDown(inputs[1]!, { key: 'Delete' })

    expect(inputs[1]?.value).toBe('')
    expect(document.activeElement).toBe(inputs[1])
    expect(inputs[0]?.value).toBe('1')
    expect(inputs[2]?.value).toBe('3')
  })

  test('Arrow keys and Home/End navigate between inputs', () => {
    const screen = render(() => <PinInput defaultValue="1234" length={4} />)
    const inputs = screen.container.querySelectorAll<HTMLInputElement>('input[type="text"]')

    inputs[0]?.focus()
    expect(document.activeElement).toBe(inputs[0])

    fireEvent.keyDown(inputs[0]!, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(inputs[1])

    fireEvent.keyDown(inputs[1]!, { key: 'End' })
    expect(document.activeElement).toBe(inputs[3])

    fireEvent.keyDown(inputs[3]!, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(inputs[2])

    fireEvent.keyDown(inputs[2]!, { key: 'Home' })
    expect(document.activeElement).toBe(inputs[0])
  })

  test('Arrow keys clamp navigation to the first empty slot when inputs are partially filled', () => {
    const screen = render(() => <PinInput defaultValue="12" length={4} />)
    const inputs = screen.container.querySelectorAll<HTMLInputElement>('input[type="text"]')

    inputs[0]?.focus()
    expect(document.activeElement).toBe(inputs[0])

    fireEvent.keyDown(inputs[0]!, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(inputs[1])

    fireEvent.keyDown(inputs[1]!, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(inputs[2])

    // ArrowRight on first empty slot (index 2) does not navigate into empty slot 3
    fireEvent.keyDown(inputs[2]!, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(inputs[2])

    // End on index 0 navigates to the first empty slot (index 2), not index 3
    fireEvent.keyDown(inputs[0]!, { key: 'End' })
    expect(document.activeElement).toBe(inputs[2])
  })

  test('paste distributes characters across inputs and strips dashes', () => {
    const onComplete = vi.fn()
    const screen = render(() => <PinInput length={6} onComplete={onComplete} />)
    const inputs = screen.container.querySelectorAll<HTMLInputElement>('input[type="text"]')

    inputs[0]?.focus()
    fireEvent.paste(inputs[0]!, {
      clipboardData: {
        getData: () => '123-456',
      },
    })

    expect(inputs[0]?.value).toBe('1')
    expect(inputs[1]?.value).toBe('2')
    expect(inputs[2]?.value).toBe('3')
    expect(inputs[3]?.value).toBe('4')
    expect(inputs[4]?.value).toBe('5')
    expect(inputs[5]?.value).toBe('6')
    expect(onComplete).toHaveBeenCalledWith('123456')
  })

  test('renders separators correctly with numeric step', () => {
    const screen = render(() => <PinInput length={6} separator={3} />)
    const separators = screen.container.querySelectorAll('[data-slot="pin-input-separator"]')
    expect(separators).toHaveLength(1)
    expect(separators[0]?.textContent).toBe('•')
  })

  test('renders separators with separator={true} to split inputs evenly in half', () => {
    const screen = render(() => <PinInput length={6} separator />)
    const separators = screen.container.querySelectorAll('[data-slot="pin-input-separator"]')
    expect(separators).toHaveLength(1)
    expect(separators[0]?.textContent).toBe('•')
  })

  test('renders separators at specified positions with array', () => {
    const screen = render(() => <PinInput length={7} separator={[3, 4]} />)
    const separators = screen.container.querySelectorAll('[data-slot="pin-input-separator"]')
    expect(separators).toHaveLength(2)
  })

  test('renders custom separatorRender', () => {
    const screen = render(() => (
      <PinInput
        length={6}
        separator={3}
        separatorRender={(props) => <span class="custom-sep">#{props.index}</span>}
      />
    ))
    const customSep = screen.container.querySelector('.custom-sep')
    expect(customSep).not.toBeNull()
    expect(customSep?.textContent).toBe('#2')
  })

  test('emits focus and blur only when entering or leaving the group', () => {
    const onFocus = vi.fn()
    const onBlur = vi.fn()
    const screen = render(() => <PinInput length={3} onFocus={onFocus} onBlur={onBlur} />)
    const root = screen.container.querySelector<HTMLElement>('[data-slot="pin-input"]')!
    const inputs = screen.container.querySelectorAll<HTMLInputElement>('input[type="text"]')

    // Focus enters from outside
    fireEvent.focusIn(root, { relatedTarget: null })
    expect(onFocus).toHaveBeenCalledTimes(1)

    // Move focus between input 0 and input 1 (inside group)
    fireEvent.focusOut(root, { relatedTarget: inputs[1] })
    expect(onBlur).not.toHaveBeenCalled()

    fireEvent.focusIn(root, { relatedTarget: inputs[0] })
    expect(onFocus).toHaveBeenCalledTimes(1)

    // Focus leaves group entirely
    fireEvent.focusOut(root, { relatedTarget: document.body })
    expect(onBlur).toHaveBeenCalledTimes(1)
  })

  test('renders hidden input with form name', () => {
    const screen = render(() => (
      <PinInput name="verification_code" defaultValue={['1', '2', '3']} length={4} />
    ))
    const hidden = screen.container.querySelector<HTMLInputElement>('input[type="hidden"]')
    expect(hidden).not.toBeNull()
    expect(hidden?.name).toBe('verification_code')
    expect(hidden?.value).toBe('123')
  })

  test('disabled state disables all inputs', () => {
    const screen = render(() => <PinInput disabled length={3} />)
    const root = screen.container.querySelector('[data-slot="pin-input"]')
    expect(root?.getAttribute('data-disabled')).toBe('')

    const inputs = screen.container.querySelectorAll<HTMLInputElement>('input[type="text"]')
    expect(inputs[0]?.disabled).toBe(true)
    expect(inputs[1]?.disabled).toBe(true)
    expect(inputs[2]?.disabled).toBe(true)
  })

  test('supports custom classes and styles', () => {
    const screen = render(() => (
      <PinInput
        classes={{ root: 'custom-root', input: 'custom-input', separator: 'custom-separator' }}
        styles={{ root: { 'margin-top': '10px' } }}
        separator={2}
        length={4}
      />
    ))
    const root = screen.container.querySelector('[data-slot="pin-input"]')!
    expect(root.className).toContain('custom-root')
    expect(root.getAttribute('style')).toContain('margin-top: 10px')

    const input = screen.container.querySelector('[data-slot="pin-input-input"]')!
    expect(input.className).toContain('custom-input')

    const separator = screen.container.querySelector('[data-slot="pin-input-separator"]')!
    expect(separator.className).toContain('custom-separator')
  })

  test('integrates with form.Field and createForm', async () => {
    const form = createForm({
      schema: v.object({
        code: v.pipe(
          v.string('Verification code is required'),
          v.length(4, 'Verification code must be 4 digits'),
          v.regex(/^\d+$/, 'Verification code must contain digits only'),
        ),
      }),
      initialInput: { code: '' },
      validate: 'submit',
    })

    let submitted = ''
    const screen = render(() => (
      <form.Form
        onSubmit={(output) => {
          submitted = output.code
        }}
      >
        <form.Field name="code" label="Verification code" required>
          <PinInput length={4} validationType="number" />
        </form.Field>
        <button type="submit">Verify</button>
      </form.Form>
    ))

    const inputs = screen.container.querySelectorAll<HTMLInputElement>('input[type="text"]')
    expect(inputs).toHaveLength(4)

    // Type digits one by one
    inputs[0]?.focus()
    fireEvent.input(inputs[0]!, { target: { value: '1' } })
    expect(inputs[0]?.value).toBe('1')
    expect(document.activeElement).toBe(inputs[1])

    fireEvent.input(inputs[1]!, { target: { value: '2' } })
    expect(inputs[1]?.value).toBe('2')
    expect(document.activeElement).toBe(inputs[2])

    fireEvent.input(inputs[2]!, { target: { value: '3' } })
    expect(inputs[2]?.value).toBe('3')
    expect(document.activeElement).toBe(inputs[3])

    fireEvent.input(inputs[3]!, { target: { value: '4' } })
    expect(inputs[3]?.value).toBe('4')

    // Submit form
    const submitBtn = screen.getByRole('button', { name: 'Verify' })
    fireEvent.click(submitBtn)
    await waitFor(() => expect(submitted).toBe('1234'))
  })

  test('distributes multi-character typed/autofilled value across slots in onInput', () => {
    const screen = render(() => <PinInput length={4} validationType="number" />)
    const inputs = screen.container.querySelectorAll<HTMLInputElement>('input[type="text"]')

    inputs[0]?.focus()
    fireEvent.input(inputs[0]!, { target: { value: '1234' } })

    expect(inputs[0]?.value).toBe('1')
    expect(inputs[1]?.value).toBe('2')
    expect(inputs[2]?.value).toBe('3')
    expect(inputs[3]?.value).toBe('4')
    expect(document.activeElement).toBe(inputs[3])
  })
})
