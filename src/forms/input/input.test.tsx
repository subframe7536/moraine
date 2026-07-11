import { fireEvent, render } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { Input } from './input'
import type { InputProps } from './input'

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
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(input.getAttribute('id')).toBe('email-input')
    expect(input.getAttribute('name')).toBe('email')
    expect(input.getAttribute('type')).toBe('email')
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
    const input = screen.getByRole('textbox') as HTMLInputElement
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(input.readOnly).toBe(true)
    expect(input.getAttribute('aria-readonly')).toBe('true')
    expect(root?.getAttribute('data-readonly')).toBe('')
    expect(input.getAttribute('data-readonly')).toBe('')
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

    const leadingIcon = screen.container.querySelector(
      '[data-slot="leading"] [data-slot="icon"]',
    ) as HTMLElement | null
    const trailingIcon = screen.container.querySelector(
      '[data-slot="trailing"] [data-slot="icon"]',
    ) as HTMLElement | null

    expect(leadingIcon?.className).toContain('i-lucide-search')
    expect(trailingIcon?.className).toContain('i-lucide-at-sign')
    expect(screen.getByTestId('leading-node').textContent).toBe('L')
    expect(screen.getByTestId('trailing-node').textContent).toBe('T')
    expect(screen.container.querySelector('[data-slot="leadingIcon"]')).toBeNull()
    expect(screen.container.querySelector('[data-slot="trailingIcon"]')).toBeNull()
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
    const input = screen.getByRole('textbox')

    await fireEvent.input(input, {
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

    await fireEvent.input(preserveInput!, {
      target: { value: '' },
      currentTarget: { value: '' },
    })
    expect(preserveChange).toHaveBeenLastCalledWith('')

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
    const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement | null

    expect(root?.style.width).toBe('200px')
  })

  test('rejects removed icon class slot in type contract', () => {
    // @ts-expect-error leadingIcon slot class has been removed from Input props
    const props: InputProps = { classes: { leadingIcon: 'x' } }
    expect(props).toBeDefined()
  })
})
