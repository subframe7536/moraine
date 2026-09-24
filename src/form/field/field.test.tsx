import { fireEvent, render } from '@solidjs/testing-library'
import { Show, createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { Input } from '../input'

import { Field } from './field'
import type { FieldBinding } from './field-context'
import { FieldProvider, useFormField } from './field-context'

function HookProbe(props: { binding?: FieldBinding }) {
  return (
    <FieldProvider value={{ binding: props.binding, error: props.binding?.error }}>
      <Probe />
    </FieldProvider>
  )
}

function Probe() {
  const field = useFormField(undefined, () => ({
    defaultId: 'probe-control',
    initialValue: 'seed',
  }))
  return (
    <button
      ref={field.setControlRef}
      id={field.id()}
      data-name={field.name()}
      data-value={String(field.value())}
      data-invalid={field.invalid() ? '' : undefined}
      onClick={() => {
        field.setFormValue('next')
        field.emit('change', new Event('change'))
      }}
    />
  )
}

function DynamicProbe(props: { replacement: boolean }) {
  const field = useFormField(undefined, () => ({ defaultId: 'dynamic-control' }))
  return (
    <Show
      when={props.replacement}
      fallback={<button ref={field.setControlRef} data-testid="first-control" />}
    >
      <button ref={field.setControlRef} data-testid="second-control" />
    </Show>
  )
}

describe('Field', () => {
  test('renders standalone presentation and accessibility state', () => {
    const screen = render(() => (
      <Field
        label="Email"
        description="Account notifications"
        hint="Required"
        help="Never shared"
        required
      >
        <Input name="email" />
      </Field>
    ))
    const input = screen.getByLabelText<HTMLInputElement>('Email')
    expect(input.name).toBe('email')
    expect(input.required).toBe(true)
    expect(input.getAttribute('aria-describedby')).toContain('-description')
    expect(screen.getByText('Required')).not.toBeNull()
    expect(screen.getByText('Never shared')).not.toBeNull()
  })

  test('supports explicit error, suppression, and render-function error state', () => {
    const [error, setError] = createSignal<string | false | undefined>('Broken')
    const screen = render(() => (
      <Field error={error()}>{(state) => <span data-testid="state">{state.error}</span>}</Field>
    ))
    expect(screen.getAllByText('Broken')).toHaveLength(2)
    expect(screen.getByTestId('state').textContent).toBe('Broken')
    setError(false)
    expect(screen.queryAllByText('Broken')).toHaveLength(0)
  })

  test('keeps explicit control false values above inherited state', () => {
    const screen = render(() => (
      <Field label="Message" required disabled readOnly>
        <Input required={false} disabled={false} readOnly={false} />
      </Field>
    ))
    const input = screen.getByLabelText<HTMLInputElement>('Message')
    expect(input.required).toBe(false)
    expect(input.disabled).toBe(false)
    expect(input.readOnly).toBe(false)
  })

  test('targets the last registered bound control while bind:false stays non-primary', () => {
    const screen = render(() => (
      <Field label="Values">
        <Input id="first" />
        <Input id="second" />
      </Field>
    ))
    expect(screen.getByText<HTMLLabelElement>('Values').htmlFor).toBe('second')
  })

  test('uses a generic binding without Formisch', () => {
    const [value, setValue] = createSignal<unknown>(undefined)
    const setFormValue = vi.fn((next: unknown) => setValue(next))
    const emit = vi.fn()
    const binding: FieldBinding = {
      name: 'message',
      path: ['message'],
      get value() {
        return value()
      },
      error: 'Binding error',
      runtimeState: { touched: true, dirty: true, focused: false, validating: false, valid: false },
      setValue: setFormValue,
      emit,
    }
    const screen = render(() => <HookProbe binding={binding} />)
    const button = screen.getByRole('button')
    expect(setFormValue).toHaveBeenCalledExactlyOnceWith('seed')
    expect(button.dataset.name).toBe('message')
    expect(button.dataset.invalid).toBe('')
    fireEvent.click(button)
    expect(setFormValue).toHaveBeenLastCalledWith('next')
    expect(emit).toHaveBeenCalledWith('change', expect.any(Event))
  })

  test('works without a binding', () => {
    const screen = render(() => <HookProbe />)
    expect(screen.getByRole('button').dataset.value).toBe('undefined')
  })

  test('delivers the mounted control element to a binding', () => {
    const controlRef = vi.fn()
    const binding: FieldBinding = {
      controlRef,
      setValue: vi.fn(),
      emit: vi.fn(),
    }
    const screen = render(() => <HookProbe binding={binding} />)

    expect(controlRef).toHaveBeenCalledWith(screen.getByRole('button'))
  })

  test('updates a binding when its mounted control is replaced', () => {
    const controlRef = vi.fn()
    const binding: FieldBinding = {
      controlRef,
      setValue: vi.fn(),
      emit: vi.fn(),
    }
    let replace!: () => void
    const screen = render(() => {
      const [replacement, setReplacement] = createSignal(false)
      replace = () => setReplacement(true)
      return (
        <FieldProvider value={{ binding }}>
          <DynamicProbe replacement={replacement()} />
        </FieldProvider>
      )
    })

    expect(controlRef).toHaveBeenLastCalledWith(screen.getByTestId('first-control'))
    replace()
    expect(controlRef).toHaveBeenLastCalledWith(screen.getByTestId('second-control'))
  })

  test('delivers a control in a shadow root instead of a same-ID light-DOM element', () => {
    const controlRef = vi.fn()
    const binding: FieldBinding = {
      controlRef,
      setValue: vi.fn(),
      emit: vi.fn(),
    }
    const lightControl = document.createElement('button')
    lightControl.id = 'probe-control'
    const host = document.createElement('div')
    const shadow = host.attachShadow({ mode: 'open' })
    document.body.append(lightControl, host)

    const screen = render(() => <HookProbe binding={binding} />, {
      container: shadow as unknown as HTMLElement,
    })

    expect(controlRef).toHaveBeenLastCalledWith(shadow.querySelector('button'))
    expect(controlRef).not.toHaveBeenCalledWith(lightControl)

    screen.unmount()
    lightControl.remove()
    host.remove()
  })

  test('delivers a control in another document instead of a same-ID light-DOM element', () => {
    const controlRef = vi.fn()
    const binding: FieldBinding = {
      controlRef,
      setValue: vi.fn(),
      emit: vi.fn(),
    }
    const lightControl = document.createElement('button')
    lightControl.id = 'probe-control'
    const frame = document.createElement('iframe')
    document.body.append(lightControl, frame)
    const frameDocument = frame.contentDocument!

    const screen = render(() => <HookProbe binding={binding} />, {
      container: frameDocument.body,
    })

    expect(controlRef).toHaveBeenLastCalledWith(frameDocument.querySelector('button'))
    expect(controlRef).not.toHaveBeenCalledWith(lightControl)

    screen.unmount()
    lightControl.remove()
    frame.remove()
  })
})
