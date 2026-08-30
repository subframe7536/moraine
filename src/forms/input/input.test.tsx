import { getInput, setInput } from '@formisch/solid'
import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createComponent, createSignal } from 'solid-js'
import { hydrate } from 'solid-js/web'
import * as v from 'valibot'
import { describe, expect, test, vi } from 'vitest'

import { renderWithOwner } from '../../test-utils/owner-render.tsx'
import { installHydrationState, renderSsrFixture } from '../../test-utils/ssr-test.ts'
import { FormField } from '../form-field/index.ts'
import { createForm, Form } from '../form/index.ts'

import { Input } from './input.tsx'
import type { InputProps } from './input.tsx'

describe('Input', () => {
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
    const root = screen.container.querySelector('[data-slot="root"]')

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
    const root = screen.container.querySelector('[data-slot="root"]')

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
    const roots = screen.container.querySelectorAll('[data-slot="root"]')
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

  test('lets icons inherit the input font size', () => {
    const screen = render(() => (
      <>
        <Input size="sm" leading="icon-search" />
        <Input size="md" leading="icon-search" />
        <Input size="lg" leading="icon-search" />
      </>
    ))

    const icons = Array.from(
      screen.container.querySelectorAll('[data-slot="leading"] [data-slot="icon"]'),
    )

    icons.forEach((icon) => {
      expect(icon.className).not.toMatch(/(?:^|\s)size-/)
      expect(icon.getAttribute('style')).toBeNull()
    })
  })

  test('renders leading and trailing slots through Icon', () => {
    const screen = render(() => (
      <>
        <Input leading="i-lucide-search" trailing="i-lucide-at-sign" />
        <Input
          leading={<span data-testid="leading-node">L</span>}
          trailing={<span data-testid="trailing-node">T</span>}
        />
      </>
    ))

    const leadingIcon = screen.container.querySelector('[data-slot="leading"] [data-slot="icon"]')
    const trailingIcon = screen.container.querySelector('[data-slot="trailing"] [data-slot="icon"]')

    expect(leadingIcon?.className).toContain('i-lucide-search')
    expect(trailingIcon?.className).toContain('i-lucide-at-sign')
    expect(leadingIcon?.getAttribute('aria-hidden')).toBe('true')
    expect(trailingIcon?.getAttribute('aria-hidden')).toBe('true')
    expect(screen.getByTestId('leading-node').textContent).toBe('L')
    expect(screen.getByTestId('trailing-node').textContent).toBe('T')
    expect(screen.container.querySelector('[data-slot="leadingIcon"]')).toBeNull()
    expect(screen.container.querySelector('[data-slot="trailingIcon"]')).toBeNull()
  })

  test('keeps interactive custom adornments accessible and clickable', () => {
    const onClick = vi.fn()
    const screen = render(() => (
      <Input
        leading={<button type="button" aria-label="Choose prefix" onClick={onClick} />}
        trailing={<button type="button" aria-label="Toggle value" onClick={onClick} />}
      />
    ))

    const button = screen.getByRole('button', { name: 'Toggle value' })

    expect(button.getAttribute('aria-hidden')).toBeNull()
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  test('applies loading icon override rules for leading and trailing slots', () => {
    const screen = render(() => (
      <>
        <Input loading />
        <Input loading trailing="i-lucide-at-sign" />
        <Input loading leading="i-lucide-user" trailing="i-lucide-mail" />
      </>
    ))

    const roots = screen.container.querySelectorAll('[data-slot="root"]')

    const firstLeading = roots[0]?.querySelector(
      '[data-slot="leading"] [data-slot="icon"]',
    ) as HTMLElement | null
    const secondTrailing = roots[1]?.querySelector(
      '[data-slot="trailing"] [data-slot="icon"]',
    ) as HTMLElement | null
    const thirdLeading = roots[2]?.querySelector(
      '[data-slot="leading"] [data-slot="icon"]',
    ) as HTMLElement | null
    const thirdTrailing = roots[2]?.querySelector(
      '[data-slot="trailing"] [data-slot="icon"]',
    ) as HTMLElement | null

    expect(firstLeading?.className).toContain('icon-loading')
    expect(firstLeading?.className).toContain('effect-loading')
    expect(roots[0]?.querySelector('[data-slot="trailing"]')).toBeNull()

    expect(secondTrailing?.className).toContain('icon-loading')
    expect(secondTrailing?.className).toContain('effect-loading')
    expect(secondTrailing?.className).not.toContain('i-lucide-at-sign')
    expect(roots[1]?.querySelector('[data-slot="leading"]')).toBeNull()

    expect(thirdLeading?.className).toContain('icon-loading')
    expect(thirdLeading?.className).toContain('effect-loading')
    expect(thirdLeading?.className).not.toContain('i-lucide-user')
    expect(thirdTrailing?.className).toContain('i-lucide-mail')
    expect(thirdTrailing?.className).not.toContain('effect-loading')

    expect(screen.container.querySelector('[data-slot="leadingIcon"]')).toBeNull()
    expect(screen.container.querySelector('[data-slot="trailingIcon"]')).toBeNull()
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
        onChange={(value) => calls.push(`change:${value}`)}
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

    expect(calls).toEqual(['input', 'value:拼', 'change:拼音'])
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
    expect(cancelledChange).not.toHaveBeenCalled()
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

  test('focuses from wrapper text without stealing nested interactive pointers', async () => {
    const screen = render(() => (
      <Input>
        <span data-testid="plain-text">Text</span>
        <button type="button" data-testid="nested-button">
          Button
        </button>
        <a href="#target" data-testid="nested-link">
          Link
        </a>
        <input data-testid="nested-input" />
      </Input>
    ))
    const root = screen.container.querySelector('[data-slot="root"]')!
    const input = screen.container.querySelector('[data-slot="input"]') as HTMLInputElement
    const focus = vi.spyOn(input, 'focus')

    fireEvent.pointerDown(root, { button: 0 })
    fireEvent.pointerDown(screen.getByTestId('plain-text'), { button: 0 })
    expect(focus).toHaveBeenCalledTimes(2)

    fireEvent.pointerDown(input, { button: 0 })

    for (const testId of ['nested-button', 'nested-link', 'nested-input']) {
      fireEvent.pointerDown(screen.getByTestId(testId), { button: 0 })
    }
    fireEvent.pointerDown(root, { button: 1 })

    expect(focus).toHaveBeenCalledTimes(2)
  })

  test('respects cancelled wrapper pointer handlers', async () => {
    const screen = render(() => (
      <Input onPointerDown={(event: PointerEvent) => event.preventDefault()} />
    ))
    const root = screen.container.querySelector('[data-slot="root"]')!
    const input = screen.getByRole<HTMLInputElement>('textbox')
    const focus = vi.spyOn(input, 'focus')

    fireEvent.pointerDown(root, { button: 0 })

    expect(focus).not.toHaveBeenCalled()
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

  test('keeps FormField aligned when a controlled request is rejected or replaced externally', async () => {
    const [value, setValue] = createSignal('Locked')
    const { screen, value: form } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ value: v.string() }),
          initialInput: { value: 'Locked' },
        }),
      (form) => (
        <Form of={form}>
          <FormField name="value" label="Value">
            <Input value={value()} />
          </FormField>
        </Form>
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
        <Form of={form}>
          <FormField name="value" label="Value">
            <Input onValueChange={onValueChange} />
          </FormField>
        </Form>
      ),
    )
    const input = screen.getByLabelText<HTMLInputElement>('Value')

    setInput(form, { path: ['value'], input: 'External' })

    expect(input.value).toBe('External')
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('single-evaluates conditional slots, children, and modifier config', () => {
    const reads = { children: 0, leading: 0, loadingIcon: 0, modelModifiers: 0, trailing: 0 }
    const screen = render(() =>
      createComponent(Input, {
        loading: true,
        get leading() {
          reads.leading += 1
          return 'i-lucide-search'
        },
        get trailing() {
          reads.trailing += 1
          return 'i-lucide-at-sign'
        },
        get loadingIcon() {
          reads.loadingIcon += 1
          return 'icon-loading'
        },
        get modelModifiers() {
          reads.modelModifiers += 1
          return { trim: true }
        },
        get children() {
          reads.children += 1
          return <button type="button">Action</button>
        },
      }),
    )

    expect(screen.getByRole('button', { name: 'Action' })).not.toBeNull()
    expect(reads).toEqual({
      children: 1,
      leading: 1,
      loadingIcon: 1,
      modelModifiers: 1,
      trailing: 1,
    })
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
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.className).toContain('focus-within:effect-fv-border')
    expect(root?.className).toContain('effect-invalid')
    expect(root?.className).toContain('focus-within:data-invalid:effect-invalid')
    expect(root?.className).toContain('root-override')
  })

  test('applies styles.root override', () => {
    const screen = render(() => <Input styles={{ root: { width: '200px' } }} />)
    const root = screen.container.querySelector<HTMLElement>('[data-slot="root"]')

    expect(root?.style.width).toBe('200px')
  })

  test('rejects removed icon class slot in type contract', () => {
    // @ts-expect-error leadingIcon slot class has been removed from Input props
    const props: InputProps = { classes: { leadingIcon: 'x' } }
    expect(props).toBeDefined()
  })

  test('hydrates controlled value and slot order without replacing server nodes', async () => {
    const markup = renderSsrFixture('/src/forms/input/input.ssr.fixture.tsx', 'renderInputFixture')
    const container = document.createElement('div')
    container.innerHTML = markup
    document.body.append(container)
    const serverRoot = container.querySelector('[data-slot="root"]')
    const serverInput = container.querySelector('[data-slot="input"]') as HTMLInputElement
    const serverAction = container.querySelector('[data-testid="nested-action"]')
    const [value, setValue] = createSignal('Server value')
    const onValueChange = vi.fn()
    const reads = { children: 0, leading: 0, loadingIcon: 0, modelModifiers: 0, trailing: 0 }
    const restoreHydrationState = installHydrationState()

    const dispose = hydrate(
      () =>
        createComponent(Input, {
          get value() {
            return value()
          },
          get leading() {
            reads.leading += 1
            return 'i-lucide-search'
          },
          get trailing() {
            reads.trailing += 1
            return 'i-lucide-at-sign'
          },
          get loadingIcon() {
            reads.loadingIcon += 1
            return 'icon-loading'
          },
          get modelModifiers() {
            reads.modelModifiers += 1
            return { trim: true }
          },
          get children() {
            reads.children += 1
            return (
              <button type="button" data-testid="nested-action">
                Action
              </button>
            )
          },
          onValueChange,
        }),
      container,
    )
    const root = container.querySelector('[data-slot="root"]')!
    const input = container.querySelector('[data-slot="input"]') as HTMLInputElement

    expect(root).toBe(serverRoot)
    expect(input).toBe(serverInput)
    expect(container.querySelector('[data-testid="nested-action"]')).toBe(serverAction)
    expect(input.value).toBe('Server value')
    expect(Array.from(root.children).map((element) => element.getAttribute('data-slot'))).toEqual([
      'leading',
      'input',
      null,
      'trailing',
    ])
    expect(reads).toEqual({
      children: 1,
      leading: 1,
      loadingIcon: 1,
      modelModifiers: 1,
      trailing: 1,
    })

    setValue('Client value')
    await waitFor(() => expect(input.value).toBe('Client value'))

    fireEvent.input(input, {
      target: { value: 'Rejected value' },
      currentTarget: { value: 'Rejected value' },
    })
    expect(onValueChange).toHaveBeenCalledWith('Rejected value')
    expect(input.value).toBe('Client value')

    dispose()
    container.remove()
    restoreHydrationState()
  }, 20_000)
})
