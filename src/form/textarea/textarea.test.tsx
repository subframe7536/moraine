import { getInput, setInput } from '@formisch/solid'
import { fireEvent, render as baseRender } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import * as v from 'valibot'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { MoraineProvider } from '../../provider'
import { renderWithOwner } from '../../test-util/owner-render'
import { createForm } from '../form'

import { Textarea } from './textarea'

const render: typeof baseRender = (ui, options) =>
  baseRender(() => <MoraineProvider>{ui()}</MoraineProvider>, options)

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('Textarea', () => {
  test('renders component defaults when provider is absent', () => {
    const screen = baseRender(() => <Textarea />)
    const root = screen.container.querySelector('[data-slot="textarea"]')
    const input = screen.container.querySelector('[data-slot="textarea"]')
    expect(root?.className).not.toBe('')
    expect(input?.className).not.toBe('')
  })

  test('forwards ref to its only native element', () => {
    let control: HTMLTextAreaElement | undefined
    const screen = render(() => <Textarea ref={(el) => (control = el)} placeholder="ref test" />)
    expect(control).toBeInstanceOf(HTMLTextAreaElement)
    expect(screen.container.firstElementChild).toBe(control)
    expect(control?.getAttribute('data-slot')).toBe('textarea')
    expect(control?.placeholder).toBe('ref test')
  })

  test('renders base attributes', () => {
    const screen = render(() => (
      <Textarea id="bio" name="bio" rows={4} placeholder="Write bio" required disabled />
    ))
    const textarea = screen.getByPlaceholderText('Write bio') as HTMLTextAreaElement
    const root = screen.container.querySelector('[data-slot="textarea"]')

    expect(textarea.getAttribute('id')).toBe('bio')
    expect(textarea.getAttribute('name')).toBe('bio')
    expect(textarea.rows).toBe(4)
    expect(textarea.required).toBe(true)
    expect(textarea.disabled).toBe(true)
    expect(textarea.getAttribute('aria-required')).toBe('true')
    expect(textarea.getAttribute('aria-disabled')).toBe('true')
    expect(root?.getAttribute('data-required')).toBe('')
    expect(root?.getAttribute('data-disabled')).toBe('')
    expect(textarea.getAttribute('data-required')).toBe('')
    expect(textarea.getAttribute('data-disabled')).toBe('')
  })

  test('exposes readonly state through aria and data attributes', () => {
    const screen = render(() => <Textarea readOnly />)
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    const root = screen.container.querySelector('[data-slot="textarea"]')

    expect(textarea.readOnly).toBe(true)
    expect(textarea.getAttribute('aria-readonly')).toBe('true')
    expect(root?.getAttribute('data-readonly')).toBe('')
    expect(textarea.getAttribute('data-readonly')).toBe('')
  })

  test.each([
    ['sm', 'text-xs', 'leading-4', 'px-1.5', 'py-1', 'rounded-sm'],
    ['md', 'text-sm', 'leading-5', 'px-2', 'py-1.5', 'rounded-md'],
    ['lg', 'text-base', 'leading-6', 'px-2.5', 'py-2', 'rounded-lg'],
  ] as const)('uses the input density scale for %s textareas', (size, ...classes) => {
    const screen = render(() => <Textarea size={size} />)
    const textarea = screen.container.querySelector('[data-slot="textarea"]') as HTMLElement

    classes.forEach((className) => expect(textarea.className).toContain(className))
  })

  test('applies trim, number, lazy and empty value strategy modifiers', async () => {
    const onTrim = vi.fn()
    const onLazy = vi.fn()
    const onPreserve = vi.fn()
    const onNullable = vi.fn()
    const onOptional = vi.fn()

    const screen = render(() => (
      <>
        <Textarea onValueChange={onTrim} modelModifiers={{ trim: true }} />
        <Textarea onValueChange={onLazy} modelModifiers={{ lazy: true }} />
        <Textarea onValueChange={onPreserve} />
        <Textarea onValueChange={onNullable} modelModifiers={{ empty: 'null' }} />
        <Textarea onValueChange={onOptional} modelModifiers={{ empty: 'undefined' }} />
      </>
    ))
    const [trimInput, lazyInput, preserveInput, nullableInput, optionalInput] =
      screen.getAllByRole('textbox')

    fireEvent.input(trimInput!, {
      target: { value: ' value  ' },
      currentTarget: { value: ' value  ' },
    })
    expect(onTrim).toHaveBeenLastCalledWith('value')

    fireEvent.input(lazyInput!, {
      target: { value: 'lazy' },
      currentTarget: { value: 'lazy' },
    })
    expect(onLazy).toHaveBeenCalledTimes(0)
    fireEvent.change(lazyInput!, {
      target: { value: 'lazy' },
      currentTarget: { value: 'lazy' },
    })
    expect(onLazy).toHaveBeenLastCalledWith('lazy')

    fireEvent.input(preserveInput!, {
      target: { value: '' },
      currentTarget: { value: '' },
    })
    expect(onPreserve).toHaveBeenLastCalledWith('')

    fireEvent.input(nullableInput!, {
      target: { value: '' },
      currentTarget: { value: '' },
    })
    expect(onNullable).toHaveBeenLastCalledWith(null)

    fireEvent.input(optionalInput!, {
      target: { value: '' },
      currentTarget: { value: '' },
    })
    expect(onOptional).toHaveBeenLastCalledWith(undefined)
  })

  test('syncs trimmed DOM value on change', async () => {
    const screen = render(() => <Textarea modelModifiers={{ trim: true, lazy: true }} />)
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement

    fireEvent.change(textarea, {
      target: { value: 'value  ' },
      currentTarget: { value: 'value  ' },
    })

    expect(textarea.value).toBe('value')
  })

  test('autoresizes rows and respects maxrows', async () => {
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
      () =>
        ({
          paddingTop: '4',
          paddingBottom: '4',
          lineHeight: '16',
        }) as CSSStyleDeclaration,
    )

    const screen = render(() => (
      <>
        <Textarea autoResize rows={2} />
        <Textarea autoResize rows={2} maxRows={3} />
      </>
    ))

    const [resizable, maxLimited] = screen.getAllByRole('textbox') as [
      HTMLTextAreaElement,
      HTMLTextAreaElement,
    ]

    Object.defineProperty(resizable, 'scrollHeight', {
      configurable: true,
      value: 120,
    })
    fireEvent.input(resizable, {
      target: { value: 'a' },
      currentTarget: { value: 'a' },
    })
    expect(resizable.rows).toBeGreaterThan(2)

    Object.defineProperty(maxLimited, 'scrollHeight', {
      configurable: true,
      value: 200,
    })
    fireEvent.input(maxLimited, {
      target: { value: 'b' },
      currentTarget: { value: 'b' },
    })
    expect(maxLimited.rows).toBe(3)
  })

  test('measures and schedules autoresize with the textarea owner window', () => {
    vi.useFakeTimers()
    const iframe = document.createElement('iframe')
    document.body.append(iframe)
    const ownerDocument = iframe.contentDocument!
    const ownerWindow = iframe.contentWindow!
    const container = ownerDocument.createElement('div')
    ownerDocument.body.append(container)
    const getComputedStyle = vi.spyOn(ownerWindow, 'getComputedStyle').mockReturnValue({
      paddingTop: '4px',
      paddingBottom: '4px',
      lineHeight: '16px',
    } as CSSStyleDeclaration)
    const globalGetComputedStyle = vi.spyOn(window, 'getComputedStyle')
    const setTimeout = vi.spyOn(ownerWindow, 'setTimeout')
    const clearTimeout = vi.spyOn(ownerWindow, 'clearTimeout')
    const [value, setValue] = createSignal('Initial')

    const screen = render(
      () => <Textarea value={value()} autoResize autoResizeDelay={25} rows={2} maxRows={4} />,
      { container, baseElement: ownerDocument.body },
    )
    const textarea = screen.getByRole<HTMLTextAreaElement>('textbox')
    Object.defineProperty(textarea, 'scrollHeight', { configurable: true, value: 72 })

    expect(textarea.ownerDocument).toBe(ownerDocument)
    expect(setTimeout).toHaveBeenCalled()
    vi.runAllTimers()
    expect(getComputedStyle).toHaveBeenCalledWith(textarea)
    expect(globalGetComputedStyle).not.toHaveBeenCalled()
    expect(textarea.rows).toBe(4)

    setValue('Pending resize')
    screen.unmount()
    expect(clearTimeout).toHaveBeenCalled()
    iframe.remove()
  })

  test('applies classes.root override', () => {
    const screen = render(() => <Textarea classes={{ root: 'root-override' }} />)
    const root = screen.container.querySelector('[data-slot="textarea"]')

    expect(root?.className).toContain('focus:ring-ring/50')
    expect(root?.className).toContain('data-invalid:border-destructive')
    expect(root?.className).toContain('root-override')
  })

  test('applies styles.root override', () => {
    const screen = render(() => <Textarea styles={{ root: { width: '200px' } }} />)
    const root = screen.container.querySelector('[data-slot="textarea"]') as HTMLElement | null

    expect(root?.style.width).toBe('200px')
  })

  test('keeps the DOM and Field aligned when a controlled edit is rejected', async () => {
    const [value, setValue] = createSignal('Locked')
    const onValueChange = vi.fn()
    const { screen, value: form } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ value: v.string() }),
          initialInput: { value: 'Locked' },
        }),
      (form) => (
        <form.Form>
          <form.Field name="value" label="Value">
            <Textarea value={value()} onValueChange={onValueChange} />
          </form.Field>
        </form.Form>
      ),
    )
    const textarea = screen.getByLabelText('Value') as HTMLTextAreaElement

    fireEvent.input(textarea, { target: { value: 'Rejected' } })

    expect(onValueChange).toHaveBeenCalledWith('Rejected')
    expect(textarea.value).toBe('Locked')
    expect(getInput(form)).toEqual({ value: 'Locked' })

    setValue('Accepted')
    expect(textarea.value).toBe('Accepted')
    expect(getInput(form)).toEqual({ value: 'Accepted' })
  })

  test('defers controlled rollback until composition completes', async () => {
    const screen = render(() => <Textarea value="Locked" />)
    const textarea = screen.getByRole<HTMLTextAreaElement>('textbox')

    fireEvent.compositionStart(textarea)
    fireEvent.input(textarea, {
      target: { value: '拼' },
      currentTarget: { value: '拼' },
    })

    expect(textarea.value).toBe('拼')

    fireEvent.compositionEnd(textarea)
    fireEvent.input(textarea, {
      target: { value: '拼音' },
      currentTarget: { value: '拼音' },
    })

    expect(textarea.value).toBe('拼音')
    await Promise.resolve()
    expect(textarea.value).toBe('Locked')
  })

  test('keeps a lazy controlled composition draft until change commits it once', async () => {
    const [value, setValue] = createSignal('')
    const onValueChange = vi.fn((nextValue: string) => setValue(nextValue))
    const screen = render(() => (
      <Textarea value={value()} modelModifiers={{ lazy: true }} onValueChange={onValueChange} />
    ))
    const textarea = screen.getByRole<HTMLTextAreaElement>('textbox')

    fireEvent.compositionStart(textarea)
    fireEvent.input(textarea, {
      target: { value: '拼音' },
      currentTarget: { value: '拼音' },
    })
    fireEvent.compositionEnd(textarea)
    await Promise.resolve()

    expect(textarea.value).toBe('拼音')
    expect(onValueChange).not.toHaveBeenCalled()

    fireEvent.change(textarea, {
      target: { value: '拼音' },
      currentTarget: { value: '拼音' },
    })

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenCalledWith('拼音')
    expect(textarea.value).toBe('拼音')
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
            <Textarea modelModifiers={{ lazy: true }} onValueChange={onValueChange} />
          </form.Field>
        </form.Form>
      ),
    )
    const textarea = screen.getByLabelText<HTMLTextAreaElement>('Value')

    fireEvent.compositionStart(textarea)
    fireEvent.input(textarea, {
      target: { value: '拼音' },
      currentTarget: { value: '拼音' },
    })
    fireEvent.compositionEnd(textarea)
    await Promise.resolve()

    expect(textarea.value).toBe('拼音')
    expect(getInput(form)).toEqual({ value: '' })
    expect(onValueChange).not.toHaveBeenCalled()

    fireEvent.change(textarea, {
      target: { value: '拼音' },
      currentTarget: { value: '拼音' },
    })

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(getInput(form)).toEqual({ value: '拼音' })
  })

  test('resizes for external Formisch values and reactive row constraints', () => {
    vi.useFakeTimers()
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
      () =>
        ({
          paddingTop: '4',
          paddingBottom: '4',
          lineHeight: '16',
        }) as CSSStyleDeclaration,
    )
    const [rows, setRows] = createSignal(2)
    const [maxRows, setMaxRows] = createSignal(3)
    const [autoResize, setAutoResize] = createSignal(true)
    const { screen, value: form } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ value: v.string() }),
          initialInput: { value: 'Initial' },
        }),
      (form) => (
        <form.Form>
          <form.Field name="value" label="Value">
            <Textarea autoResize={autoResize()} rows={rows()} maxRows={maxRows()} />
          </form.Field>
        </form.Form>
      ),
    )
    const textarea = screen.getByLabelText('Value') as HTMLTextAreaElement
    let scrollHeight = 72
    Object.defineProperty(textarea, 'scrollHeight', {
      configurable: true,
      get: () => scrollHeight,
    })

    vi.runAllTimers()
    expect(textarea.rows).toBe(3)
    expect(textarea.style.overflow).toBe('auto')

    scrollHeight = 40
    setInput(form, { path: ['value'], input: 'External' })
    vi.runAllTimers()
    expect(textarea.rows).toBe(2)
    expect(textarea.style.overflow).toBe('hidden')

    scrollHeight = 120
    setMaxRows(5)
    vi.runAllTimers()
    expect(textarea.rows).toBe(5)

    setRows(4)
    setAutoResize(false)
    vi.runAllTimers()
    expect(textarea.rows).toBe(4)
    expect(textarea.style.overflow).toBe('')
  })

  test('cancels pending autofocus and autoresize timers on unmount', () => {
    vi.useFakeTimers()
    const getComputedStyle = vi.spyOn(window, 'getComputedStyle')
    const screen = render(() => (
      <Textarea autofocus autofocusDelay={100} autoResize autoResizeDelay={100} />
    ))
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    const focus = vi.spyOn(textarea, 'focus')

    screen.unmount()
    getComputedStyle.mockClear()
    vi.runAllTimers()

    expect(focus).not.toHaveBeenCalled()
    expect(getComputedStyle).not.toHaveBeenCalled()
  })
})
