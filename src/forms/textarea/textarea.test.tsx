import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { Form } from '../form'
import { FormField } from '../form-field'

import { Textarea } from './textarea'
import type { TextareaProps } from './textarea'

function createForm(
  validateOn?: Array<'blur' | 'change' | 'input'>,
  eagerValidation?: boolean,
  initialValue = '',
) {
  const state = { value: initialValue }

  const screen = render(() => (
    <Form
      state={state}
      validateOn={validateOn}
      validateOnInputDelay={0}
      validate={(currentState) => {
        if ((currentState?.value as string | undefined) === 'valid') {
          return []
        }

        return [{ name: 'value', message: 'Error message' }]
      }}
    >
      <FormField
        name="value"
        eagerValidation={eagerValidation}
        hint="Hint"
        description="Description"
        help="Help"
      >
        <Textarea
          id="textarea"
          value={state.value}
          onValueChange={(nextValue) => {
            state.value = String(nextValue ?? '')
          }}
        />
      </FormField>
    </Form>
  ))

  return {
    screen,
    input: () => screen.getByRole('textbox') as HTMLTextAreaElement,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Textarea', () => {
  test('renders base attributes', () => {
    const screen = render(() => (
      <Textarea id="bio" name="bio" rows={4} placeholder="Write bio" required disabled />
    ))
    const textarea = screen.getByPlaceholderText('Write bio') as HTMLTextAreaElement

    expect(textarea.getAttribute('id')).toBe('bio')
    expect(textarea.getAttribute('name')).toBe('bio')
    expect(textarea.rows).toBe(4)
    expect(textarea.required).toBe(true)
    expect(textarea.disabled).toBe(true)
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
    const base = screen.container.querySelector('textarea[data-slot="base"]') as HTMLElement | null
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

    await fireEvent.pointerDown(screen.getByText('Header content'), { button: 0 })
    await fireEvent.pointerDown(screen.getByText('Footer content'), { button: 0 })

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

    await fireEvent.pointerDown(screen.getByTestId('header-button'), { button: 0 })
    await fireEvent.pointerDown(screen.getByTestId('footer-button'), { button: 0 })

    expect(focusSpy).toHaveBeenCalledTimes(0)
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

    await fireEvent.input(trimInput!, {
      target: { value: ' value  ' },
      currentTarget: { value: ' value  ' },
    })
    expect(onTrim).toHaveBeenLastCalledWith('value')

    await fireEvent.input(lazyInput!, {
      target: { value: 'lazy' },
      currentTarget: { value: 'lazy' },
    })
    expect(onLazy).toHaveBeenCalledTimes(0)
    await fireEvent.change(lazyInput!, {
      target: { value: 'lazy' },
      currentTarget: { value: 'lazy' },
    })
    expect(onLazy).toHaveBeenLastCalledWith('lazy')

    await fireEvent.input(preserveInput!, {
      target: { value: '' },
      currentTarget: { value: '' },
    })
    expect(onPreserve).toHaveBeenLastCalledWith('')

    await fireEvent.input(nullableInput!, {
      target: { value: '' },
      currentTarget: { value: '' },
    })
    expect(onNullable).toHaveBeenLastCalledWith(null)

    await fireEvent.input(optionalInput!, {
      target: { value: '' },
      currentTarget: { value: '' },
    })
    expect(onOptional).toHaveBeenLastCalledWith(undefined)
  })

  test('syncs trimmed DOM value on change', async () => {
    const screen = render(() => <Textarea modelModifiers={{ trim: true, lazy: true }} />)
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement

    await fireEvent.change(textarea, {
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
        <Textarea autoresize rows={2} />
        <Textarea autoresize rows={2} maxrows={3} />
      </>
    ))

    const [resizable, maxLimited] = screen.getAllByRole('textbox') as HTMLTextAreaElement[]

    Object.defineProperty(resizable, 'scrollHeight', {
      configurable: true,
      value: 120,
    })
    await fireEvent.input(resizable, {
      target: { value: 'a' },
      currentTarget: { value: 'a' },
    })
    expect(resizable.rows).toBeGreaterThan(2)

    Object.defineProperty(maxLimited, 'scrollHeight', {
      configurable: true,
      value: 200,
    })
    await fireEvent.input(maxLimited, {
      target: { value: 'b' },
      currentTarget: { value: 'b' },
    })
    expect(maxLimited.rows).toBe(3)
  })

  test('integrates with form validation aria attrs and validate on blur', async () => {
    const { screen, input } = createForm(['blur'])

    await fireEvent.submit(screen.container.querySelector('form') as HTMLFormElement)
    await waitFor(() => {
      expect(screen.getByText('Error message')).not.toBeNull()
    })

    const textarea = input()
    const root = textarea.closest('[data-slot="root"]')
    expect(textarea.getAttribute('aria-invalid')).toBe('true')
    expect(root?.hasAttribute('data-invalid')).toBe(true)

    const describedBy = textarea.getAttribute('aria-describedby') ?? ''
    expect(describedBy).toContain('-error')
    expect(describedBy).toContain('-hint')
    expect(describedBy).toContain('-description')
    expect(describedBy).toContain('-help')

    await fireEvent.input(textarea, {
      target: { value: 'valid' },
      currentTarget: { value: 'valid' },
    })
    await fireEvent.blur(textarea)
    await waitFor(() => {
      expect(screen.queryByText('Error message')).toBeNull()
    })
  })

  test('validates on change', async () => {
    const { screen, input } = createForm(['change'])
    const textarea = input()

    await fireEvent.change(textarea, {
      target: { value: 'bad' },
      currentTarget: { value: 'bad' },
    })
    await waitFor(() => {
      expect(screen.getByText('Error message')).not.toBeNull()
    })

    await fireEvent.input(textarea, {
      target: { value: 'valid' },
      currentTarget: { value: 'valid' },
    })
    await fireEvent.change(textarea, {
      target: { value: 'valid' },
      currentTarget: { value: 'valid' },
    })

    await waitFor(() => {
      expect(screen.queryByText('Error message')).toBeNull()
    })
  })

  test('validates on input and respects eagerValidation=false', async () => {
    const eagerForm = createForm(['input'], true)
    const eagerTextarea = eagerForm.input()

    await fireEvent.input(eagerTextarea, {
      target: { value: 'bad' },
      currentTarget: { value: 'bad' },
    })
    await waitFor(() => {
      expect(eagerForm.screen.getByText('Error message')).not.toBeNull()
    })

    await fireEvent.input(eagerTextarea, {
      target: { value: 'valid' },
      currentTarget: { value: 'valid' },
    })
    await waitFor(() => {
      expect(eagerForm.screen.queryByText('Error message')).toBeNull()
    })

    const nonEagerForm = createForm(['input'])
    const nonEagerTextarea = nonEagerForm.input()

    await fireEvent.input(nonEagerTextarea, {
      target: { value: 'bad' },
      currentTarget: { value: 'bad' },
    })
    await waitFor(() => {
      expect(nonEagerForm.screen.queryByText('Error message')).toBeNull()
    })

    await fireEvent.blur(nonEagerTextarea)
    await fireEvent.input(nonEagerTextarea, {
      target: { value: 'bad' },
      currentTarget: { value: 'bad' },
    })
    await waitFor(() => {
      expect(nonEagerForm.screen.getByText('Error message')).not.toBeNull()
    })
  })

  test('applies classes.root override', () => {
    const screen = render(() => <Textarea classes={{ root: 'root-override' }} />)
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.className).toContain('focus-within:effect-fv-border')
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

  test('rejects as in type contract', () => {
    // @ts-expect-error as has been removed from Textarea props
    const props: TextareaProps = { as: 'section' }
    expect(props).toBeDefined()
  })
})
