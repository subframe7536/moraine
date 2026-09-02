import { getInput, setInput } from '@formisch/solid'
import { fireEvent, render } from '@solidjs/testing-library'
import { createComponent, createSignal } from 'solid-js'
import * as v from 'valibot'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { renderWithOwner } from '../../test-utils/owner-render'
import { createForm } from '../form/index'

import { Textarea } from './textarea'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('Textarea', () => {
  test('renders base attributes', () => {
    const screen = render(() => (
      <Textarea id="bio" name="bio" rows={4} placeholder="Write bio" required disabled />
    ))
    const textarea = screen.getByPlaceholderText('Write bio') as HTMLTextAreaElement
    const root = screen.container.querySelector('[data-slot="root"]')

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
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(textarea.readOnly).toBe(true)
    expect(textarea.getAttribute('aria-readonly')).toBe('true')
    expect(root?.getAttribute('data-readonly')).toBe('')
    expect(textarea.getAttribute('data-readonly')).toBe('')
  })

  test.each([
    ['sm', 'text-xs', 'leading-4', 'px-2', 'py-1'],
    ['md', 'text-sm', 'leading-5', 'px-2.5', 'py-1.5'],
    ['lg', 'text-base', 'leading-6', 'px-3', 'py-2'],
  ] as const)('uses the input density scale for %s textareas', (size, ...classes) => {
    const screen = render(() => <Textarea size={size} />)
    const textarea = screen.container.querySelector('[data-slot="input"]') as HTMLElement

    classes.forEach((className) => expect(textarea.className).toContain(className))
  })

  test('keeps header and footer slots absent by default', () => {
    const screen = render(() => <Textarea />)

    expect(screen.container.querySelector('[data-slot="header"]')).toBeNull()
    expect(screen.container.querySelector('[data-slot="footer"]')).toBeNull()
  })

  test('renders header and footer slots in expected order', () => {
    const screen = render(() => (
      <Textarea
        header={<span data-testid="header-content">Header</span>}
        footer={<span data-testid="footer-content">Footer</span>}
      >
        <span data-testid="child-content">Child</span>
      </Textarea>
    ))

    const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement | null
    const header = screen.container.querySelector('[data-slot="header"]') as HTMLElement | null
    const base = screen.container.querySelector('textarea[data-slot="input"]') as HTMLElement | null
    const child = screen.getByTestId('child-content')
    const footer = screen.container.querySelector('[data-slot="footer"]') as HTMLElement | null

    expect(root?.children[0]).toBe(header)
    expect(root?.children[1]).toBe(base)
    expect(root?.children[2]).toBe(child)
    expect(root?.children[3]).toBe(footer)
    expect(screen.getByTestId('header-content').textContent).toBe('Header')
    expect(screen.getByTestId('footer-content').textContent).toBe('Footer')
  })

  test('focuses textarea when clicking non-interactive header or footer area', async () => {
    const screen = render(() => (
      <Textarea header={<span>Header content</span>} footer={<span>Footer content</span>} />
    ))

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    const focusSpy = vi.spyOn(textarea, 'focus')

    fireEvent.pointerDown(screen.getByText('Header content'), { button: 0 })
    fireEvent.pointerDown(screen.getByText('Footer content'), { button: 0 })

    expect(focusSpy).toHaveBeenCalledTimes(2)
  })

  test('does not steal focus from interactive header and footer controls', async () => {
    const screen = render(() => (
      <Textarea
        header={
          <button type="button" data-testid="header-button">
            Header Action
          </button>
        }
        footer={
          <button type="button" data-testid="footer-button">
            Footer Action
          </button>
        }
      />
    ))

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    const focusSpy = vi.spyOn(textarea, 'focus')

    fireEvent.pointerDown(screen.getByTestId('header-button'), { button: 0 })
    fireEvent.pointerDown(screen.getByTestId('footer-button'), { button: 0 })

    expect(focusSpy).toHaveBeenCalledTimes(0)
  })

  test('shows root focus state only while the textarea is focused', () => {
    const screen = render(() => (
      <Textarea
        header={<button type="button">Header Action</button>}
        footer={<button type="button">Footer Action</button>}
      >
        <button type="button">Child Action</button>
      </Textarea>
    ))

    const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
    const controls = screen.getAllByRole('button') as HTMLButtonElement[]

    expect(root.getAttribute('data-focused')).toBeNull()

    for (const control of controls) {
      textarea.focus()
      expect(root.getAttribute('data-focused')).toBe('')

      control.focus()
      expect(root.getAttribute('data-focused')).toBeNull()
    }
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

  test('applies classes.root override', () => {
    const screen = render(() => <Textarea classes={{ root: 'root-override' }} />)
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.className).toContain('data-focused:effect-fv-border')
    expect(root?.className).not.toContain('focus-within:effect-fv-border')
    expect(root?.className).toContain('effect-invalid')
    expect(root?.className).toContain('root-override')
  })

  test('applies styles.root override', () => {
    const screen = render(() => <Textarea styles={{ root: { width: '200px' } }} />)
    const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement | null

    expect(root?.style.width).toBe('200px')
  })

  test('applies classes.header and classes.footer overrides', () => {
    const screen = render(() => (
      <Textarea
        header={<span>Header</span>}
        footer={<span>Footer</span>}
        classes={{ header: 'header-override', footer: 'footer-override' }}
      />
    ))
    const header = screen.container.querySelector('[data-slot="header"]')
    const footer = screen.container.querySelector('[data-slot="footer"]')

    expect(header?.className).toContain('header-override')
    expect(footer?.className).toContain('footer-override')
  })

  test('applies styles.header and styles.footer overrides', () => {
    const screen = render(() => (
      <Textarea
        header={<span>Header</span>}
        footer={<span>Footer</span>}
        styles={{ header: { width: '200px' }, footer: { width: '200px' } }}
      />
    ))
    const header = screen.container.querySelector('[data-slot="header"]') as HTMLElement | null
    const footer = screen.container.querySelector('[data-slot="footer"]') as HTMLElement | null

    expect(header?.style.width).toBe('200px')
    expect(footer?.style.width).toBe('200px')
  })

  test('keeps the DOM and FormField aligned when a controlled edit is rejected', async () => {
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

  test('single-evaluates conditional slots, children, and modifier config', () => {
    const reads = { children: 0, footer: 0, header: 0, modelModifiers: 0 }
    const screen = render(() =>
      createComponent(Textarea, {
        get children() {
          reads.children += 1
          return <span>Child</span>
        },
        get footer() {
          reads.footer += 1
          return 0
        },
        get header() {
          reads.header += 1
          return 0
        },
        get modelModifiers() {
          reads.modelModifiers += 1
          return { trim: true }
        },
      }),
    )

    expect(screen.getAllByText('0')).toHaveLength(2)
    expect(screen.getByText('Child')).not.toBeNull()
    expect(reads).toEqual({ children: 1, footer: 1, header: 1, modelModifiers: 1 })
  })
})
