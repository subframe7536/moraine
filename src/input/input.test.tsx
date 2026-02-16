import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { Form } from '../form'
import { FormField } from '../form-field'

import { Input } from './input'

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
        <Input
          id="input"
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
    input: () => screen.getByRole('textbox') as HTMLInputElement,
  }
}

describe('Input', () => {
  test('renders base attributes', () => {
    const screen = render(() => (
      <Input
        id="email-input"
        name="email"
        type="email"
        placeholder="Enter email"
        required
        disabled
      />
    ))
    const input = screen.getByPlaceholderText('Enter email') as HTMLInputElement

    expect(input.getAttribute('id')).toBe('email-input')
    expect(input.getAttribute('name')).toBe('email')
    expect(input.getAttribute('type')).toBe('email')
    expect(input.disabled).toBe(true)
    expect(input.required).toBe(true)
  })

  test('uses default base padding when leading and trailing are absent', () => {
    const screen = render(() => <Input />)
    const input = screen.getByRole('textbox')

    expect(input.className).toContain('ps-3.5')
    expect(input.className).toContain('pe-3.5')
  })

  test('uses slot start padding when leading icon is present', () => {
    const screen = render(() => <Input icon="i-lucide-search" />)
    const input = screen.getByRole('textbox')

    expect(input.className).toContain('ps-2')
    expect(input.className).toContain('pe-3.5')
  })

  test('uses slot end padding when trailing icon is present', () => {
    const screen = render(() => <Input trailing icon="i-lucide-search" />)
    const input = screen.getByRole('textbox')

    expect(input.className).toContain('ps-3.5')
    expect(input.className).toContain('pe-2')
  })

  test('uses slot padding for custom inline leading and trailing content', () => {
    const screen = render(() => (
      <Input leading={<span>https://</span>} trailing={<span>.com</span>} />
    ))
    const input = screen.getByRole('textbox')

    expect(input.className).toContain('ps-2')
    expect(input.className).toContain('pe-2')
  })

  test('renders icon in leading and trailing positions', () => {
    const screen = render(() => (
      <>
        <Input icon="i-lucide-search" />
        <Input trailing icon="i-lucide-at-sign" />
        <Input leadingIcon="i-lucide-user" trailingIcon="i-lucide-mail" />
      </>
    ))

    const leadingIcons = screen.container.querySelectorAll('[data-slot="leadingIcon"]')
    const trailingIcons = screen.container.querySelectorAll('[data-slot="trailingIcon"]')

    expect(leadingIcons[0]?.className).toContain('i-lucide-search')
    expect(trailingIcons[0]?.className).toContain('i-lucide-at-sign')
    expect(leadingIcons[1]?.className).toContain('i-lucide-user')
    expect(trailingIcons[1]?.className).toContain('i-lucide-mail')
  })

  test('renders loading icon on leading and trailing paths', () => {
    const screen = render(() => (
      <>
        <Input loading />
        <Input loading trailing />
      </>
    ))

    const leadingIcon = screen.container.querySelector('[data-slot="leadingIcon"]')
    const trailingIcons = screen.container.querySelectorAll('[data-slot="trailingIcon"]')

    expect(leadingIcon?.className).toContain('icon-loading')
    expect(leadingIcon?.className).toContain('animate-spin')
    expect(trailingIcons[0]?.className).toContain('icon-loading')
    expect(trailingIcons[0]?.className).toContain('animate-spin')
  })

  test('applies trim modifier', async () => {
    const onValueChange = vi.fn()
    const screen = render(() => (
      <Input onValueChange={onValueChange} modelModifiers={{ trim: true }} />
    ))
    const input = screen.getByRole('textbox')

    await fireEvent.input(input, {
      target: { value: ' test  ' },
      currentTarget: { value: ' test  ' },
    })

    expect(onValueChange).toHaveBeenLastCalledWith('test')
  })

  test('applies number modifier and type=number coercion', async () => {
    const onValueChange = vi.fn()
    const screen = render(() => (
      <>
        <Input onValueChange={onValueChange} modelModifiers={{ number: true }} />
        <Input type="number" onValueChange={onValueChange} />
      </>
    ))

    const textInput = screen.getAllByRole('textbox')[0]
    const numberInput = screen.getByRole('spinbutton')

    await fireEvent.input(textInput!, {
      target: { value: '42.5' },
      currentTarget: { value: '42.5' },
    })
    await fireEvent.input(numberInput, {
      target: { value: '6.2' },
      currentTarget: { value: '6.2' },
    })

    expect(onValueChange).toHaveBeenNthCalledWith(1, 42.5)
    expect(onValueChange).toHaveBeenNthCalledWith(2, 6.2)
  })

  test('supports lazy, nullable and optional modifiers', async () => {
    const lazyChange = vi.fn()
    const nullableChange = vi.fn()
    const optionalChange = vi.fn()

    const screen = render(() => (
      <>
        <Input onValueChange={lazyChange} modelModifiers={{ lazy: true }} />
        <Input onValueChange={nullableChange} modelModifiers={{ nullable: true }} />
        <Input onValueChange={optionalChange} modelModifiers={{ optional: true }} />
      </>
    ))
    const [lazyInput, nullableInput, optionalInput] = screen.getAllByRole('textbox')

    await fireEvent.input(lazyInput!, {
      target: { value: 'lazy' },
      currentTarget: { value: 'lazy' },
    })
    expect(lazyChange).toHaveBeenCalledTimes(0)
    await fireEvent.change(lazyInput!, {
      target: { value: 'lazy' },
      currentTarget: { value: 'lazy' },
    })
    expect(lazyChange).toHaveBeenLastCalledWith('lazy')

    await fireEvent.input(nullableInput!, {
      target: { value: '' },
      currentTarget: { value: '' },
    })
    expect(nullableChange).toHaveBeenLastCalledWith(null)

    await fireEvent.input(optionalInput!, {
      target: { value: '' },
      currentTarget: { value: '' },
    })
    expect(optionalChange).toHaveBeenLastCalledWith(undefined)
  })

  test('syncs trimmed DOM value on change', async () => {
    const screen = render(() => <Input modelModifiers={{ trim: true, lazy: true }} />)
    const input = screen.getByRole('textbox') as HTMLInputElement

    await fireEvent.change(input, {
      target: { value: 'value  ' },
      currentTarget: { value: 'value  ' },
    })

    expect(input.value).toBe('value')
  })

  test('forwards onChange and onBlur handlers', async () => {
    const onChange = vi.fn()
    const onBlur = vi.fn()
    const screen = render(() => <Input onChange={onChange} onBlur={onBlur} />)
    const input = screen.getByRole('textbox')

    await fireEvent.change(input)
    await fireEvent.blur(input)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onBlur).toHaveBeenCalledTimes(1)
  })

  test('integrates with form validation aria attrs and validate on blur', async () => {
    const { screen, input } = createForm(['blur'])

    await fireEvent.submit(screen.getByTestId('form'))
    await waitFor(() => {
      expect(screen.getByText('Error message')).not.toBeNull()
    })

    const inputEl = input()
    expect(inputEl.getAttribute('aria-invalid')).toBe('true')

    const describedBy = inputEl.getAttribute('aria-describedby') ?? ''
    expect(describedBy).toContain('-error')
    expect(describedBy).toContain('-hint')
    expect(describedBy).toContain('-description')
    expect(describedBy).toContain('-help')

    await fireEvent.input(inputEl, {
      target: { value: 'valid' },
      currentTarget: { value: 'valid' },
    })
    await fireEvent.blur(inputEl)

    await waitFor(() => {
      expect(screen.queryByText('Error message')).toBeNull()
    })
  })

  test('validates on change', async () => {
    const { screen, input } = createForm(['change'])
    const inputEl = input()

    await fireEvent.change(inputEl, {
      target: { value: 'bad' },
      currentTarget: { value: 'bad' },
    })
    await waitFor(() => {
      expect(screen.getByText('Error message')).not.toBeNull()
    })

    await fireEvent.input(inputEl, {
      target: { value: 'valid' },
      currentTarget: { value: 'valid' },
    })
    await fireEvent.change(inputEl, {
      target: { value: 'valid' },
      currentTarget: { value: 'valid' },
    })

    await waitFor(() => {
      expect(screen.queryByText('Error message')).toBeNull()
    })
  })

  test('validates on input and respects eagerValidation=false', async () => {
    const eagerForm = createForm(['input'], true)
    const eagerInput = eagerForm.input()

    await fireEvent.input(eagerInput, {
      target: { value: 'bad' },
      currentTarget: { value: 'bad' },
    })
    await waitFor(() => {
      expect(eagerForm.screen.getByText('Error message')).not.toBeNull()
    })

    await fireEvent.input(eagerInput, {
      target: { value: 'valid' },
      currentTarget: { value: 'valid' },
    })
    await waitFor(() => {
      expect(eagerForm.screen.queryByText('Error message')).toBeNull()
    })

    const nonEagerForm = createForm(['input'])
    const nonEagerInput = nonEagerForm.input()

    await fireEvent.input(nonEagerInput, {
      target: { value: 'bad' },
      currentTarget: { value: 'bad' },
    })
    await waitFor(() => {
      expect(nonEagerForm.screen.queryByText('Error message')).toBeNull()
    })

    await fireEvent.blur(nonEagerInput)
    await fireEvent.input(nonEagerInput, {
      target: { value: 'bad' },
      currentTarget: { value: 'bad' },
    })
    await waitFor(() => {
      expect(nonEagerForm.screen.getByText('Error message')).not.toBeNull()
    })
  })

  test('applies classes.root override', () => {
    const screen = render(() => <Input classes={{ root: 'root-override' }} />)
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.className).toContain('root-override')
  })
})
