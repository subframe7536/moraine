import { fireEvent, render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { Field } from '../field'
import type { FieldBinding } from '../field/field-context'
import { FieldProvider } from '../field/field-context'
import { Input } from '../input/input'
import { Textarea } from '../textarea/textarea'

import { mergeAriaTokens } from './merge-aria-tokens'
import { useTextControlValue } from './use-text-control-value.ts'

describe.each([Input, Textarea])('native text control: %s', (Control) => {
  test('owns native attributes, handlers and refs on the editable element', () => {
    let input: HTMLInputElement | HTMLTextAreaElement | undefined
    const native = vi.fn()
    const screen = render(() => (
      <Control
        ref={(element: HTMLInputElement | HTMLTextAreaElement) => {
          input = element
        }}
        form="external-form"
        enterkeyhint="send"
        aria-label="Message"
        data-custom="native"
        onCopy={native}
        onCompositionStart={native}
        onKeyDown={native}
        onInvalid={native}
        onPointerDown={native}
        class="control"
        style={{ color: 'red' }}
      />
    ))
    const editable = screen.getByRole('textbox')
    expect(input).toBe(editable)
    expect(screen.container.firstElementChild).toBe(editable)
    expect(input?.className).toContain('control')
    expect(input?.style.color).toBe('red')
    for (const [name, value] of [
      ['form', 'external-form'],
      ['enterkeyhint', 'send'],
      ['aria-label', 'Message'],
      ['data-custom', 'native'],
    ]) {
      expect(editable.getAttribute(name!)).toBe(value)
    }
    for (const type of ['copy', 'compositionstart', 'keydown', 'invalid', 'pointerdown']) {
      fireEvent(editable, new Event(type, { bubbles: true }))
    }
    expect(native).toHaveBeenCalledTimes(5)
    expect(native.mock.calls.every(([event]) => event.target === editable)).toBe(true)
  })

  test('merges ARIA IDs and lets explicit false state override the field', () => {
    const screen = render(() => (
      <Field label="Message" description="Description" help="Help" required disabled readOnly>
        <Control
          id="message"
          required={false}
          disabled={false}
          readOnly={false}
          aria-required={false}
          aria-invalid={false}
          aria-describedby=" caller caller "
          aria-labelledby=" label label "
        />
      </Field>
    ))
    const control = screen.getByRole('textbox') as HTMLInputElement
    expect(control.id).toBe('message')
    expect(control.required).toBe(false)
    expect(control.disabled).toBe(false)
    expect(control.readOnly).toBe(false)
    expect(control.getAttribute('aria-required')).toBe('false')
    expect(control.getAttribute('aria-invalid')).toBe('false')
    const described = control.getAttribute('aria-describedby')!.split(' ')
    expect(described[0]).toBe('caller')
    expect(new Set(described).size).toBe(described.length)
    expect(described).toHaveLength(3)
    expect(control.getAttribute('aria-labelledby')?.split(' ')[0]).toBe('label')
    screen.unmount()
    const inherited = render(() => (
      <Field name="message" required disabled readOnly>
        <Control />
      </Field>
    ))
    const inheritedControl = inherited.getByRole('textbox') as HTMLInputElement
    expect(inheritedControl.name).toBe('message')
    expect(inheritedControl.required).toBe(true)
    expect(inheritedControl.disabled).toBe(true)
    expect(inheritedControl.readOnly).toBe(true)
  })

  test('normalizes once before field and original native event notifications', () => {
    const calls: string[] = []
    const binding: FieldBinding = {
      name: 'message',
      path: ['message'],
      value: '',
      setValue: (value) => calls.push(`field:${String(value)}`),
      emit: (type, event) => {
        if (type === 'blur' || type === 'focus') {
          calls.push(`field:${type}`)
        } else if (type === 'change') {
          calls.push(`field:${event?.type}`)
        }
      },
    }
    const screen = render(() => (
      <FieldProvider value={{ binding }}>
        <Control
          modelModifiers={{ lazy: true, trim: true, number: true }}
          onValueChange={(value) => calls.push(`value:${value}`)}
          onChange={(event: Event) => {
            calls.push(`native:${event.type}`)
            event.preventDefault()
          }}
          onBlur={(event: Event) => calls.push(`native:${event.type}`)}
          onFocus={(event: Event) => calls.push(`native:${event.type}`)}
        />
      </FieldProvider>
    ))
    const control = screen.getByRole('textbox') as HTMLInputElement
    fireEvent.input(control, { target: { value: ' 42 ' } })
    expect(calls).toEqual([])
    fireEvent.change(control)
    expect(calls).toEqual(['value:42', 'field:42', 'field:change', 'native:change'])
    expect(control.value).toBe('42')
    calls.length = 0
    fireEvent.focus(control)
    fireEvent.blur(control)
    expect(calls).toEqual(['field:focus', 'native:focus', 'field:blur', 'native:blur'])
  })
})

test('ARIA tokens retain caller order and omit empty values', () => {
  expect(mergeAriaTokens(' a b a ', 'b c', undefined)).toBe('a b c')
  expect(mergeAriaTokens('', '  ', undefined)).toBeUndefined()
})

test('Input forwards list association to the native input', () => {
  const screen = render(() => <Input list="suggestions" />)
  expect(screen.getByRole('combobox').getAttribute('list')).toBe('suggestions')
  expect(screen.container.firstElementChild).toBe(screen.getByRole('combobox'))
})

test('text value synchronization ignores unrelated reads in form callbacks', () => {
  const [value, setValue] = createSignal('first')
  const [unrelated, setUnrelated] = createSignal(0)
  // oxlint-disable-next-line subf/solid-reactivity -- Deliberate callback reads verify that effects do not subscribe to unrelated state.
  const setFormValue = vi.fn(() => {
    unrelated()
  })
  const screen = render(() => {
    useTextControlValue({
      defaultValue: () => undefined,
      getElement: () => undefined,
      getFormValue: () => undefined,
      modelModifiers: () => undefined,
      onValueChange: () => undefined,
      setFormValue,
      value,
    })
    return null
  })
  expect(setFormValue).toHaveBeenCalledExactlyOnceWith('first')
  setUnrelated(1)
  expect(setFormValue).toHaveBeenCalledOnce()
  setValue('second')
  expect(setFormValue).toHaveBeenCalledTimes(2)
  expect(setFormValue).toHaveBeenLastCalledWith('second')
  screen.unmount()
  setValue('third')
  expect(setFormValue).toHaveBeenCalledTimes(2)
})
