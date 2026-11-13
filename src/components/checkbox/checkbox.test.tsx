import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import * as v from 'valibot'
import { describe, expect, test, vi } from 'vitest'

import { renderWithOwner } from '../../test-util/owner-render'
import { FieldProvider } from '../field/field-context'
import type { FieldBinding } from '../field/field-context'
import { createForm } from '../form'

import { Checkbox } from './checkbox'

function expectCheckboxChecked(element: Element, checked: boolean | 'mixed'): void {
  expect(element.getAttribute('aria-checked')).toBe(checked === 'mixed' ? 'mixed' : String(checked))
}

function getHiddenCheckbox(container: HTMLElement): HTMLInputElement {
  return container.querySelector(
    'input[type="checkbox"][data-slot="checkbox-input"]',
  ) as HTMLInputElement
}

describe('Checkbox', () => {
  test('exposes native inputRef', () => {
    let ref: HTMLInputElement | undefined
    render(() => <Checkbox inputRef={(el) => (ref = el)} label="Ref test" />)
    expect(ref).toBeInstanceOf(HTMLInputElement)
    expect(ref?.type).toBe('checkbox')
  })
  test('applies tabIndex to the focusable control instead of the root', () => {
    const screen = render(() => <Checkbox tabIndex={-1} aria-hidden="true" label="Skipped" />)

    expect(
      screen.container.querySelector('[data-slot="checkbox-control"]')?.getAttribute('tabindex'),
    ).toBe('-1')
    expect(screen.container.querySelector('[data-slot="checkbox"]')?.hasAttribute('tabindex')).toBe(
      false,
    )
  })

  test('renders label and description with accessible checkbox input', () => {
    const screen = render(() => (
      <Checkbox label="Accept terms" description="Required to continue" />
    ))

    const checkbox = screen.getByRole('checkbox', { name: 'Accept terms' })
    const label = screen.getByText('Accept terms')

    expect(checkbox).not.toBeNull()
    expect(label.getAttribute('for')).toBe(checkbox.getAttribute('id'))
    expect(screen.getByText('Required to continue')).not.toBeNull()
    expect(checkbox.getAttribute('aria-describedby')).toBe(
      `${checkbox.getAttribute('id')}-description`,
    )
  })

  test('supports uncontrolled toggle and custom checked icon content', async () => {
    const screen = render(() => (
      <Checkbox
        defaultChecked
        label="Custom"
        checkedIcon={<span data-testid="checked-icon">C</span>}
        indeterminateIcon={<span data-testid="indeterminate-icon">I</span>}
      />
    ))

    const checkbox = screen.getByRole('checkbox', { name: 'Custom' })
    const root = screen.container.querySelector('[data-slot="checkbox"]')!

    expectCheckboxChecked(checkbox, true)
    expect(root.getAttribute('data-checked')).toBe('')
    expect(root.hasAttribute('data-unchecked')).toBe(false)
    expect(screen.getByTestId('checked-icon').textContent).toBe('C')

    fireEvent.click(checkbox)

    expectCheckboxChecked(checkbox, false)
    expect(root.hasAttribute('data-checked')).toBe(false)
    expect(root.getAttribute('data-unchecked')).toBe('')
  })

  test('toggles once from the native Space sequence and never from Enter', async () => {
    const onChange = vi.fn()
    const screen = render(() => <Checkbox label="Keyboard" onCheckedChange={onChange} />)
    const checkbox = screen.getByRole('checkbox', { name: 'Keyboard' })

    fireEvent.keyDown(checkbox, { key: ' ' })
    fireEvent.keyUp(checkbox, { key: ' ' })

    expect(onChange).not.toHaveBeenCalled()

    fireEvent.click(checkbox)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith(true)
    expectCheckboxChecked(checkbox, true)

    const enterDown = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Enter',
    })
    checkbox.dispatchEvent(enterDown)
    fireEvent.click(checkbox)
    fireEvent.keyUp(checkbox, { key: 'Enter' })

    expect(enterDown.defaultPrevented).toBe(true)
    expect(onChange).toHaveBeenCalledTimes(1)
    expectCheckboxChecked(checkbox, true)
  })

  test('forwards visual focus boundaries to the bound Field', () => {
    const emit = vi.fn()
    const binding: FieldBinding = {
      emit,
      setValue: vi.fn(),
    }
    const screen = render(() => (
      <FieldProvider value={{ binding }}>
        <Checkbox label="Bound checkbox" />
      </FieldProvider>
    ))
    const control = screen.getByRole('checkbox', { name: 'Bound checkbox' })

    fireEvent.focus(control)
    fireEvent.blur(control)

    expect(emit).toHaveBeenNthCalledWith(1, 'focus', expect.any(FocusEvent))
    expect(emit).toHaveBeenNthCalledWith(2, 'blur', expect.any(FocusEvent))

    const hiddenInput = getHiddenCheckbox(screen.container)
    fireEvent.focus(hiddenInput)
    fireEvent.blur(hiddenInput)

    expect(emit).toHaveBeenCalledTimes(2)
  })

  test('marks a Form.Field checkbox touched on visual focus and validates on blur', async () => {
    const schema = v.object({
      terms: v.pipe(
        v.boolean(),
        v.check((checked) => checked, 'Accept the terms.'),
      ),
    })
    const { screen, value: form } = renderWithOwner(
      () => createForm({ schema, initialInput: { terms: false }, validate: 'blur' }),
      (form) => (
        <form.Form>
          <form.Field name="terms" label="Terms">
            <Checkbox />
          </form.Field>
        </form.Form>
      ),
    )
    const control = screen.getByRole('checkbox', { name: 'Terms' })

    fireEvent.focus(control)
    expect(form.isTouched).toBe(true)

    fireEvent.blur(control)

    await waitFor(() => expect(screen.getByText('Accept the terms.')).not.toBeNull())
    expect(control.getAttribute('aria-invalid')).toBe('true')
  })

  test('lets a canceled root click prevent control activation', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <Checkbox
        label="Canceled"
        onCheckedChange={onChange}
        onClick={(event: MouseEvent) => event.preventDefault()}
      />
    ))

    fireEvent.click(screen.getByRole('checkbox', { name: 'Canceled' }))

    expect(onChange).not.toHaveBeenCalled()
    expectCheckboxChecked(screen.getByRole('checkbox', { name: 'Canceled' }), false)
  })

  test('does not toggle when disabled', async () => {
    const onChange = vi.fn()
    const screen = render(() => <Checkbox disabled label="Disabled" onCheckedChange={onChange} />)
    const checkbox = screen.getByRole('checkbox', { name: 'Disabled' })
    const control = screen.container.querySelector('[data-slot="checkbox-control"]') as HTMLElement

    expect(checkbox.getAttribute('aria-disabled')).toBe('true')

    fireEvent.click(checkbox)
    fireEvent.click(control)
    fireEvent.keyDown(checkbox, { key: ' ' })

    expectCheckboxChecked(checkbox, false)
    expect(onChange).not.toHaveBeenCalled()
  })

  test('updates the control state and indicator when checked changes from indeterminate', () => {
    const [checked, setChecked] = createSignal<boolean | 'indeterminate'>('indeterminate')
    const screen = render(() => (
      <Checkbox
        checked={checked()}
        label="Fill"
        checkedIcon={<span data-testid="checked-icon">C</span>}
        indeterminateIcon={<span data-testid="indeterminate-icon">I</span>}
      />
    ))
    const checkbox = screen.getByRole('checkbox', { name: 'Fill' })
    const control = screen.container.querySelector('[data-slot="checkbox-control"]')!

    expectCheckboxChecked(checkbox, 'mixed')
    expect(control.hasAttribute('data-indeterminate')).toBe(true)
    expect(screen.getByTestId('indeterminate-icon').textContent).toBe('I')

    setChecked(true)

    expectCheckboxChecked(checkbox, true)
    expect(control.hasAttribute('data-indeterminate')).toBe(false)
    expect(control.hasAttribute('data-checked')).toBe(true)
    expect(screen.queryByTestId('indeterminate-icon')).toBeNull()
    expect(screen.getByTestId('checked-icon').textContent).toBe('C')
  })

  test.each([
    ['controlled', { checked: 'indeterminate' as const }],
    ['uncontrolled', { defaultChecked: 'indeterminate' as const }],
  ])('shows the mixed state when a %s checkbox starts indeterminate', async (_mode, state) => {
    const screen = render(() => (
      <Checkbox
        {...state}
        label="Select all"
        description="Selection summary"
        indeterminateIcon={<span data-testid="indeterminate-icon">I</span>}
      />
    ))

    const checkbox = screen.getByRole('checkbox', { name: 'Select all' })
    const input = getHiddenCheckbox(screen.container)
    const root = screen.container.querySelector('[data-slot="checkbox"]')

    await waitFor(() => {
      expect(input.indeterminate).toBe(true)
      expect(input.checked).toBe(false)
      expectCheckboxChecked(checkbox, 'mixed')
      expect(root?.getAttribute('data-indeterminate')).toBe('')
      expect(screen.getByTestId('indeterminate-icon').textContent).toBe('I')
    })
  })

  test.each([
    ['controlled', { checked: 'indeterminate' as const }, 'mixed'],
    ['uncontrolled', { defaultChecked: 'indeterminate' as const }, true],
  ])(
    'emits the checked value when a %s indeterminate checkbox is clicked',
    (_mode, state, aria) => {
      const onChange = vi.fn()
      const screen = render(() => (
        <Checkbox
          {...state}
          label="Mixed"
          trueValue="all"
          falseValue="none"
          onCheckedChange={onChange}
        />
      ))
      const checkbox = screen.getByRole('checkbox', { name: 'Mixed' })

      fireEvent.click(checkbox)

      expect(onChange).toHaveBeenCalledExactlyOnceWith('all')
      expect(checkbox.getAttribute('aria-checked')).toBe(String(aria))
    },
  )

  test('passes id, name, value and required attributes to input', () => {
    const screen = render(() => (
      <Checkbox id="terms-checkbox" name="terms" value="accepted" required label="Terms" />
    ))

    const checkbox = screen.getByRole('checkbox', { name: 'Terms' })
    const input = getHiddenCheckbox(screen.container)
    const control = screen.container.querySelector('[data-slot="checkbox-control"]')

    expect(checkbox.getAttribute('id')).toBe('terms-checkbox')
    expect(input.getAttribute('id')).toBe('terms-checkbox-input')
    expect(input.getAttribute('name')).toBe('terms')
    expect(input.getAttribute('value')).toBe('accepted')
    expect(input.getAttribute('required')).not.toBeNull()
    expect(control?.getAttribute('data-required')).toBe('')
  })

  test('keeps controlled state while emitting onCheckedChange', async () => {
    const onChange = vi.fn()

    const screen = render(() => <Checkbox checked label="Controlled" onCheckedChange={onChange} />)
    const checkbox = screen.getByRole('checkbox', { name: 'Controlled' })

    fireEvent.click(checkbox)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(false)

    await waitFor(() => {
      expectCheckboxChecked(checkbox, true)
    })
  })

  test.each([
    ['controlled', { checked: true }, true],
    ['uncontrolled', { defaultChecked: false }, false],
  ])('does not toggle a %s readonly checkbox', async (_mode, state, expected) => {
    const onChange = vi.fn()
    const screen = render(() => (
      <Checkbox {...state} readOnly label="Readonly" onCheckedChange={onChange} />
    ))
    const checkbox = screen.getByRole('checkbox', { name: 'Readonly' })

    expect(checkbox.getAttribute('aria-readonly')).toBe('true')

    fireEvent.click(checkbox)
    fireEvent.keyDown(checkbox, { key: ' ' })

    expectCheckboxChecked(checkbox, expected)
    expect(onChange).not.toHaveBeenCalled()
  })

  test('maps custom true and false values for controlled checkbox', async () => {
    const onChange = vi.fn()

    const screen = render(() => (
      <Checkbox
        checked="active"
        trueValue="active"
        falseValue="inactive"
        label="Status"
        onCheckedChange={onChange}
      />
    ))
    const checkbox = screen.getByRole('checkbox', { name: 'Status' })

    expectCheckboxChecked(checkbox, true)

    fireEvent.click(checkbox)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('inactive')

    await waitFor(() => {
      expectCheckboxChecked(checkbox, true)
    })
  })

  test('submits hidden checkbox value only when checked and resets to default state', async () => {
    const onSubmit = vi.fn()
    const screen = render(() => (
      <form onSubmit={onSubmit}>
        <Checkbox name="agree" value="yes" defaultChecked label="Agree" />
        <button type="reset">Reset</button>
        <button type="submit">Submit</button>
      </form>
    ))

    const form = screen.container.querySelector('form') as HTMLFormElement
    const checkbox = screen.getByRole('checkbox', { name: 'Agree' })
    const input = getHiddenCheckbox(screen.container)

    expectCheckboxChecked(checkbox, true)
    expect(input.checked).toBe(true)
    expect(new FormData(form).get('agree')).toBe('yes')

    fireEvent.click(checkbox)

    expectCheckboxChecked(checkbox, false)
    expect(input.checked).toBe(false)
    expect(new FormData(form).has('agree')).toBe(false)

    form.reset()

    await waitFor(() => {
      expectCheckboxChecked(checkbox, true)
      expect(input.checked).toBe(true)
      expect(new FormData(form).get('agree')).toBe('yes')
    })
  })

  test('submits the native value from value, then trueValue, then on, and nothing when unchecked', () => {
    const screen = render(() => (
      <form>
        <Checkbox name="boolean" defaultChecked label="Boolean" />
        <Checkbox name="mapped" trueValue="pro" falseValue="free" defaultChecked label="Mapped" />
        <Checkbox name="explicit" trueValue="pro" value="yes" defaultChecked label="Explicit" />
        <Checkbox name="unchecked" trueValue="pro" label="Unchecked" />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement

    expect(new FormData(form).get('boolean')).toBe('on')
    expect(new FormData(form).get('mapped')).toBe('pro')
    expect(new FormData(form).get('explicit')).toBe('yes')
    expect(new FormData(form).has('unchecked')).toBe(false)

    fireEvent.click(screen.getByRole('checkbox', { name: 'Mapped' }))

    expect(new FormData(form).has('mapped')).toBe(false)
  })

  test('derives the native value from a string or number trueValue, otherwise on', () => {
    const screen = render(() => (
      <form>
        <Checkbox name="count" trueValue={1} falseValue={0} label="Count" />
        <Checkbox name="meta" trueValue={{ plan: 'pro' }} label="Meta" />
      </form>
    ))

    const [count, meta] = Array.from(
      screen.container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
    )

    expect(count!.value).toBe('1')
    expect(meta!.value).toBe('on')
  })

  test('form.Field checkbox submits its trueValue as the native value', async () => {
    const onSubmit = vi.fn()
    const { screen } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ plan: v.picklist(['pro', 'free']) }),
          initialInput: { plan: 'free' },
        }),
      (form) => (
        <form.Form onSubmit={onSubmit}>
          <form.Field name="plan" label="Pro plan">
            <Checkbox trueValue="pro" falseValue="free" />
          </form.Field>
        </form.Form>
      ),
    )
    const formElement = screen.container.querySelector('form') as HTMLFormElement
    const checkbox = screen.getByRole('checkbox', { name: 'Pro plan' })

    expect(new FormData(formElement).has('plan')).toBe(false)

    fireEvent.click(checkbox)

    expect(new FormData(formElement).get('plan')).toBe('pro')
    fireEvent.submit(formElement)
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({ plan: 'pro' })
  })

  test('form.Field checkbox submits a boolean and keeps its native input checked with its value', async () => {
    const onSubmit = vi.fn()
    const { screen } = renderWithOwner(
      () =>
        createForm({ schema: v.object({ terms: v.boolean() }), initialInput: { terms: false } }),
      (form) => (
        <form.Form onSubmit={onSubmit}>
          <form.Field name="terms" label="Terms">
            <Checkbox value="accepted" />
          </form.Field>
        </form.Form>
      ),
    )
    const formElement = screen.container.querySelector('form') as HTMLFormElement
    const checkbox = screen.getByRole('checkbox', { name: 'Terms' })
    const input = getHiddenCheckbox(screen.container)

    expect(input.checked).toBe(false)

    fireEvent.click(checkbox)
    expect(input.checked).toBe(true)
    expect(input.value).toBe('accepted')
    fireEvent.submit(formElement)
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({ terms: true })

    fireEvent.click(checkbox)
    expect(input.checked).toBe(false)
    fireEvent.submit(formElement)
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2))
    expect(onSubmit.mock.calls[1]?.[0]).toEqual({ terms: false })
  })

  test('implicitly submits the form on Enter through the default submitter', () => {
    const onSubmit = vi.fn()
    const screen = render(() => (
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <Checkbox name="agree" label="Agree" />
        <button type="submit">Send</button>
      </form>
    ))

    const checkbox = screen.getByRole('checkbox', { name: 'Agree' })
    const submitter = screen.getByRole('button', { name: 'Send' })
    const onSubmitterClick = vi.fn()
    submitter.addEventListener('click', onSubmitterClick)

    expectCheckboxChecked(checkbox, false)
    fireEvent.keyDown(checkbox, { key: 'Enter' })

    expect(onSubmitterClick).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expectCheckboxChecked(checkbox, false)
  })

  test('implicitly submits the form on Enter without a submit button', () => {
    const onSubmit = vi.fn()
    const screen = render(() => (
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <Checkbox name="agree" label="Agree" />
      </form>
    ))

    const checkbox = screen.getByRole('checkbox', { name: 'Agree' })
    fireEvent.keyDown(checkbox, { key: 'Enter' })

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expectCheckboxChecked(checkbox, false)
  })

  test('does not toggle or submit on Enter outside a form', () => {
    const screen = render(() => <Checkbox name="agree" label="Agree" />)

    const checkbox = screen.getByRole('checkbox', { name: 'Agree' })
    fireEvent.keyDown(checkbox, { key: 'Enter' })

    expectCheckboxChecked(checkbox, false)
  })

  test('associates the hidden input with an external form through the form prop', () => {
    const screen = render(() => (
      <>
        <form id="external-form" />
        <Checkbox form="external-form" name="agree" label="Agree" />
      </>
    ))

    const externalForm = screen.container.querySelector<HTMLFormElement>('#external-form')!
    const input = getHiddenCheckbox(screen.container)

    expect(input.getAttribute('form')).toBe('external-form')
    expect(input.form).toBe(externalForm)
  })

  test('uses the initial default snapshot for reset after defaultChecked changes', async () => {
    const [defaultChecked, setDefaultChecked] = createSignal(false)
    const screen = render(() => (
      <form>
        <Checkbox defaultChecked={defaultChecked()} label="Snapshot" />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const checkbox = screen.getByRole('checkbox', { name: 'Snapshot' })

    fireEvent.click(checkbox)
    expectCheckboxChecked(checkbox, true)

    setDefaultChecked(true)
    form.reset()

    await waitFor(() => {
      expectCheckboxChecked(checkbox, false)
      expect(getHiddenCheckbox(screen.container).checked).toBe(false)
    })
  })

  test('keeps controlled state and callback count unchanged on form reset', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <form>
        <Checkbox
          checked
          defaultChecked={false}
          label="Controlled reset"
          onCheckedChange={onChange}
        />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const checkbox = screen.getByRole('checkbox', { name: 'Controlled reset' })

    form.reset()

    await waitFor(() => {
      expectCheckboxChecked(checkbox, true)
      expect(getHiddenCheckbox(screen.container).checked).toBe(true)
    })
    expect(onChange).not.toHaveBeenCalled()
  })

  test('restores the initial indeterminate state on form reset', async () => {
    const screen = render(() => (
      <form>
        <Checkbox defaultChecked="indeterminate" label="Mixed reset" />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const checkbox = screen.getByRole('checkbox', { name: 'Mixed reset' })
    const input = getHiddenCheckbox(screen.container)

    fireEvent.click(checkbox)
    expectCheckboxChecked(checkbox, true)

    form.reset()

    await waitFor(() => {
      expectCheckboxChecked(checkbox, 'mixed')
      expect(input.checked).toBe(false)
      expect(input.indeterminate).toBe(true)
    })
  })

  test('preserves native required validity, serialization, and disabled omission', async () => {
    const [disabled, setDisabled] = createSignal(false)
    const screen = render(() => (
      <form>
        <Checkbox required name="terms" value="accepted" disabled={disabled()} label="Terms" />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const checkbox = screen.getByRole('checkbox', { name: 'Terms' })
    const input = getHiddenCheckbox(screen.container)

    expect(input.validity.valueMissing).toBe(true)
    expect(form.checkValidity()).toBe(false)
    expect(new FormData(form).has('terms')).toBe(false)

    fireEvent.click(checkbox)
    expect(input.validity.valueMissing).toBe(false)
    expect(new FormData(form).get('terms')).toBe('accepted')

    setDisabled(true)
    expect(new FormData(form).has('terms')).toBe(false)
  })

  test('passes user classes to the root and control slots', () => {
    const screen = render(() => (
      <Checkbox
        variant="card"
        label="Classes"
        classes={{ root: 'user-root', control: 'user-control' }}
      />
    ))

    const root = screen.container.querySelector('[data-slot="checkbox"]')
    const base = screen.container.querySelector('[data-slot="checkbox-control"]')

    expect(root?.classList.contains('user-root')).toBe(true)
    expect(base?.classList.contains('user-control')).toBe(true)
  })

  test('applies style overrides', () => {
    const screen = render(() => (
      <Checkbox
        variant="card"
        label="Styles"
        styles={{
          root: { width: '200px' },
          control: { width: '200px' },
          label: { width: '200px' },
        }}
      />
    ))

    const root = screen.container.querySelector('[data-slot="checkbox"]') as HTMLElement | null
    const base = screen.container.querySelector(
      '[data-slot="checkbox-control"]',
    ) as HTMLElement | null
    const label = screen.container.querySelector(
      '[data-slot="checkbox-label"]',
    ) as HTMLElement | null

    expect(root?.style.width).toBe('200px')
    expect(base?.style.width).toBe('200px')
    expect(label?.style.width).toBe('200px')
  })

  test.each([
    ['card', true],
    ['list', false],
  ] as const)('a root click on a %s checkbox sets checked to %s', async (variant, toggles) => {
    const screen = render(() => <Checkbox variant={variant} label="Root click" />)

    const root = screen.container.querySelector('[data-slot="checkbox"]') as HTMLElement
    const checkbox = screen.getByRole('checkbox', { name: 'Root click' })

    fireEvent.click(root)

    await waitFor(() => {
      expectCheckboxChecked(checkbox, toggles)
    })
  })

  test.each([
    ['link', <a href="#details">Details</a>],
    ['button', <button type="button">Action</button>],
    ['input', <input aria-label="Nested input" />],
    ['disabled button', <button disabled>Disabled action</button>],
  ])('does not toggle a card from a nested %s', async (_name, content) => {
    const onChange = vi.fn()
    const screen = render(() => (
      <Checkbox variant="card" label={content} onCheckedChange={onChange} />
    ))
    const target = screen.container.querySelector(
      '[data-slot="checkbox-label"] a, [data-slot="checkbox-label"] button, [data-slot="checkbox-label"] input',
    ) as HTMLElement

    fireEvent.click(target)

    expect(onChange).not.toHaveBeenCalled()
    expectCheckboxChecked(screen.getByRole('checkbox'), false)
  })

  test('ignores non-primary synthetic card clicks', () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <Checkbox variant="card" label="Secondary" onCheckedChange={onChange} />
    ))
    const root = screen.container.querySelector('[data-slot="checkbox"]')!

    root.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 2 }))

    expect(onChange).not.toHaveBeenCalled()
  })

  test('renders JSX label, description, and icons passed as content', () => {
    const screen = render(() => (
      <Checkbox
        checked="indeterminate"
        label={<span>Rich label</span>}
        description="Description"
        indeterminateIcon={<span>Mixed</span>}
      />
    ))

    expect(screen.getByRole('checkbox', { name: 'Rich label' })).not.toBeNull()
    expect(screen.getByText('Description')).not.toBeNull()
    expect(screen.getByText('Mixed')).not.toBeNull()
  })
})
