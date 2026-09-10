import type { FieldStore } from '@formisch/solid'
import { fireEvent, render } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { FormFieldProvider } from '../form/form-context'
import { FormField } from '../form/form-field'
import { Input } from '../input/input'
import { Textarea } from '../textarea/textarea'

import { mergeAriaTokens } from './merge-aria-tokens'

describe.each([Input, Textarea])('native text control: %s', (Control) => {
  test('owns native attributes, handlers and refs on the editable element', () => {
    let wrapper: HTMLDivElement | undefined
    let input: HTMLInputElement | HTMLTextAreaElement | undefined
    const native = vi.fn()
    const screen = render(() => (
      <Control
        ref={(element) => {
          wrapper = element
        }}
        {...(Control === Input
          ? {
              inputRef: (element: HTMLInputElement) => {
                input = element
              },
            }
          : {
              textareaRef: (element: HTMLTextAreaElement) => {
                input = element
              },
            })}
        form="external-form"
        enterkeyhint="send"
        aria-label="Message"
        data-custom="native"
        onCopy={native}
        onCompositionStart={native}
        onKeyDown={native}
        onInvalid={native}
        onPointerDown={native}
        class="wrapper"
        style={{ color: 'red' }}
      />
    ))
    const editable = screen.getByRole('textbox')
    expect(input).toBe(editable)
    expect(wrapper).toBe(editable.parentElement)
    expect(wrapper?.className).toBe('wrapper')
    expect(wrapper?.style.color).toBe('red')
    for (const [name, value] of [
      ['form', 'external-form'],
      ['enterkeyhint', 'send'],
      ['aria-label', 'Message'],
      ['data-custom', 'native'],
    ]) {
      expect(editable.getAttribute(name!)).toBe(value)
      expect(wrapper?.hasAttribute(name!)).toBe(false)
    }
    for (const type of ['copy', 'compositionstart', 'keydown', 'invalid', 'pointerdown']) {
      fireEvent(editable, new Event(type, { bubbles: true }))
    }
    expect(native).toHaveBeenCalledTimes(5)
    expect(native.mock.calls.every(([event]) => event.target === editable)).toBe(true)
    fireEvent(wrapper!, new Event('pointerdown', { bubbles: true }))
    expect(native).toHaveBeenCalledTimes(5)
  })

  test('merges ARIA IDs and lets explicit false state override the field', () => {
    const screen = render(() => (
      <FormField label="Message" description="Description" help="Help" required disabled readOnly>
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
      </FormField>
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
      <FormField name="message" required disabled readOnly>
        <Control />
      </FormField>
    ))
    const inheritedControl = inherited.getByRole('textbox') as HTMLInputElement
    expect(inheritedControl.name).toBe('message')
    expect(inheritedControl.required).toBe(true)
    expect(inheritedControl.disabled).toBe(true)
    expect(inheritedControl.readOnly).toBe(true)
  })

  test('normalizes once before field and original native event notifications', () => {
    const calls: string[] = []
    const field = {
      input: '',
      onInput: (value: unknown) => calls.push(`field:${String(value)}`),
      props: {
        ref: () => {},
        name: 'message',
        onBlur: () => calls.push('field:blur'),
        onFocus: () => calls.push('field:focus'),
        onChange: (event: Event) => calls.push(`field:${event.type}`),
      },
    } as unknown as FieldStore
    const screen = render(() => (
      <FormFieldProvider value={{ ariaId: 'message', field }}>
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
      </FormFieldProvider>
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
  expect(screen.container.firstElementChild?.hasAttribute('list')).toBe(false)
})
