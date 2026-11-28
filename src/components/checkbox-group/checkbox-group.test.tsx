import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import * as v from 'valibot'
import { describe, expect, vi, it } from 'vitest'

import { MoraineProvider } from '../../provider'
import { renderWithOwner } from '../../test-util/owner-render'
import { defineTheme } from '../../theme/create-theme'
import { FieldProvider } from '../field/field-context'
import type { FieldBinding } from '../field/field-context'
import { createForm } from '../form'

import { CheckboxGroup } from './checkbox-group'
function expectCheckboxChecked(element: Element, checked: boolean | 'mixed'): void {
  expect(element.getAttribute('aria-checked')).toBe(checked === 'mixed' ? 'mixed' : String(checked))
}

function getHiddenCheckbox(container: HTMLElement, value: string): HTMLInputElement {
  return container.querySelector(`input[type="checkbox"][value="${value}"]`) as HTMLInputElement
}

describe('checkboxGroup', () => {
  it('reads indicatorPosition from theme defaults and lets the prop override it', () => {
    const theme = defineTheme({
      checkboxGroup: { defaultVariants: { indicatorPosition: 'trailing' } },
    })
    const screen = render(() => (
      <MoraineProvider theme={theme}>
        <CheckboxGroup data-testid="themed" items={['a']} />
        <CheckboxGroup data-testid="explicit" indicatorPosition="leading" items={['b']} />
      </MoraineProvider>
    ))
    const themedItem = screen
      .getByTestId('themed')
      .querySelector('[data-slot="checkbox-group-item"]')
    const explicitItem = screen
      .getByTestId('explicit')
      .querySelector('[data-slot="checkbox-group-item"]')

    expect(themedItem?.className).toContain('flex-row-reverse')
    expect(explicitItem?.className).not.toContain('flex-row-reverse')
  })

  it('renders legend and primitive items', () => {
    const screen = render(() => <CheckboxGroup legend="Fruits" items={['Apple', 'Banana']} />)

    expect(screen.getByText('Fruits')).not.toBeNull()
    expect(screen.getByRole('checkbox', { name: 'Apple' })).not.toBeNull()
    expect(screen.getByRole('checkbox', { name: 'Banana' })).not.toBeNull()
  })

  it('forwards group styles to Checkbox-owned child slots', () => {
    const screen = render(() => (
      <CheckboxGroup
        items={['One']}
        defaultValue={['One']}
        classes={{ control: 'group-control', label: 'group-label' }}
        styles={{ control: { width: '21px' }, label: { width: '23px' } }}
      />
    ))
    const control = screen.container.querySelector<HTMLElement>('[data-slot="checkbox-control"]')
    const label = screen.container.querySelector<HTMLElement>('[data-slot="checkbox-label"]')

    expect(control?.classList.contains('group-control')).toBe(true)
    expect(control?.style.width).toBe('21px')
    expect(label?.classList.contains('group-label')).toBe(true)
    expect(label?.style.width).toBe('23px')
  })

  it('maps object items using default value/label/description fields', () => {
    const items = [{ value: 'a', label: 'Alpha', description: 'First option' }]
    const screen = render(() => <CheckboxGroup items={items} legend="Mapped" />)

    expect(getHiddenCheckbox(screen.container, 'a').getAttribute('value')).toBe('a')
    expect(screen.getByText('First option')).not.toBeNull()
  })

  it('supports indeterminate item state and icon for object items', async () => {
    const screen = render(() => (
      <CheckboxGroup
        legend="Mapped"
        items={[
          {
            value: 'a',
            label: 'Alpha',
            indeterminate: true,
            indeterminateIcon: <span data-testid="indeterminate-icon">I</span>,
          },
        ]}
      />
    ))

    const checkbox = screen.getByRole('checkbox', { name: 'Alpha' })
    const input = getHiddenCheckbox(screen.container, 'a')
    const control = screen.container.querySelector('[data-slot="checkbox-control"]')

    await waitFor(() => {
      expect(input.indeterminate).toBe(true)
      expect(input.checked).toBe(false)
      expectCheckboxChecked(checkbox, 'mixed')
      expect(control?.getAttribute('data-indeterminate')).not.toBeNull()
      expect(screen.getByTestId('indeterminate-icon').textContent).toBe('I')
    })
  })

  it('supports uncontrolled value changes', async () => {
    const onChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <CheckboxGroup items={['A', 'B']} defaultValue={['A']} onValueChange={onChange} />
    ))

    const checkboxA = screen.getByRole('checkbox', { name: 'A' })
    const checkboxB = screen.getByRole('checkbox', { name: 'B' })

    expectCheckboxChecked(checkboxA, true)
    expectCheckboxChecked(checkboxB, false)

    fireEvent.click(checkboxB)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith(['A', 'B'])
    expectCheckboxChecked(checkboxB, true)
  })

  it('toggles item with Space key', async () => {
    const onChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => <CheckboxGroup items={['A', 'B']} onValueChange={onChange} />)

    const checkboxA = screen.getByRole('checkbox', { name: 'A' })

    fireEvent.keyDown(checkboxA, { key: ' ' })
    fireEvent.keyUp(checkboxA, { key: ' ' })
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.click(checkboxA)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith(['A'])
    expectCheckboxChecked(checkboxA, true)

    fireEvent.keyDown(checkboxA, { key: ' ' })
    fireEvent.keyUp(checkboxA, { key: ' ' })
    fireEvent.click(checkboxA)

    expect(onChange).toHaveBeenCalledTimes(2)
    expect(onChange).toHaveBeenLastCalledWith([])
    expectCheckboxChecked(checkboxA, false)
  })

  it('emits Field focus and blur only at visual group boundaries', () => {
    const emit = vi.fn<(...args: Array<any>) => void>()
    const binding: FieldBinding = {
      emit,
      setValue: vi.fn<(...args: Array<any>) => void>(),
    }
    const screen = render(() => (
      <FieldProvider value={{ binding }}>
        <CheckboxGroup items={['A', 'B']} />
      </FieldProvider>
    ))
    const controls = screen.getAllByRole('checkbox')
    const first = controls[0]!
    const second = controls[1]!
    const hidden = getHiddenCheckbox(screen.container, 'A')
    const outside = document.createElement('button')

    fireEvent.focusIn(hidden, { relatedTarget: outside })
    fireEvent.focusOut(hidden, { relatedTarget: outside })
    expect(emit).not.toHaveBeenCalled()

    fireEvent.focusIn(first, { relatedTarget: outside })
    fireEvent.focusOut(first, { relatedTarget: second })
    fireEvent.focusIn(second, { relatedTarget: first })

    expect(emit).toHaveBeenCalledExactlyOnceWith('focus', expect.any(FocusEvent))

    fireEvent.focusOut(second, { relatedTarget: outside })

    expect(emit).toHaveBeenNthCalledWith(2, 'blur', expect.any(FocusEvent))
  })

  it('calls user onFocus once when focus enters the group and onBlur when it leaves', () => {
    const onFocus = vi.fn<(...args: Array<any>) => void>()
    const onBlur = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <CheckboxGroup items={['A', 'B']} onFocus={onFocus} onBlur={onBlur} />
    ))
    const controls = screen.getAllByRole('checkbox')
    const first = controls[0]!
    const second = controls[1]!
    const hidden = getHiddenCheckbox(screen.container, 'A')
    const outside = document.createElement('button')

    fireEvent.focusIn(hidden, { relatedTarget: outside })
    expect(onFocus).not.toHaveBeenCalled()

    fireEvent.focusIn(first, { relatedTarget: outside })
    expect(onFocus).toHaveBeenCalledTimes(1)

    fireEvent.focusOut(first, { relatedTarget: second })
    fireEvent.focusIn(second, { relatedTarget: first })
    expect(onFocus).toHaveBeenCalledTimes(1)
    expect(onBlur).not.toHaveBeenCalled()

    fireEvent.focusOut(second, { relatedTarget: outside })
    expect(onBlur).toHaveBeenCalledTimes(1)
  })

  it('keeps Formisch validation dormant while focus moves within a group', async () => {
    const schema = v.object({
      choices: v.pipe(v.array(v.string()), v.minLength(1, 'Choose an option.')),
    })
    const { screen, value: form } = renderWithOwner(
      () => createForm({ schema, initialInput: { choices: [] }, validate: 'blur' }),
      (form) => (
        <form.Form>
          <form.Field name="choices" label="Choices">
            <CheckboxGroup items={['A', 'B']} />
          </form.Field>
        </form.Form>
      ),
    )
    const controls = screen.getAllByRole('checkbox')
    const first = controls[0]!
    const second = controls[1]!
    const outside = document.createElement('button')

    fireEvent.focusIn(first, { relatedTarget: outside })
    expect(form.isTouched).toBe(true)

    fireEvent.focusOut(first, { relatedTarget: second })
    fireEvent.focusIn(second, { relatedTarget: first })

    expect(screen.queryByText('Choose an option.')).toBeNull()

    fireEvent.focusOut(second, { relatedTarget: outside })

    await waitFor(() => expect(screen.getByText('Choose an option.')).not.toBeNull())
    expect(second.getAttribute('aria-invalid')).toBe('true')
  })

  it('does not toggle disabled group or item', async () => {
    const onChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <CheckboxGroup
        disabled
        items={[
          'A',
          {
            value: 'B',
            label: 'B',
            disabled: true,
          },
        ]}
        onValueChange={onChange}
      />
    ))

    const checkboxA = screen.getByRole('checkbox', { name: 'A' })
    const checkboxB = screen.getByRole('checkbox', { name: 'B' })

    fireEvent.click(checkboxA)
    fireEvent.keyDown(checkboxB, { key: ' ' })

    expect(checkboxA.getAttribute('aria-disabled')).toBe('true')
    expect(checkboxB.getAttribute('aria-disabled')).toBe('true')
    expectCheckboxChecked(checkboxA, false)
    expectCheckboxChecked(checkboxB, false)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('does not toggle readonly items', async () => {
    const onChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => <CheckboxGroup items={['A']} readOnly onValueChange={onChange} />)

    const checkboxA = screen.getByRole('checkbox', { name: 'A' })

    expect(checkboxA.getAttribute('aria-readonly')).toBe('true')

    fireEvent.click(checkboxA)
    fireEvent.keyDown(checkboxA, { key: ' ' })

    expectCheckboxChecked(checkboxA, false)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('keeps controlled selection until parent updates', async () => {
    const onChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <CheckboxGroup items={['A', 'B']} value={['A']} onValueChange={onChange} />
    ))

    const checkboxA = screen.getByRole('checkbox', { name: 'A' })
    const checkboxB = screen.getByRole('checkbox', { name: 'B' })

    fireEvent.click(checkboxB)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith(['A', 'B'])

    await waitFor(() => {
      expectCheckboxChecked(checkboxA, true)
      expectCheckboxChecked(checkboxB, false)
    })
  })

  it('passes required and links legend to the fieldset', () => {
    const screen = render(() => (
      <CheckboxGroup
        id="channels"
        legend="Channels"
        items={[{ value: 'email', label: 'Email', description: 'Send email updates' }]}
        required
      />
    ))

    const fieldset = screen.container.querySelector(
      '[data-slot="checkbox-group-fieldset"]',
    ) as HTMLFieldSetElement
    const legend = screen.getByText('Channels')
    const checkbox = screen.getByRole('checkbox', { name: 'Email' })
    const input = getHiddenCheckbox(screen.container, 'email')
    const description = screen.getByText('Send email updates')

    expect(fieldset.getAttribute('aria-labelledby')).toBe(legend.getAttribute('id'))
    expect(checkbox.getAttribute('aria-required')).toBe('true')
    expect(input.getAttribute('required')).not.toBeNull()
    expect(checkbox.getAttribute('aria-describedby')).toContain(description.id)
  })

  it('treats required as at least one enabled selection', async () => {
    const screen = render(() => (
      <form>
        <CheckboxGroup name="channels" legend="Channels" items={['Email', 'SMS']} required />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const fieldset = screen.container.querySelector('[data-slot="checkbox-group-fieldset"]')!
    const inputs = Array.from(
      screen.container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
    )

    expect(fieldset.getAttribute('aria-required')).toBe('true')
    expect(inputs.filter((input) => input.required)).toHaveLength(1)
    expect(form.checkValidity()).toBe(false)

    fireEvent.click(screen.getByRole('checkbox', { name: 'SMS' }))

    expect(inputs.every((input) => !input.required)).toBe(true)
    expect(form.checkValidity()).toBe(true)
    expect(new FormData(form).getAll('channels')).toEqual(['SMS'])

    fireEvent.click(screen.getByRole('checkbox', { name: 'SMS' }))
    expect(inputs.filter((input) => input.required)).toHaveLength(1)
    expect(form.checkValidity()).toBe(false)
  })

  it('assigns required validity to the first enabled item and rejects stale selections', async () => {
    const [value, setValue] = createSignal(['missing'])
    const screen = render(() => (
      <form>
        <CheckboxGroup
          items={[
            { value: 'disabled', label: 'Disabled', disabled: true },
            { value: 'enabled', label: 'Enabled' },
          ]}
          value={value()}
          required
        />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const disabledInput = getHiddenCheckbox(screen.container, 'disabled')
    const enabledInput = getHiddenCheckbox(screen.container, 'enabled')

    expect(disabledInput.required).toBe(false)
    expect(enabledInput.required).toBe(true)
    expect(form.checkValidity()).toBe(false)

    flush(() => setValue(['enabled']))

    await waitFor(() => {
      expect(enabledInput.required).toBe(false)
      expect(form.checkValidity()).toBe(true)
    })
  })

  it('warns in DEV on duplicate item values and keeps item ids unique', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const first = { value: 'same', label: 'First' }
    const second = { value: 'same', label: 'Second' }
    const [items, setItems] = createSignal([first, second])
    const screen = render(() => <CheckboxGroup items={items()} />)
    const firstId = screen.getByRole('checkbox', { name: 'First' }).id
    const secondId = screen.getByRole('checkbox', { name: 'Second' }).id

    expect(firstId).not.toBe(secondId)
    expect(screen.getByText('First').getAttribute('for')).toBe(firstId)
    expect(screen.getByText('Second').getAttribute('for')).toBe(secondId)
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('CheckboxGroup received duplicate item value "same"'),
    )

    flush(() => setItems([second, first]))
    expect(screen.getByRole('checkbox', { name: 'First' }).id).toBe(firstId)
    expect(screen.getByRole('checkbox', { name: 'Second' }).id).toBe(secondId)

    warnSpy.mockRestore()
  })

  it('warns in DEV on duplicate primitive values and keeps item ids unique', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const screen = render(() => <CheckboxGroup items={['', '']} />)
    const controls = Array.from(
      screen.container.querySelectorAll<HTMLElement>('[data-slot="checkbox-control"]'),
    )

    expect(controls).toHaveLength(2)
    expect(controls[0]?.id).not.toBe(controls[1]?.id)
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('CheckboxGroup received duplicate item value ""'),
    )

    warnSpy.mockRestore()
  })

  it('renders one checkbox per item', () => {
    const screen = render(() => <CheckboxGroup items={['A', 'B']} variant="table" />)

    expect(screen.getAllByRole('checkbox')).toHaveLength(2)
  })

  it.each([
    ['table', true],
    ['list', false],
  ] as const)(
    'a click on the item root of a %s checkbox group toggles the item: %s',
    async (variant, toggles) => {
      const screen = render(() => <CheckboxGroup items={['A', 'B']} variant={variant} />)

      const checkboxA = screen.getByRole('checkbox', { name: 'A' })
      const items = screen.container.querySelectorAll<HTMLElement>(
        '[data-slot="checkbox-group-fieldset"] > [data-slot="checkbox-group-item"]',
      )

      fireEvent.click(items[0]!)

      await waitFor(() => {
        expect(checkboxA.getAttribute('aria-checked')).toBe(String(toggles))
      })
    },
  )

  it('applies item and checkbox class overrides to their slots', () => {
    const screen = render(() => (
      <CheckboxGroup
        items={['A']}
        variant="table"
        classes={{
          item: 'item-override',
          control: 'control-override',
          label: 'label-override',
        }}
      />
    ))

    const item = screen.container.querySelector('[data-slot="checkbox-group-item"]')
    const base = screen.container.querySelector('[data-slot="checkbox-control"]')
    const label = screen.container.querySelector('[data-slot="checkbox-label"]')

    expect(item?.classList.contains('item-override')).toBe(true)
    expect(base?.classList.contains('control-override')).toBe(true)
    expect(label?.classList.contains('label-override')).toBe(true)
  })

  it('applies style overrides to item and checkbox slots', () => {
    const screen = render(() => (
      <CheckboxGroup
        items={['A']}
        variant="table"
        styles={{
          item: { width: '200px' },
          control: { width: '200px' },
          label: { width: '200px' },
        }}
      />
    ))

    const item = screen.container.querySelector<HTMLElement>(
      '[data-slot="checkbox-group-fieldset"] > [data-slot="checkbox-group-item"]',
    )
    const base = screen.container.querySelector<HTMLElement>('[data-slot="checkbox-control"]')
    const label = screen.container.querySelector<HTMLElement>('[data-slot="checkbox-label"]')

    expect(item?.style.width).toBe('200px')
    expect(base?.style.width).toBe('200px')
    expect(label?.style.width).toBe('200px')
  })

  it('associates the hidden inputs with an external form through the form prop', async () => {
    const screen = render(() => (
      <>
        <form id="external-form" />
        <CheckboxGroup
          form="external-form"
          name="choices"
          items={['A', 'B']}
          defaultValue={['A']}
        />
      </>
    ))

    const externalForm = screen.container.querySelector<HTMLFormElement>('#external-form')!
    const inputs = screen.container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')

    expect(inputs.length).toBe(2)
    for (const input of inputs) {
      expect(input.getAttribute('form')).toBe('external-form')
      expect(input.form).toBe(externalForm)
    }
    expect(new FormData(externalForm).getAll('choices')).toEqual(['A'])

    fireEvent.click(screen.getByRole('checkbox', { name: 'B' }))
    expect(new FormData(externalForm).getAll('choices')).toEqual(['A', 'B'])

    externalForm.reset()
    await waitFor(() => {
      expect(new FormData(externalForm).getAll('choices')).toEqual(['A'])
    })
  })

  it('submits selected item values and resets to default selection', async () => {
    const screen = render(() => (
      <form>
        <CheckboxGroup name="choices" items={['A', 'B']} defaultValue={['A']} />
        <button type="reset">Reset</button>
      </form>
    ))

    const form = screen.container.querySelector('form') as HTMLFormElement
    const checkboxA = screen.getByRole('checkbox', { name: 'A' })
    const checkboxB = screen.getByRole('checkbox', { name: 'B' })

    expectCheckboxChecked(checkboxA, true)
    expectCheckboxChecked(checkboxB, false)
    expect(new FormData(form).getAll('choices')).toEqual(['A'])

    fireEvent.click(checkboxA)
    fireEvent.click(checkboxB)

    expect(new FormData(form).getAll('choices')).toEqual(['B'])

    form.reset()

    await waitFor(() => {
      expectCheckboxChecked(checkboxA, true)
      expectCheckboxChecked(checkboxB, false)
      expect(new FormData(form).getAll('choices')).toEqual(['A'])
    })
  })

  it('uses the initial default snapshot and preserves a controlled value on reset', async () => {
    const [defaultValue, setDefaultValue] = createSignal(['A'])
    const [controlledValue, setControlledValue] = createSignal<Array<string> | undefined>()
    const onChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <form>
        <CheckboxGroup
          items={['A', 'B']}
          defaultValue={defaultValue()}
          value={controlledValue()}
          onValueChange={onChange}
        />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement

    fireEvent.click(screen.getByRole('checkbox', { name: 'B' }))
    expectCheckboxChecked(screen.getByRole('checkbox', { name: 'B' }), true)

    flush(() => setDefaultValue(['B']))
    form.reset()
    await waitFor(() => {
      expectCheckboxChecked(screen.getByRole('checkbox', { name: 'A' }), true)
      expectCheckboxChecked(screen.getByRole('checkbox', { name: 'B' }), false)
    })

    flush(() => setControlledValue(['B']))
    form.reset()
    await waitFor(() => {
      expectCheckboxChecked(screen.getByRole('checkbox', { name: 'A' }), false)
      expectCheckboxChecked(screen.getByRole('checkbox', { name: 'B' }), true)
    })
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('synchronizes external controlled values into Field submission', async () => {
    const [value, setValue] = createSignal<Array<string>>([])
    const onSubmit = vi.fn<(...args: Array<any>) => void>()
    const { screen } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ choices: v.array(v.string()) }),
          initialInput: { choices: [] },
        }),
      (form) => (
        <form.Form onSubmit={onSubmit}>
          <form.Field name="choices" label="Choices">
            <CheckboxGroup items={['A', 'B']} value={value()} />
          </form.Field>
        </form.Form>
      ),
    )

    flush(() => setValue(['B']))
    fireEvent.submit(screen.container.querySelector('form')!)

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({ choices: ['B'] })
  })

  it('renders JSX icons for indeterminate items', () => {
    const screen = render(() => (
      <CheckboxGroup
        legend="Options"
        items={[{ value: 'a', label: 'Alpha', indeterminate: true }]}
        indeterminateIcon={<span>Mixed</span>}
      />
    ))

    expect(screen.getByRole('group', { name: 'Options' })).not.toBeNull()
    expect(screen.getByRole('checkbox', { name: 'Alpha' })).not.toBeNull()
    expect(screen.getByText('Mixed')).not.toBeNull()
  })

  it('renders the group checked icon only inside checked items', () => {
    const screen = render(() => (
      <CheckboxGroup
        items={['A', 'B']}
        defaultValue={['A']}
        checkedIcon={<span data-testid="group-checked-icon">C</span>}
      />
    ))
    const checkedIcons = screen.getAllByTestId('group-checked-icon')

    expect(checkedIcons).toHaveLength(1)
    expect(screen.getByRole('checkbox', { name: 'A' }).contains(checkedIcons[0]!)).toBe(true)
  })

  it('clicking an indeterminate item selects its value', () => {
    const onChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <CheckboxGroup
        items={[{ value: 'a', label: 'Alpha', indeterminate: true }]}
        onValueChange={onChange}
      />
    ))

    fireEvent.click(screen.getByRole('checkbox', { name: 'Alpha' }))

    expect(onChange).toHaveBeenCalledExactlyOnceWith(['a'])
  })
})
