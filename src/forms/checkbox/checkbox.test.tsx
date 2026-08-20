import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createComponent, createSignal } from 'solid-js'
import { hydrate } from 'solid-js/web'
import { describe, expect, test, vi } from 'vitest'

import { installHydrationState, renderSsrFixture } from '../../test-utils/ssr-test.ts'

import { Checkbox } from './checkbox.tsx'

function expectCheckboxChecked(element: Element, checked: boolean | 'mixed'): void {
  expect(element.getAttribute('aria-checked')).toBe(checked === 'mixed' ? 'mixed' : String(checked))
}

function getHiddenCheckbox(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[type="checkbox"][data-slot="input"]') as HTMLInputElement
}

describe('Checkbox', () => {
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

    expectCheckboxChecked(checkbox, true)
    expect(screen.getByTestId('checked-icon').textContent).toBe('C')

    await fireEvent.click(checkbox)

    expectCheckboxChecked(checkbox, false)
  })

  test('toggles once from the native Space sequence and never from Enter', async () => {
    const onChange = vi.fn()
    const screen = render(() => <Checkbox label="Keyboard" onChange={onChange} />)
    const checkbox = screen.getByRole('checkbox', { name: 'Keyboard' })

    await fireEvent.keyDown(checkbox, { key: ' ' })
    await fireEvent.keyUp(checkbox, { key: ' ' })

    expect(onChange).not.toHaveBeenCalled()

    await fireEvent.click(checkbox)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith(true)
    expectCheckboxChecked(checkbox, true)

    const enterDown = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Enter',
    })
    checkbox.dispatchEvent(enterDown)
    await fireEvent.click(checkbox)
    await fireEvent.keyUp(checkbox, { key: 'Enter' })

    expect(enterDown.defaultPrevented).toBe(true)
    expect(onChange).toHaveBeenCalledTimes(1)
    expectCheckboxChecked(checkbox, true)
  })

  test('lets a canceled root click prevent control activation', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <Checkbox
        label="Canceled"
        onChange={onChange}
        onClick={(event: MouseEvent) => event.preventDefault()}
      />
    ))

    await fireEvent.click(screen.getByRole('checkbox', { name: 'Canceled' }))

    expect(onChange).not.toHaveBeenCalled()
    expectCheckboxChecked(screen.getByRole('checkbox', { name: 'Canceled' }), false)
  })

  test('does not toggle when disabled', async () => {
    const onChange = vi.fn()
    const screen = render(() => <Checkbox disabled label="Disabled" onChange={onChange} />)
    const checkbox = screen.getByRole('checkbox', { name: 'Disabled' })
    const control = screen.container.querySelector('[data-slot="control"]') as HTMLElement

    expect(checkbox.getAttribute('aria-disabled')).toBe('true')

    await fireEvent.click(checkbox)
    await fireEvent.click(control)
    await fireEvent.keyDown(checkbox, { key: ' ' })

    expectCheckboxChecked(checkbox, false)
    expect(onChange).not.toHaveBeenCalled()
  })

  test('renders controlled indeterminate state with indeterminate icon', async () => {
    const screen = render(() => (
      <Checkbox
        checked="indeterminate"
        label="Select all"
        checkedIcon={<span data-testid="checked-icon">C</span>}
        indeterminateIcon={<span data-testid="indeterminate-icon">I</span>}
      />
    ))

    const checkbox = screen.getByRole('checkbox', { name: 'Select all' })
    const input = getHiddenCheckbox(screen.container)
    const control = screen.container.querySelector('[data-slot="control"]')

    await waitFor(() => {
      expect(input.indeterminate).toBe(true)
      expect(input.checked).toBe(false)
      expectCheckboxChecked(checkbox, 'mixed')
      expect(control?.getAttribute('data-indeterminate')).not.toBeNull()
      expect(screen.getByTestId('indeterminate-icon').textContent).toBe('I')
    })
  })

  test('renders default indeterminate state when defaultChecked is indeterminate', async () => {
    const screen = render(() => (
      <Checkbox
        defaultChecked="indeterminate"
        label="Default indeterminate"
        indeterminateIcon={<span data-testid="indeterminate-icon">I</span>}
      />
    ))

    const checkbox = screen.getByRole('checkbox', {
      name: 'Default indeterminate',
    })
    const input = getHiddenCheckbox(screen.container)
    const control = screen.container.querySelector('[data-slot="control"]')

    await waitFor(() => {
      expect(input.indeterminate).toBe(true)
      expect(input.checked).toBe(false)
      expectCheckboxChecked(checkbox, 'mixed')
      expect(control?.getAttribute('data-indeterminate')).not.toBeNull()
      expect(screen.getByTestId('indeterminate-icon').textContent).toBe('I')
    })
  })

  test('passes id, name, value and required attributes to input', () => {
    const screen = render(() => (
      <Checkbox id="terms-checkbox" name="terms" value="accepted" required label="Terms" />
    ))

    const checkbox = screen.getByRole('checkbox', { name: 'Terms' })
    const input = getHiddenCheckbox(screen.container)
    const control = screen.container.querySelector('[data-slot="control"]')

    expect(checkbox.getAttribute('id')).toBe('terms-checkbox')
    expect(input.getAttribute('id')).toBe('terms-checkbox-input')
    expect(input.getAttribute('name')).toBe('terms')
    expect(input.getAttribute('value')).toBe('accepted')
    expect(input.getAttribute('required')).not.toBeNull()
    expect(control?.getAttribute('data-required')).toBe('')
  })

  test('keeps controlled state while emitting onChange', async () => {
    const onChange = vi.fn()

    const screen = render(() => <Checkbox checked label="Controlled" onChange={onChange} />)
    const checkbox = screen.getByRole('checkbox', { name: 'Controlled' })

    await fireEvent.click(checkbox)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(false)

    await waitFor(() => {
      expectCheckboxChecked(checkbox, true)
    })
  })

  test('does not toggle a controlled readonly checkbox', async () => {
    const onChange = vi.fn()
    const screen = render(() => <Checkbox checked readOnly label="Readonly" onChange={onChange} />)
    const checkbox = screen.getByRole('checkbox', { name: 'Readonly' })

    expect(checkbox.getAttribute('aria-readonly')).toBe('true')

    await fireEvent.click(checkbox)

    expectCheckboxChecked(checkbox, true)
    expect(onChange).not.toHaveBeenCalled()

    await fireEvent.keyDown(checkbox, { key: ' ' })

    expectCheckboxChecked(checkbox, true)
    expect(onChange).not.toHaveBeenCalled()
  })

  test('does not toggle an uncontrolled readonly checkbox', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <Checkbox readOnly label="Readonly uncontrolled" onChange={onChange} />
    ))
    const checkbox = screen.getByRole('checkbox', {
      name: 'Readonly uncontrolled',
    })

    await fireEvent.click(checkbox)

    expectCheckboxChecked(checkbox, false)
    expect(onChange).not.toHaveBeenCalled()

    await fireEvent.keyDown(checkbox, { key: ' ' })

    expectCheckboxChecked(checkbox, false)
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
        onChange={onChange}
      />
    ))
    const checkbox = screen.getByRole('checkbox', { name: 'Status' })

    expectCheckboxChecked(checkbox, true)

    await fireEvent.click(checkbox)

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

    await fireEvent.click(checkbox)

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

  test('uses the initial default snapshot for reset after defaultChecked changes', async () => {
    const [defaultChecked, setDefaultChecked] = createSignal(false)
    const screen = render(() => (
      <form>
        <Checkbox defaultChecked={defaultChecked()} label="Snapshot" />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const checkbox = screen.getByRole('checkbox', { name: 'Snapshot' })

    await fireEvent.click(checkbox)
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
        <Checkbox checked defaultChecked={false} label="Controlled reset" onChange={onChange} />
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

    await fireEvent.click(checkbox)
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

    await fireEvent.click(checkbox)
    expect(input.validity.valueMissing).toBe(false)
    expect(new FormData(form).get('terms')).toBe('accepted')

    setDisabled(true)
    expect(new FormData(form).has('terms')).toBe(false)
  })

  test('applies card variant, end indicator and size classes', () => {
    const screen = render(() => (
      <Checkbox
        variant="card"
        indicator="end"
        size="lg"
        label="Classes"
        classes={{ root: 'root-override' }}
      />
    ))

    const root = screen.container.querySelector('[data-slot="root"]')
    const input = screen.container.querySelector('[data-slot="input"]')
    const base = screen.container.querySelector('[data-slot="control"]')

    expect(root?.className).toContain('rounded-md')
    expect(root?.className).toContain('flex-row-reverse')
    expect(root?.className).toContain('root-override')
    expect(input?.className).toContain('peer')
    expect(base?.className).toContain('focus-visible:effect-fv-border')
    expect(base?.className).toContain('size-4.5')
    expect(screen.getByText('Classes').className).toContain('select-none')
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

    const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement | null
    const base = screen.container.querySelector('[data-slot="control"]') as HTMLElement | null
    const label = screen.container.querySelector('[data-slot="label"]') as HTMLElement | null

    expect(root?.style.width).toBe('200px')
    expect(base?.style.width).toBe('200px')
    expect(label?.style.width).toBe('200px')
  })

  test('toggles when clicking card root container', async () => {
    const screen = render(() => <Checkbox variant="card" label="Card root click" />)

    const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement
    const checkbox = screen.getByRole('checkbox', { name: 'Card root click' })

    expectCheckboxChecked(checkbox, false)

    await fireEvent.click(root)

    await waitFor(() => {
      expectCheckboxChecked(checkbox, true)
    })
  })

  test.each([
    ['link', <a href="#details">Details</a>],
    ['button', <button type="button">Action</button>],
    ['input', <input aria-label="Nested input" />],
    ['disabled button', <button disabled>Disabled action</button>],
  ])('does not toggle a card from a nested %s', async (_name, content) => {
    const onChange = vi.fn()
    const screen = render(() => <Checkbox variant="card" label={content} onChange={onChange} />)
    const target = screen.container.querySelector(
      '[data-slot="label"] a, [data-slot="label"] button, [data-slot="label"] input',
    ) as HTMLElement

    await fireEvent.click(target)

    expect(onChange).not.toHaveBeenCalled()
    expectCheckboxChecked(screen.getByRole('checkbox'), false)
  })

  test('ignores non-primary synthetic card clicks', () => {
    const onChange = vi.fn()
    const screen = render(() => <Checkbox variant="card" label="Secondary" onChange={onChange} />)
    const root = screen.container.querySelector('[data-slot="root"]')!

    root.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 2 }))

    expect(onChange).not.toHaveBeenCalled()
  })

  test('single-evaluates conditional JSX inputs', () => {
    const reads = { checkedIcon: 0, description: 0, indeterminateIcon: 0, label: 0 }
    const screen = render(() =>
      createComponent(Checkbox, {
        checked: 'indeterminate',
        get checkedIcon() {
          reads.checkedIcon += 1
          return <span>Checked</span>
        },
        get description() {
          reads.description += 1
          return 'Description'
        },
        get indeterminateIcon() {
          reads.indeterminateIcon += 1
          return <span>Mixed</span>
        },
        get label() {
          reads.label += 1
          return 'Label'
        },
      }),
    )

    expect(screen.getByRole('checkbox', { name: 'Label' })).not.toBeNull()
    expect(screen.getByText('Description')).not.toBeNull()
    expect(screen.getByText('Mixed')).not.toBeNull()
    expect(reads).toEqual({ checkedIcon: 0, description: 1, indeterminateIcon: 1, label: 1 })
  })

  test('does not toggle when clicking list root container', async () => {
    const screen = render(() => <Checkbox label="List root click" />)

    const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement
    const checkbox = screen.getByRole('checkbox', { name: 'List root click' })

    expectCheckboxChecked(checkbox, false)

    await fireEvent.click(root)

    await waitFor(() => {
      expectCheckboxChecked(checkbox, false)
    })
  })

  test('hydrates indeterminate content and preserves branch order through state updates', () => {
    const markup = renderSsrFixture(
      '/src/forms/checkbox/checkbox.ssr.fixture.tsx',
      'renderCheckboxFixture',
    )
    const container = document.createElement('div')
    container.innerHTML = markup
    document.body.append(container)
    const serverRoot = container.querySelector('[data-slot="root"]')
    const [checked, setChecked] = createSignal<boolean | 'indeterminate'>('indeterminate')
    const restoreHydrationState = installHydrationState()

    const dispose = hydrate(
      () => (
        <Checkbox
          checked={checked()}
          label="Server label"
          description="Server description"
          checkedIcon={<span data-testid="checked-icon">Checked</span>}
          indeterminateIcon={<span data-testid="mixed-icon">Mixed</span>}
        />
      ),
      container,
    )
    const root = container.querySelector('[data-slot="root"]')!
    const control = container.querySelector('[data-slot="control"]')!

    expect(root).toBe(serverRoot)
    expect(control.getAttribute('aria-checked')).toBe('mixed')
    expect(container.querySelector('[data-testid="mixed-icon"]')?.textContent).toBe('Mixed')

    setChecked(true)
    expect(control.getAttribute('aria-checked')).toBe('true')
    expect(container.querySelector('[data-testid="checked-icon"]')?.textContent).toBe('Checked')

    setChecked(false)
    expect(control.getAttribute('aria-checked')).toBe('false')
    expect(container.querySelector('[data-slot="indicator"]')).toBeNull()
    expect(Array.from(root.children).map((child) => child.getAttribute('data-slot'))).toEqual([
      'input',
      'control',
      'wrapper',
    ])

    dispose()
    container.remove()
    restoreHydrationState()
  }, 15_000)
})
