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

  test('does not render leading or trailing slots', () => {
    const screen = render(() => <Textarea />)

    expect(screen.container.querySelector('[data-slot="leading"]')).toBeNull()
    expect(screen.container.querySelector('[data-slot="trailing"]')).toBeNull()
    expect(screen.container.querySelector('[data-slot="leadingIcon"]')).toBeNull()
    expect(screen.container.querySelector('[data-slot="trailingIcon"]')).toBeNull()
  })

  test('swallows legacy icon-related props without forwarding invalid attrs', () => {
    const legacyProps = {
      icon: 'i-lucide-search',
      leading: true,
      leadingIcon: 'i-lucide-user',
      trailing: true,
      trailingIcon: 'i-lucide-mail',
      loading: true,
      loadingIcon: 'icon-loading',
    } as unknown as TextareaProps

    const screen = render(() => <Textarea {...legacyProps} />)
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement

    expect(textarea.hasAttribute('icon')).toBe(false)
    expect(textarea.hasAttribute('leading')).toBe(false)
    expect(textarea.hasAttribute('leadingicon')).toBe(false)
    expect(textarea.hasAttribute('trailing')).toBe(false)
    expect(textarea.hasAttribute('trailingicon')).toBe(false)
    expect(textarea.hasAttribute('loading')).toBe(false)
    expect(textarea.hasAttribute('loadingicon')).toBe(false)
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

  test('applies classes.root override', () => {
    const screen = render(() => <Textarea classes={{ root: 'root-override' }} />)
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.className).toContain('root-override')
  })
})
