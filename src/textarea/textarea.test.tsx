import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { Form } from '../form'
import { FormField } from '../form-field'

import { Textarea } from './textarea'

function createForm(
  validateOn?: Array<'blur' | 'change' | 'input'>,
  eagerValidation?: boolean,
  initialValue = '',
) {
  const state = { value: initialValue }

  const screen = render(() => (
    <Form
      data-testid="form"
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

  test('renders icon in leading and trailing positions', () => {
    const screen = render(() => (
      <>
        <Textarea icon="i-lucide-search" />
        <Textarea trailing icon="i-lucide-at-sign" />
        <Textarea leadingIcon="i-lucide-user" trailingIcon="i-lucide-mail" />
      </>
    ))

    const leadingIcons = screen.container.querySelectorAll('[data-slot="leadingIcon"]')
    const trailingIcons = screen.container.querySelectorAll('[data-slot="trailingIcon"]')

    expect(leadingIcons[0]?.className).toContain('i-lucide-search')
    expect(trailingIcons[0]?.className).toContain('i-lucide-at-sign')
    expect(leadingIcons[1]?.className).toContain('i-lucide-user')
    expect(trailingIcons[1]?.className).toContain('i-lucide-mail')
  })

  test('renders loading icon and avatar fallback', () => {
    const screen = render(() => (
      <>
        <Textarea loading />
        <Textarea avatar={<span data-testid="avatar">A</span>} />
      </>
    ))

    const loadingIcon = screen.container.querySelector('[data-slot="leadingIcon"]')
    expect(loadingIcon?.className).toContain('icon-loading')
    expect(loadingIcon?.className).toContain('animate-spin')
    expect(screen.getByTestId('avatar').textContent).toBe('A')
  })

  test('applies trim, number, lazy, nullable and optional modifiers', async () => {
    const onTrim = vi.fn()
    const onNumber = vi.fn()
    const onLazy = vi.fn()
    const onNullable = vi.fn()
    const onOptional = vi.fn()

    const screen = render(() => (
      <>
        <Textarea onValueChange={onTrim} modelModifiers={{ trim: true }} />
        <Textarea onValueChange={onNumber} modelModifiers={{ number: true }} />
        <Textarea onValueChange={onLazy} modelModifiers={{ lazy: true }} />
        <Textarea onValueChange={onNullable} modelModifiers={{ nullable: true }} />
        <Textarea onValueChange={onOptional} modelModifiers={{ optional: true }} />
      </>
    ))
    const [trimInput, numberInput, lazyInput, nullableInput, optionalInput] =
      screen.getAllByRole('textbox')

    await fireEvent.input(trimInput!, {
      target: { value: ' value  ' },
      currentTarget: { value: ' value  ' },
    })
    expect(onTrim).toHaveBeenLastCalledWith('value')

    await fireEvent.input(numberInput!, {
      target: { value: '42.5' },
      currentTarget: { value: '42.5' },
    })
    expect(onNumber).toHaveBeenLastCalledWith(42.5)

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

    await fireEvent.submit(screen.getByTestId('form'))
    await waitFor(() => {
      expect(screen.getByText('Error message')).not.toBeNull()
    })

    const textarea = input()
    expect(textarea.getAttribute('aria-invalid')).toBe('true')

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
})
