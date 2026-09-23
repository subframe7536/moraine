import { getInput, setInput } from '@formisch/solid'
import { fireEvent, render as baseRender } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import * as v from 'valibot'
import { describe, expect, test, vi } from 'vitest'

import { MoraineProvider } from '../../provider'
import { renderWithOwner } from '../../test-utils/owner-render'
import { createForm } from '../form'

import { Input } from './input'

const render: typeof baseRender = (ui, options) =>
  baseRender(() => <MoraineProvider>{ui()}</MoraineProvider>, options)

describe('Input', () => {
  test('renders component defaults when provider is absent', () => {
    const screen = baseRender(() => <Input />)
    const root = screen.container.querySelector('[data-slot="input"]')
    expect(root?.className).not.toBe('')
  })

  test('forwards ref to its only native element', () => {
    let control: HTMLInputElement | undefined
    const screen = render(() => <Input ref={(el) => (control = el)} placeholder="ref test" />)
    expect(control).toBeInstanceOf(HTMLInputElement)
    expect(screen.container.firstElementChild).toBe(control)
    expect(control?.getAttribute('data-slot')).toBe('input')
    expect(control?.placeholder).toBe('ref test')
  })

  test('renders base attributes', () => {
    const screen = render(() => (
      <Input
        id="email-input"
        name="email"
        type="email"
        placeholder="Enter email"
        autocomplete="email"
        maxLength={20}
        required
        disabled
      />
    ))
    const input = screen.getByPlaceholderText<HTMLInputElement>('Enter email')
    const root = screen.container.querySelector('[data-slot="input"]')

    expect(input.getAttribute('id')).toBe('email-input')
    expect(input.getAttribute('name')).toBe('email')
    expect(input.getAttribute('type')).toBe('email')
    expect(input.autocomplete).toBe('email')
    expect(input.maxLength).toBe(20)
    expect(input.disabled).toBe(true)
    expect(input.required).toBe(true)
    expect(input.getAttribute('aria-required')).toBe('true')
    expect(input.getAttribute('aria-disabled')).toBe('true')
    expect(root?.getAttribute('data-required')).toBe('')
    expect(root?.getAttribute('data-disabled')).toBe('')
    expect(input.getAttribute('data-required')).toBe('')
    expect(input.getAttribute('data-disabled')).toBe('')
  })

  test('exposes readonly state through aria and data attributes', () => {
    const screen = render(() => <Input readOnly />)
    const input = screen.getByRole<HTMLInputElement>('textbox')
    const root = screen.container.querySelector('[data-slot="input"]')

    expect(input.readOnly).toBe(true)
    expect(input.getAttribute('aria-readonly')).toBe('true')
    expect(root?.getAttribute('data-readonly')).toBe('')
    expect(input.getAttribute('data-readonly')).toBe('')
  })

  test('uses the Nuxt UI input density scale for every size', () => {
    const screen = render(() => (
      <>
        <Input size="sm" />
        <Input size="md" />
        <Input size="lg" />
      </>
    ))
    const roots = screen.container.querySelectorAll('[data-slot="input"]')
    const rootClasses = Array.from(roots).map((root) => root.className.split(/\s+/))
    const inputs = screen.getAllByRole('textbox')
    const inputClasses = inputs.map((input) => input.className.split(/\s+/))

    const expectedRootClasses = [
      ['text-xs', 'h-7'],
      ['text-sm', 'h-8'],
      ['text-base', 'h-9'],
    ]
    const expectedInputClasses = [
      ['leading-4', 'px-1.5', 'py-1'],
      ['leading-5', 'px-2', 'py-1.5'],
      ['leading-6', 'px-2.5', 'py-2'],
    ]

    expectedRootClasses.forEach((classes, index) => {
      classes.forEach((className) => {
        expect(rootClasses[index]).toContain(className)
      })
    })

    expectedInputClasses.forEach((classes, index) => {
      classes.forEach((className) => {
        expect(inputClasses[index]).toContain(className)
      })
    })
  })

  test('applies trim modifier', async () => {
    const onValueChange = vi.fn()
    const screen = render(() => (
      <Input onValueChange={onValueChange} modelModifiers={{ trim: true }} />
    ))
    const input = screen.getByRole<HTMLInputElement>('textbox')

    fireEvent.input(input, {
      target: { value: ' test  ' },
      currentTarget: { value: ' test  ' },
    })

    expect(onValueChange).toHaveBeenLastCalledWith('test')
  })

  test('supports lazy and empty value strategy modifiers', async () => {
    const lazyChange = vi.fn()
    const preserveChange = vi.fn()
    const nullableChange = vi.fn()
    const optionalChange = vi.fn()

    const screen = render(() => (
      <>
        <Input onValueChange={lazyChange} modelModifiers={{ lazy: true }} />
        <Input onValueChange={preserveChange} />
        <Input onValueChange={nullableChange} modelModifiers={{ empty: 'null' }} />
        <Input onValueChange={optionalChange} modelModifiers={{ empty: 'undefined' }} />
      </>
    ))
    const [lazyInput, preserveInput, nullableInput, optionalInput] = screen.getAllByRole('textbox')

    fireEvent.input(lazyInput!, {
      target: { value: 'lazy' },
      currentTarget: { value: 'lazy' },
    })
    expect(lazyChange).toHaveBeenCalledTimes(0)
    fireEvent.change(lazyInput!, {
      target: { value: 'lazy' },
      currentTarget: { value: 'lazy' },
    })
    expect(lazyChange).toHaveBeenLastCalledWith('lazy')

    fireEvent.input(preserveInput!, {
      target: { value: '' },
      currentTarget: { value: '' },
    })
    expect(preserveChange).toHaveBeenLastCalledWith('')

    fireEvent.input(nullableInput!, {
      target: { value: '' },
      currentTarget: { value: '' },
    })
    expect(nullableChange).toHaveBeenLastCalledWith(null)

    fireEvent.input(optionalInput!, {
      target: { value: '' },
      currentTarget: { value: '' },
    })
    expect(optionalChange).toHaveBeenLastCalledWith(undefined)
  })

  test('syncs trimmed DOM value on change', async () => {
    const screen = render(() => <Input modelModifiers={{ trim: true, lazy: true }} />)
    const input = screen.getByRole<HTMLInputElement>('textbox')

    fireEvent.change(input, {
      target: { value: 'value  ' },
      currentTarget: { value: 'value  ' },
    })

    expect(input.value).toBe('value')
  })

  test('forwards onChange and onBlur handlers', async () => {
    const onChange = vi.fn()
    const onBlur = vi.fn()
    const screen = render(() => <Input onChange={onChange} onBlur={onBlur} />)
    const input = screen.getByRole<HTMLInputElement>('textbox')

    fireEvent.change(input)
    fireEvent.blur(input)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onBlur).toHaveBeenCalledTimes(1)
  })

  test('preserves native input ordering during IME and change commits', async () => {
    const calls: string[] = []
    const screen = render(() => (
      <Input
        onInput={() => calls.push('input')}
        onValueChange={(value) => calls.push(`value:${value}`)}
        onChange={(event) => calls.push(`change:${event.currentTarget.value}`)}
      />
    ))
    const input = screen.getByRole<HTMLInputElement>('textbox')

    fireEvent.input(input, {
      isComposing: true,
      target: { value: '拼' },
      currentTarget: { value: '拼' },
    })
    fireEvent.change(input, {
      target: { value: '拼音' },
      currentTarget: { value: '拼音' },
    })

    expect(calls).toEqual(['value:拼', 'input', 'change:拼音'])
  })

  test('defers rejected controlled rollback until composition commits', async () => {
    const onValueChange = vi.fn()
    const screen = render(() => <Input value="Locked" onValueChange={onValueChange} />)
    const input = screen.getByRole<HTMLInputElement>('textbox')

    fireEvent.compositionStart(input)
    fireEvent.input(input, {
      target: { value: '拼' },
      currentTarget: { value: '拼' },
    })

    expect(input.value).toBe('拼')

    fireEvent.compositionEnd(input)
    fireEvent.input(input, {
      target: { value: '拼音' },
      currentTarget: { value: '拼音' },
    })

    expect(input.value).toBe('拼音')
    await Promise.resolve()
    expect(onValueChange).toHaveBeenLastCalledWith('拼音')
    expect(input.value).toBe('Locked')
  })

  test('applies the latest controlled value after composition ends', async () => {
    const [value, setValue] = createSignal('Initial')
    const screen = render(() => (
      <Input value={value()} onValueChange={(nextValue) => setValue(`${nextValue}!`)} />
    ))
    const input = screen.getByRole<HTMLInputElement>('textbox')

    fireEvent.compositionStart(input)
    fireEvent.input(input, {
      target: { value: '拼' },
      currentTarget: { value: '拼' },
    })

    expect(input.value).toBe('拼')

    fireEvent.compositionEnd(input)
    fireEvent.input(input, {
      target: { value: '拼音' },
      currentTarget: { value: '拼音' },
    })

    expect(input.value).toBe('拼音')
    await Promise.resolve()
    expect(input.value).toBe('拼音!')
  })

  test('does not publish programmatic value property changes without a native event', () => {
    const onValueChange = vi.fn()
    const screen = render(() => <Input onValueChange={onValueChange} />)
    const input = screen.getByRole<HTMLInputElement>('textbox')

    input.value = 'Programmatic'

    expect(input.value).toBe('Programmatic')
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('rolls explicit controlled values back after input and caller cancellation', async () => {
    const onValueChange = vi.fn()
    const screen = render(() => <Input value="Locked" onValueChange={onValueChange} />)
    const input = screen.getByRole<HTMLInputElement>('textbox')

    fireEvent.input(input, {
      target: { value: 'Requested' },
      currentTarget: { value: 'Requested' },
    })

    expect(onValueChange).toHaveBeenCalledWith('Requested')
    expect(input.value).toBe('Locked')
    screen.unmount()

    const cancelledChange = vi.fn()
    const cancelled = render(() => (
      <Input
        value="Locked"
        onInput={(event) => event.preventDefault()}
        onValueChange={cancelledChange}
      />
    ))
    const cancelledInput = cancelled.getByRole<HTMLInputElement>('textbox')

    cancelledInput.value = 'Cancelled'
    const cancelledEvent = new InputEvent('input', { bubbles: true, cancelable: true })
    cancelledInput.dispatchEvent(cancelledEvent)

    expect(cancelledEvent.defaultPrevented).toBe(true)
    expect(cancelledChange).toHaveBeenCalledWith('Cancelled')
    expect(cancelledInput.value).toBe('Locked')
  })

  test('allows lazy controlled edits until change then restores the authoritative value', async () => {
    const onValueChange = vi.fn()
    const screen = render(() => (
      <Input value="Locked" modelModifiers={{ lazy: true }} onValueChange={onValueChange} />
    ))
    const input = screen.getByRole<HTMLInputElement>('textbox')

    fireEvent.input(input, {
      target: { value: 'Draft' },
      currentTarget: { value: 'Draft' },
    })
    expect(input.value).toBe('Draft')
    expect(onValueChange).not.toHaveBeenCalled()

    fireEvent.change(input, {
      target: { value: 'Draft' },
      currentTarget: { value: 'Draft' },
    })
    expect(onValueChange).toHaveBeenCalledWith('Draft')
    expect(input.value).toBe('Locked')
  })

  test('keeps a lazy controlled composition draft until change commits it once', async () => {
    const [value, setValue] = createSignal('')
    const onValueChange = vi.fn((nextValue: string) => setValue(nextValue))
    const screen = render(() => (
      <Input value={value()} modelModifiers={{ lazy: true }} onValueChange={onValueChange} />
    ))
    const input = screen.getByRole<HTMLInputElement>('textbox')

    fireEvent.compositionStart(input)
    fireEvent.input(input, { target: { value: '拼音' }, currentTarget: { value: '拼音' } })
    fireEvent.compositionEnd(input)
    await Promise.resolve()

    expect(input.value).toBe('拼音')
    expect(onValueChange).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { value: '拼音' }, currentTarget: { value: '拼音' } })

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenCalledWith('拼音')
    expect(input.value).toBe('拼音')
  })

  test('keeps a lazy Formisch composition draft until change commits it once', async () => {
    const onValueChange = vi.fn()
    const { screen, value: form } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ value: v.string() }),
          initialInput: { value: '' },
        }),
      (form) => (
        <form.Form>
          <form.Field name="value" label="Value">
            <Input modelModifiers={{ lazy: true }} onValueChange={onValueChange} />
          </form.Field>
        </form.Form>
      ),
    )
    const input = screen.getByLabelText<HTMLInputElement>('Value')

    fireEvent.compositionStart(input)
    fireEvent.input(input, { target: { value: '拼音' }, currentTarget: { value: '拼音' } })
    fireEvent.compositionEnd(input)
    await Promise.resolve()

    expect(input.value).toBe('拼音')
    expect(getInput(form)).toEqual({ value: '' })
    expect(onValueChange).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { value: '拼音' }, currentTarget: { value: '拼音' } })

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(getInput(form)).toEqual({ value: '拼音' })
  })

  test('applies real external updates over a retained lazy composition draft', async () => {
    const [value, setValue] = createSignal('Initial')
    const controlled = render(() => <Input value={value()} modelModifiers={{ lazy: true }} />)
    const controlledInput = controlled.getByRole<HTMLInputElement>('textbox')

    fireEvent.compositionStart(controlledInput)
    fireEvent.input(controlledInput, { target: { value: '草稿' } })
    fireEvent.compositionEnd(controlledInput)
    await Promise.resolve()
    expect(controlledInput.value).toBe('草稿')

    setValue('External')
    expect(controlledInput.value).toBe('External')
    controlled.unmount()

    const { screen, value: form } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ value: v.string() }),
          initialInput: { value: 'Initial' },
        }),
      (form) => (
        <form.Form>
          <form.Field name="value" label="Value">
            <Input modelModifiers={{ lazy: true }} />
          </form.Field>
        </form.Form>
      ),
    )
    const formInput = screen.getByLabelText<HTMLInputElement>('Value')

    fireEvent.compositionStart(formInput)
    fireEvent.input(formInput, { target: { value: '草稿' } })
    fireEvent.compositionEnd(formInput)
    await Promise.resolve()
    expect(formInput.value).toBe('草稿')

    setInput(form, { path: ['value'], input: 'External' })
    expect(formInput.value).toBe('External')
  })

  test('accepts synchronous controlled updates from onValueChange', async () => {
    const [value, setValue] = createSignal('Initial')
    const screen = render(() => <Input value={value()} onValueChange={setValue} />)
    const input = screen.getByRole<HTMLInputElement>('textbox')

    fireEvent.input(input, {
      target: { value: 'Accepted' },
      currentTarget: { value: 'Accepted' },
    })

    expect(input.value).toBe('Accepted')
  })

  test('cancels delayed autofocus on unmount and rechecks disabled state', () => {
    vi.useFakeTimers()

    try {
      const disposed = render(() => <Input autofocus autofocusDelay={20} />)
      const disposedInput = disposed.getByRole<HTMLInputElement>('textbox')
      const disposedFocus = vi.spyOn(disposedInput, 'focus')

      disposed.unmount()
      vi.advanceTimersByTime(20)
      expect(disposedFocus).not.toHaveBeenCalled()

      const [disabled, setDisabled] = createSignal(false)
      const delayed = render(() => <Input autofocus autofocusDelay={20} disabled={disabled()} />)
      const delayedInput = delayed.getByRole<HTMLInputElement>('textbox')
      const delayedFocus = vi.spyOn(delayedInput, 'focus')

      setDisabled(true)
      vi.advanceTimersByTime(20)
      expect(delayedFocus).not.toHaveBeenCalled()

      const readonly = render(() => <Input autofocus autofocusDelay={20} readOnly />)
      const readonlyInput = readonly.getByRole<HTMLInputElement>('textbox')
      const readonlyFocus = vi.spyOn(readonlyInput, 'focus')

      vi.advanceTimersByTime(20)
      expect(readonlyFocus).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  test('keeps readonly values serializable and omits disabled values', () => {
    const screen = render(() => (
      <form>
        <Input name="readonly" value="Included" readOnly />
        <Input name="disabled" value="Omitted" disabled />
      </form>
    ))
    const form = screen.container.querySelector('form')!
    const data = new FormData(form)

    expect(data.get('readonly')).toBe('Included')
    expect(data.has('disabled')).toBe(false)
  })

  test('uses native required validity and resets uncontrolled values without callbacks', async () => {
    const [defaultValue, setDefaultValue] = createSignal('Initial')
    const onValueChange = vi.fn()
    const screen = render(() => (
      <form>
        <Input name="value" defaultValue={defaultValue()} required onValueChange={onValueChange} />
      </form>
    ))
    const form = screen.container.querySelector('form')!
    const input = screen.getByRole<HTMLInputElement>('textbox')

    expect(form.checkValidity()).toBe(true)
    setDefaultValue('Changed default')
    fireEvent.input(input, {
      target: { value: '' },
      currentTarget: { value: '' },
    })
    expect(form.checkValidity()).toBe(false)
    expect(new FormData(form).get('value')).toBe('')

    form.reset()
    await Promise.resolve()

    expect(input.value).toBe('Initial')
    expect(form.checkValidity()).toBe(true)
    expect(onValueChange).toHaveBeenCalledTimes(1)
  })

  test('restores explicit controlled values after native reset without callbacks', async () => {
    const [value, setValue] = createSignal('Controlled')
    const onValueChange = vi.fn()
    const screen = render(() => (
      <form>
        <Input value={value()} defaultValue="Default" onValueChange={onValueChange} />
      </form>
    ))
    const form = screen.container.querySelector('form')!
    const input = screen.getByRole<HTMLInputElement>('textbox')

    form.reset()
    await Promise.resolve()

    expect(input.value).toBe('Controlled')
    expect(onValueChange).not.toHaveBeenCalled()

    setValue('Accepted')
    expect(input.value).toBe('Accepted')
  })

  test('keeps Field aligned when a controlled request is rejected or replaced externally', async () => {
    const [value, setValue] = createSignal('Locked')
    const { screen, value: form } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ value: v.string() }),
          initialInput: { value: 'Locked' },
        }),
      (form) => (
        <form.Form>
          <form.Field name="value" label="Value">
            <Input value={value()} />
          </form.Field>
        </form.Form>
      ),
    )
    const input = screen.getByLabelText<HTMLInputElement>('Value')

    fireEvent.input(input, {
      target: { value: 'Rejected' },
      currentTarget: { value: 'Rejected' },
    })

    expect(input.value).toBe('Locked')
    expect(getInput(form)).toEqual({ value: 'Locked' })

    setValue('External')
    expect(input.value).toBe('External')
    expect(getInput(form)).toEqual({ value: 'External' })
  })

  test('reacts to external Formisch input without publishing user callbacks', () => {
    const onValueChange = vi.fn()
    const { screen, value: form } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ value: v.string() }),
          initialInput: { value: 'Initial' },
        }),
      (form) => (
        <form.Form>
          <form.Field name="value" label="Value">
            <Input onValueChange={onValueChange} />
          </form.Field>
        </form.Form>
      ),
    )
    const input = screen.getByLabelText<HTMLInputElement>('Value')

    setInput(form, { path: ['value'], input: 'External' })

    expect(input.value).toBe('External')
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('uses the latest reactive modifier configuration', async () => {
    const [number, setNumber] = createSignal(false)
    const onValueChange = vi.fn()
    const screen = render(() => (
      <Input modelModifiers={{ number: number() }} onValueChange={onValueChange} />
    ))
    const input = screen.getByRole<HTMLInputElement>('textbox')

    fireEvent.input(input, {
      target: { value: '12' },
      currentTarget: { value: '12' },
    })
    expect(onValueChange).toHaveBeenLastCalledWith('12')

    setNumber(true)
    fireEvent.input(input, {
      target: { value: '12' },
      currentTarget: { value: '12' },
    })
    expect(onValueChange).toHaveBeenLastCalledWith(12)
  })

  test('applies classes.root override', () => {
    const screen = render(() => <Input classes={{ root: 'root-override' }} />)
    const root = screen.container.querySelector('[data-slot="input"]')

    expect(root?.className).toContain('focus:ring-ring/50')
    expect(root?.className).toContain('data-invalid:border-destructive')
    expect(root?.className).toContain('focus:data-invalid:border-destructive')
    expect(root?.className).toContain('root-override')
  })

  test('applies styles.root override', () => {
    const screen = render(() => <Input styles={{ root: { width: '200px' } }} />)
    const root = screen.container.querySelector<HTMLElement>('[data-slot="input"]')

    expect(root?.style.width).toBe('200px')
  })
})
