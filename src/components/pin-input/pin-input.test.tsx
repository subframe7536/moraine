import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import * as v from 'valibot'
import { describe, expect, test, vi } from 'vitest'

import { MoraineProvider } from '../../provider'
import { renderWithOwner } from '../../test-util/owner-render'
import { Field } from '../field/field'
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
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )

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
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )

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
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )

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
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )

    inputs[3]?.focus()
    expect(document.activeElement).toBe(inputs[2])
  })

  test('focuses the last input on click when all inputs are filled by default', () => {
    const screen = render(() => <PinInput defaultValue="1234" length={4} separator />)
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )
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
    const arrayInputs = arrayScreen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )
    expect(arrayInputs[0]?.value).toBe('1')
    expect(arrayInputs[1]?.value).toBe('2')
    expect(arrayInputs[2]?.value).toBe('3')
    expect(arrayInputs[3]?.value).toBe('')

    const stringScreen = render(() => <PinInput defaultValue="987" length={4} />)
    const stringInputs = stringScreen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )
    expect(stringInputs[0]?.value).toBe('9')
    expect(stringInputs[1]?.value).toBe('8')
    expect(stringInputs[2]?.value).toBe('7')
    expect(stringInputs[3]?.value).toBe('')
  })

  test('supports controlled value updates', () => {
    const [value, setValue] = createSignal(['a', 'b'])
    const screen = render(() => <PinInput value={value()} length={4} />)
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )

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
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )

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
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )

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
    expect(inputs[0]?.pattern).toBe('\\d{1}')

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
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )

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
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )

    inputs[2]?.focus()
    fireEvent.keyDown(inputs[2]!, { key: 'Backspace', metaKey: true })

    expect(inputs[0]?.value).toBe('')
    expect(inputs[1]?.value).toBe('')
    expect(inputs[2]?.value).toBe('')
    expect(document.activeElement).toBe(inputs[0])
  })

  test('Delete key clears current slot without moving focus', () => {
    const screen = render(() => <PinInput defaultValue={['1', '2', '3']} length={3} />)
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )

    inputs[1]?.focus()
    fireEvent.keyDown(inputs[1]!, { key: 'Delete' })

    expect(inputs[1]?.value).toBe('')
    expect(document.activeElement).toBe(inputs[1])
    expect(inputs[0]?.value).toBe('1')
    expect(inputs[2]?.value).toBe('3')
  })

  test('keeps a hole in a middle slot for a controlled array value', () => {
    const [value, setValue] = createSignal<string[]>(['1', '2', '3'])
    const screen = render(() => (
      <PinInput length={3} value={value()} onValueChange={(next) => setValue([...next])} />
    ))
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )

    inputs[1]?.focus()
    fireEvent.keyDown(inputs[1]!, { key: 'Delete' })

    expect([...inputs].map((input) => input.value)).toEqual(['1', '', '3'])
  })

  test('keeps a hole in a middle slot inside form.Field', async () => {
    const { screen } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ code: v.string() }),
          initialInput: { code: '123' },
          validate: 'submit',
        }),
      (form) => (
        <form.Form>
          <form.Field name="code">
            <PinInput length={3} validationType="number" />
          </form.Field>
        </form.Form>
      ),
    )
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )

    expect([...inputs].map((input) => input.value)).toEqual(['1', '2', '3'])

    inputs[1]?.focus()
    fireEvent.keyDown(inputs[1]!, { key: 'Delete' })
    await Promise.resolve()

    expect([...inputs].map((input) => input.value)).toEqual(['1', '', '3'])
  })

  test('Arrow keys and Home/End navigate between inputs', () => {
    const screen = render(() => <PinInput defaultValue="1234" length={4} />)
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )

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

  test('flips horizontal arrow navigation in RTL direction', () => {
    const screen = render(() => (
      <MoraineProvider dir="rtl">
        <PinInput defaultValue="1234" length={4} />
      </MoraineProvider>
    ))
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )

    inputs[0]?.focus()
    expect(document.activeElement).toBe(inputs[0])

    // In RTL, ArrowLeft moves forward (next slot: index 1)
    fireEvent.keyDown(inputs[0]!, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(inputs[1])

    // In RTL, ArrowRight moves backward (previous slot: index 0)
    fireEvent.keyDown(inputs[1]!, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(inputs[0])
  })

  test('Arrow keys clamp navigation to the first empty slot when inputs are partially filled', () => {
    const screen = render(() => <PinInput defaultValue="12" length={4} />)
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )

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
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )

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
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )

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
    const hidden = screen.container.querySelector<HTMLInputElement>(
      'input[name="verification_code"]',
    )
    expect(hidden).not.toBeNull()
    expect(hidden?.type).toBe('text')
    expect(hidden?.getAttribute('aria-hidden')).toBe('true')
    expect(hidden?.name).toBe('verification_code')
    expect(hidden?.value).toBe('123')
  })

  test('disabled state disables all inputs', () => {
    const screen = render(() => <PinInput disabled length={3} />)
    const root = screen.container.querySelector('[data-slot="pin-input"]')
    expect(root?.getAttribute('data-disabled')).toBe('')

    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )
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
    let submitted = ''
    const { screen } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({
            code: v.pipe(
              v.string('Verification code is required'),
              v.length(4, 'Verification code must be 4 digits'),
              v.regex(/^\d+$/, 'Verification code must contain digits only'),
            ),
          }),
          initialInput: { code: '' },
          validate: 'submit',
        }),
      (form) => (
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
      ),
    )

    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )
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
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )

    inputs[0]?.focus()
    fireEvent.input(inputs[0]!, { target: { value: '1234' } })

    expect(inputs[0]?.value).toBe('1')
    expect(inputs[1]?.value).toBe('2')
    expect(inputs[2]?.value).toBe('3')
    expect(inputs[3]?.value).toBe('4')
    expect(document.activeElement).toBe(inputs[3])
  })

  test('applies border-only invalid styles to slots and focus-ring only on focus', () => {
    const screen = render(() => <PinInput length={3} />)
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )
    const classes = inputs[0]?.className.split(/\s+/) ?? []
    expect(classes).toContain('data-invalid:border-danger')
    expect(classes).not.toContain('data-invalid:ring-3')
    expect(classes).toContain('focus:data-invalid:ring-danger/20')
  })

  test('associates Field label and description with the group and inputs', () => {
    const screen = render(() => (
      <Field label="Verification code" description="Enter the 4-digit code.">
        <PinInput length={4} />
      </Field>
    ))

    const label = screen.container.querySelector('label')!
    const description = screen.container.querySelector('[data-slot="field-description"]')!
    const root = screen.container.querySelector('[data-slot="pin-input"]')!
    const inputs = screen.container.querySelectorAll('[data-slot="pin-input-input"]')

    // The group is labelled through aria-labelledby; no single input owns the field id.
    expect(label.getAttribute('for')).toBeNull()
    expect(root.getAttribute('aria-labelledby')).toBe(label.id)
    expect(root.getAttribute('aria-describedby')).toBe(description.id)
    expect(inputs[0]?.getAttribute('aria-describedby')).toBe(description.id)
    expect(inputs[3]?.getAttribute('aria-describedby')).toBe(description.id)
  })

  test('form reset restores the default value without firing value callbacks', async () => {
    const onValueChange = vi.fn()
    const screen = render(() => (
      <form>
        <PinInput name="code" defaultValue="12" length={4} onValueChange={onValueChange} />
      </form>
    ))
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )
    const form = screen.container.querySelector('form')!

    inputs[0]!.focus()
    fireEvent.input(inputs[0]!, { target: { value: '9' } })
    expect(inputs[0]?.value).toBe('9')
    onValueChange.mockClear()

    form.reset()
    await waitFor(() => expect(inputs[0]?.value).toBe('1'))
    expect(inputs[1]?.value).toBe('2')
    expect(inputs[2]?.value).toBe('')
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('form reset keeps the controlled value without firing value callbacks', async () => {
    const onValueChange = vi.fn()
    const screen = render(() => (
      <form>
        <PinInput name="code" value="1234" length={4} onValueChange={onValueChange} />
      </form>
    ))
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )
    const form = screen.container.querySelector('form')!

    form.reset()
    await waitFor(() => expect(inputs[0]?.value).toBe('1'))
    expect(inputs[3]?.value).toBe('4')
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('restores the input value when a controlled update is not accepted', () => {
    const screen = render(() => <PinInput value="1234" length={4} />)
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )

    inputs[0]!.focus()
    fireEvent.input(inputs[0]!, { target: { value: '9' } })
    expect(inputs[0]?.value).toBe('1')

    fireEvent.input(inputs[0]!, { target: { value: '99' } })
    expect(inputs[0]?.value).toBe('1')
  })

  test('controlled array value keeps a string form store in sync with the prop', async () => {
    let submitted = ''
    const { screen } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ code: v.string() }),
          initialInput: { code: '' },
          validate: 'submit',
        }),
      (form) => (
        <form.Form
          onSubmit={(output) => {
            submitted = output.code
          }}
        >
          <form.Field name="code" label="Code">
            <PinInput length={4} value={['1', '2', '3', '4']} />
          </form.Field>
          <button type="submit">Submit</button>
        </form.Form>
      ),
    )

    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )
    inputs[0]!.focus()
    fireEvent.input(inputs[0]!, { target: { value: '9' } })
    expect(inputs[0]?.value).toBe('1')

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() => expect(submitted).toBe('1234'))
  })

  test('ignores non-primary mouse buttons on inputs', () => {
    const screen = render(() => <PinInput defaultValue="12" length={4} />)
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )

    inputs[0]!.focus()
    fireEvent.mouseDown(inputs[3]!, { button: 2 })
    expect(document.activeElement).toBe(inputs[0])
  })

  test('buffers IME composition and commits once on compositionend', () => {
    const onValueChange = vi.fn()
    const screen = render(() => (
      <PinInput length={4} validationType="alphanumeric" onValueChange={onValueChange} />
    ))
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )

    inputs[0]!.focus()
    fireEvent.compositionStart(inputs[0]!)

    // Intermediate composition text stays in the DOM but is not committed.
    fireEvent.input(inputs[0]!, { target: { value: 'd' } })
    fireEvent.input(inputs[0]!, { target: { value: 'dd' } })
    fireEvent.input(inputs[0]!, { target: { value: 'ddd' } })
    expect(onValueChange).not.toHaveBeenCalled()
    expect(inputs[0]?.value).toBe('ddd')

    fireEvent.compositionEnd(inputs[0]!, { target: { value: 'ddd' } })

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenLastCalledWith(['d', 'd', 'd', ''])
    expect([...inputs].map((input) => input.value)).toEqual(['d', 'd', 'd', ''])
    expect(document.activeElement).toBe(inputs[3])
  })

  test('ignores keyboard commands while a composition is buffered', () => {
    const onValueChange = vi.fn()
    const screen = render(() => (
      <PinInput
        defaultValue="12"
        length={4}
        validationType="alphanumeric"
        onValueChange={onValueChange}
      />
    ))
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )

    inputs[2]!.focus()
    fireEvent.compositionStart(inputs[2]!)
    fireEvent.input(inputs[2]!, { target: { value: 'a' } })

    fireEvent.keyDown(inputs[2]!, { key: 'Backspace' })
    expect(onValueChange).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(inputs[2])
    expect([...inputs].map((input) => input.value)).toEqual(['1', '2', 'a', ''])

    fireEvent.compositionEnd(inputs[2]!, { target: { value: '' } })
    expect(onValueChange).not.toHaveBeenCalled()
    expect([...inputs].map((input) => input.value)).toEqual(['1', '2', '', ''])
  })

  test('commits each input during IME composition on Android', () => {
    const userAgentSpy = vi
      .spyOn(window.navigator, 'userAgent', 'get')
      .mockReturnValue('Mozilla/5.0 (Linux; Android 10)')

    try {
      const onValueChange = vi.fn()
      const screen = render(() => (
        <PinInput length={3} validationType="alphanumeric" onValueChange={onValueChange} />
      ))
      const inputs = screen.container.querySelectorAll<HTMLInputElement>(
        '[data-slot="pin-input-input"]',
      )

      inputs[0]!.focus()
      fireEvent.compositionStart(inputs[0]!)
      fireEvent.input(inputs[0]!, { target: { value: 'a' } })

      expect(onValueChange).toHaveBeenCalledTimes(1)
      expect(document.activeElement).toBe(inputs[1])

      fireEvent.compositionEnd(inputs[0]!)
      expect(onValueChange).toHaveBeenCalledTimes(1)
      expect([...inputs].map((input) => input.value)).toEqual(['a', '', ''])
    } finally {
      userAgentSpy.mockRestore()
    }
  })

  test('distributes autofilled text entered through the hidden input', () => {
    const onValueChange = vi.fn()
    const onValueInvalid = vi.fn()
    const onComplete = vi.fn()
    const screen = render(() => (
      <PinInput
        name="code"
        length={6}
        validationType="number"
        onValueChange={onValueChange}
        onValueInvalid={onValueInvalid}
        onComplete={onComplete}
      />
    ))
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )
    const hidden = screen.container.querySelector<HTMLInputElement>('input[name="code"]')!

    fireEvent.input(hidden, { target: { value: '12a34b56' } })

    expect([...inputs].map((input) => input.value)).toEqual(['1', '2', '3', '4', '5', '6'])
    expect(hidden.value).toBe('123456')
    expect(document.activeElement).toBe(inputs[5])
    expect(onValueChange).toHaveBeenCalledWith(['1', '2', '3', '4', '5', '6'])
    expect(onValueInvalid).toHaveBeenCalledWith('12a34b56')
    expect(onComplete).toHaveBeenCalledWith('123456')
  })

  test('clears slots and moves focus to the first slot when hidden input autofill is cleared', async () => {
    const screen = render(() => <PinInput name="code" length={4} validationType="number" />)
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )
    const hidden = screen.container.querySelector<HTMLInputElement>('input[name="code"]')!

    fireEvent.input(hidden, { target: { value: '1234' } })
    expect(document.activeElement).toBe(inputs[3])

    fireEvent.input(hidden, { target: { value: '' } })
    expect([...inputs].map((input) => input.value)).toEqual(['', '', '', ''])
    await waitFor(() => expect(document.activeElement).toBe(inputs[0]))
  })

  test('redirects hidden input focus to the first editable slot', () => {
    const screen = render(() => <PinInput name="code" length={4} defaultValue="12" />)
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )
    const hidden = screen.container.querySelector<HTMLInputElement>('input[name="code"]')!

    hidden.focus()
    expect(document.activeElement).toBe(inputs[2])
  })

  test('carries native validation attributes on the hidden input', () => {
    const screen = render(() => (
      <PinInput name="code" length={4} validationType="number" required otp />
    ))
    const hidden = screen.container.querySelector<HTMLInputElement>('input[name="code"]')!

    expect(hidden.minLength).toBe(4)
    expect(hidden.maxLength).toBe(4)
    expect(hidden.pattern).toBe('\\d{4}')
    expect(hidden.required).toBe(true)
    expect(hidden.inputMode).toBe('numeric')
    expect(hidden.autocomplete).toBe('one-time-code')
    expect(hidden.tabIndex).toBe(-1)
  })

  test('handles native invalid event on hidden input and focuses visible input', () => {
    const screen = render(() => (
      <PinInput name="code" length={4} validationType="number" required />
    ))
    const hidden = screen.container.querySelector<HTMLInputElement>('input[name="code"]')!
    const root = screen.container.querySelector('[data-slot="pin-input"]')!
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )

    const invalidEvent = new Event('invalid', { cancelable: true })
    const preventDefaultSpy = vi.spyOn(invalidEvent, 'preventDefault')
    hidden.dispatchEvent(invalidEvent)

    expect(preventDefaultSpy).toHaveBeenCalledTimes(1)
    expect(document.activeElement).toBe(inputs[0])
    expect(root.getAttribute('data-invalid')).toBe('')
    expect(inputs[0]?.getAttribute('aria-invalid')).toBe('true')

    fireEvent.input(inputs[0]!, { target: { value: '1' } })
    expect(root.getAttribute('data-invalid')).toBeNull()
    expect(inputs[0]?.getAttribute('aria-invalid')).toBeNull()
  })

  test.each([
    ['disabled', { disabled: true }],
    ['readOnly', { readOnly: true }],
  ])('ignores hidden input autofill when %s', (_name, props) => {
    const onValueChange = vi.fn()
    const screen = render(() => (
      <PinInput
        name="code"
        length={4}
        validationType="number"
        onValueChange={onValueChange}
        {...props}
      />
    ))
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )
    const hidden = screen.container.querySelector<HTMLInputElement>('input[name="code"]')!

    fireEvent.input(hidden, { target: { value: '1234' } })

    expect([...inputs].map((input) => input.value)).toEqual(['', '', '', ''])
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('autoSubmit submits the owning form when the value completes', () => {
    const handleSubmit = vi.fn((event: SubmitEvent) => {
      event.preventDefault()
    })
    const screen = render(() => (
      <form onSubmit={handleSubmit}>
        <PinInput name="code" length={4} validationType="number" autoSubmit />
      </form>
    ))
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )

    fireEvent.input(inputs[0]!, { target: { value: '1234' } })
    expect(handleSubmit).toHaveBeenCalledTimes(1)
  })

  test('autoSubmit does not submit while the value is incomplete', () => {
    const handleSubmit = vi.fn((event: SubmitEvent) => {
      event.preventDefault()
    })
    const screen = render(() => (
      <form onSubmit={handleSubmit}>
        <PinInput name="code" length={4} validationType="number" autoSubmit />
      </form>
    ))
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )

    fireEvent.input(inputs[0]!, { target: { value: '123' } })
    expect(handleSubmit).not.toHaveBeenCalled()
  })

  test('does not fire onComplete while a controlled completion is not applied', () => {
    const onComplete = vi.fn()
    const screen = render(() => (
      <PinInput value="12" length={4} validationType="number" onComplete={onComplete} />
    ))
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )

    inputs[2]!.focus()
    fireEvent.input(inputs[2]!, { target: { value: '34' } })

    expect([...inputs].map((input) => input.value)).toEqual(['1', '2', '', ''])
    expect(onComplete).not.toHaveBeenCalled()
  })

  test('fires onComplete once a controlled completion is applied', () => {
    const [value, setValue] = createSignal<string>('12')
    const onComplete = vi.fn()
    const screen = render(() => (
      <PinInput
        value={value()}
        onValueChange={(next) => setValue(next.join(''))}
        length={4}
        validationType="number"
        onComplete={onComplete}
      />
    ))
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )

    inputs[2]!.focus()
    fireEvent.input(inputs[2]!, { target: { value: '34' } })

    expect(onComplete).toHaveBeenCalledWith('1234')
  })

  test('does not fire onComplete for externally applied controlled values', () => {
    const [value, setValue] = createSignal<string>('12')
    const onComplete = vi.fn()
    render(() => (
      <PinInput value={value()} length={4} validationType="number" onComplete={onComplete} />
    ))

    setValue('1234')
    expect(onComplete).not.toHaveBeenCalled()
  })

  test('keeps focus in place when a controlled update is not applied', () => {
    const screen = render(() => <PinInput value="12" length={4} validationType="number" />)
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )

    inputs[2]!.focus()
    fireEvent.input(inputs[2]!, { target: { value: '3' } })

    expect(inputs[2]?.value).toBe('')
    expect(document.activeElement).toBe(inputs[2])
  })

  test('fires onComplete again when a complete paste reconfirms the value', () => {
    const onComplete = vi.fn()
    const screen = render(() => <PinInput defaultValue="1234" length={4} onComplete={onComplete} />)
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )

    inputs[0]!.focus()
    fireEvent.paste(inputs[0]!, { clipboardData: { getData: () => '1234' } })

    expect(onComplete).toHaveBeenCalledWith('1234')
  })

  test('reports rejected characters via onValueInvalid', () => {
    const onValueInvalid = vi.fn()
    const screen = render(() => (
      <PinInput length={4} validationType="number" onValueInvalid={onValueInvalid} />
    ))
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )

    inputs[0]!.focus()
    fireEvent.input(inputs[0]!, { target: { value: 'a' } })
    expect(onValueInvalid).toHaveBeenCalledWith('a')
    expect(inputs[0]?.value).toBe('')

    fireEvent.paste(inputs[0]!, { clipboardData: { getData: () => '1a23' } })
    expect(onValueInvalid).toHaveBeenCalledWith('1a23')
    expect([...inputs].map((input) => input.value)).toEqual(['1', '2', '3', ''])
  })

  test('normalizeValue transforms entered and external values before filtering', () => {
    const screen = render(() => (
      <PinInput
        length={4}
        validationType="alphanumeric"
        normalizeValue={(value) => value.toUpperCase()}
      />
    ))
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )

    fireEvent.input(inputs[0]!, { target: { value: 'ab' } })
    expect(inputs[0]?.value).toBe('A')
    expect(inputs[1]?.value).toBe('B')

    const initial = render(() => (
      <PinInput
        length={4}
        validationType="alphanumeric"
        defaultValue="abcd"
        normalizeValue={(value) => value.toUpperCase()}
      />
    ))
    const initialInputs = initial.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )
    expect([...initialInputs].map((input) => input.value)).toEqual(['A', 'B', 'C', 'D'])
  })

  test('inputMode overrides the validation-derived inputMode', () => {
    const screen = render(() => <PinInput length={3} validationType="number" inputMode="tel" />)
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )
    expect(inputs[0]?.inputMode).toBe('tel')
  })

  test('exposes a single tab stop on the focused or first editable slot', () => {
    const screen = render(() => <PinInput length={4} />)
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )

    expect([...inputs].map((input) => input.tabIndex)).toEqual([0, -1, -1, -1])

    inputs[0]!.focus()
    fireEvent.input(inputs[0]!, { target: { value: '1' } })

    expect([...inputs].map((input) => input.tabIndex)).toEqual([-1, 0, -1, -1])
  })

  test('marks root and slots with filled, focused, and complete data attributes', () => {
    const screen = render(() => <PinInput length={3} defaultValue="12" />)
    const root = screen.container.querySelector('[data-slot="pin-input"]')!
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )

    expect(root.hasAttribute('data-filled')).toBe(true)
    expect(root.hasAttribute('data-complete')).toBe(false)
    expect(inputs[0]?.hasAttribute('data-filled')).toBe(true)
    expect(inputs[2]?.hasAttribute('data-filled')).toBe(false)

    inputs[0]!.focus()
    expect(root.hasAttribute('data-focused')).toBe(true)

    fireEvent.input(inputs[2]!, { target: { value: '3' } })
    expect(root.hasAttribute('data-complete')).toBe(true)
    expect(inputs[2]?.hasAttribute('data-complete')).toBe(true)
    expect(inputs[2]?.hasAttribute('data-filled')).toBe(true)

    inputs[0]!.blur()
    expect(root.hasAttribute('data-focused')).toBe(false)
  })

  test('ArrowUp and ArrowDown move focus to the field boundaries', () => {
    const screen = render(() => <PinInput defaultValue="1234" length={6} />)
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )

    inputs[1]!.focus()
    fireEvent.keyDown(inputs[1]!, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(inputs[0])

    fireEvent.keyDown(inputs[0]!, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(inputs[4])
  })

  test('rejects whitespace characters', () => {
    const screen = render(() => <PinInput length={4} />)
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )

    inputs[0]!.focus()
    fireEvent.input(inputs[0]!, { target: { value: ' ' } })
    expect(inputs[0]?.value).toBe('')
  })

  test('Ctrl+Alt+ArrowLeft navigates one slot instead of the boundary', () => {
    const screen = render(() => <PinInput defaultValue="1234" length={6} />)
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )

    inputs[3]!.focus()
    fireEvent.keyDown(inputs[3]!, { key: 'ArrowLeft', ctrlKey: true, altKey: true })
    expect(document.activeElement).toBe(inputs[2])
  })

  test('associates slot inputs with an external form via the form prop', () => {
    const screen = render(() => (
      <>
        <form id="external-form" />
        <PinInput name="code" form="external-form" length={3} />
      </>
    ))
    const inputs = screen.container.querySelectorAll<HTMLInputElement>(
      '[data-slot="pin-input-input"]',
    )
    const hidden = screen.container.querySelector<HTMLInputElement>('input[name="code"]')!

    expect(inputs[0]?.getAttribute('form')).toBe('external-form')
    expect(hidden.getAttribute('form')).toBe('external-form')
  })
})
