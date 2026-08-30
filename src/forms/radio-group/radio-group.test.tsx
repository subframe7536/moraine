import { getInput, setInput } from '@formisch/solid'
import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import * as v from 'valibot'
import { describe, expect, test, vi } from 'vitest'

import { renderWithOwner } from '../../test-utils/owner-render.tsx'
import { FormField } from '../form-field/index.ts'
import { createForm, Form } from '../form/index.ts'

import { RadioGroup } from './radio-group.tsx'

describe('RadioGroup', () => {
  test('renders radio options with form-field label and no legacy wrappers', () => {
    const screen = render(() => (
      <FormField label="Plan" description="Select one plan">
        <RadioGroup items={['Basic', 'Pro']} />
      </FormField>
    ))

    expect(screen.getByText('Plan')).not.toBeNull()
    expect(screen.getByRole<HTMLInputElement>('radio', { name: 'Basic' })).not.toBeNull()
    expect(screen.getByRole<HTMLInputElement>('radio', { name: 'Pro' })).not.toBeNull()

    const group = screen.getByRole('radiogroup')
    const label = screen.getByText('Plan')

    expect(label.getAttribute('for')).toBeNull()
    expect(group.getAttribute('aria-describedby')).toContain('description')
    expect(screen.container.querySelector('[data-slot="fieldset"]')).toBeNull()
    expect(screen.container.querySelector('[data-slot="legend"]')).toBeNull()
    expect(screen.container.querySelector('[data-slot="container"]')).not.toBeNull()
  })

  test('exposes required, disabled and readonly state through aria and data attributes', () => {
    const disabledScreen = render(() => <RadioGroup required disabled items={['Basic', 'Pro']} />)
    const disabledGroup = disabledScreen.getByRole('radiogroup')
    const disabledRadio = disabledScreen.getByRole<HTMLInputElement>('radio', { name: 'Basic' })
    const disabledControl = disabledScreen.container.querySelector('[data-slot="control"]')
    const disabledItem = disabledScreen.container.querySelector('[data-slot="item"]')

    expect(disabledGroup.getAttribute('aria-required')).toBe('true')
    expect(disabledGroup.getAttribute('aria-disabled')).toBe('true')
    expect(disabledGroup.getAttribute('data-required')).toBe('')
    expect(disabledGroup.getAttribute('data-disabled')).toBe('')
    expect(disabledRadio.required).toBe(true)
    expect(disabledRadio.disabled).toBe(true)
    expect(disabledRadio.getAttribute('aria-required')).toBe('true')
    expect(disabledRadio.getAttribute('aria-disabled')).toBe('true')
    expect(disabledControl?.getAttribute('data-required')).toBe('')
    expect(disabledControl?.getAttribute('data-disabled')).toBe('')
    expect(disabledItem?.getAttribute('data-disabled')).toBe('')
    expect(disabledItem?.className).toContain('data-disabled:effect-dis')

    disabledScreen.unmount()

    const readOnlyScreen = render(() => <RadioGroup readOnly items={['Basic']} />)
    const readOnlyGroup = readOnlyScreen.getByRole('radiogroup')
    const readOnlyRadio = readOnlyScreen.getByRole<HTMLInputElement>('radio', { name: 'Basic' })

    expect(readOnlyGroup.getAttribute('aria-readonly')).toBe('true')
    expect(readOnlyGroup.getAttribute('data-readonly')).toBe('')
    expect(readOnlyRadio.readOnly).toBe(true)
    expect(readOnlyRadio.getAttribute('aria-readonly')).toBe('true')
  })

  test('maps object items using default value/label/description fields', () => {
    const items = [{ value: 'pro', label: 'Pro', description: 'Best value' }]
    const screen = render(() => <RadioGroup items={items} />)

    const input = screen.container.querySelector('[data-slot="input"]')
    expect(input?.getAttribute('value')).toBe('pro')
    expect(screen.getByText('Best value')).not.toBeNull()
  })

  test('supports uncontrolled selection changes', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <RadioGroup items={['A', 'B']} defaultValue="A" onChange={onChange} />
    ))

    const radioA = screen.getByRole<HTMLInputElement>('radio', { name: 'A' })
    const radioB = screen.getByRole<HTMLInputElement>('radio', { name: 'B' })

    expect(radioA.checked).toBe(true)
    expect(radioB.checked).toBe(false)

    fireEvent.click(radioB)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith('B')
    expect(radioB.checked).toBe(true)
  })

  test('changes selection with keyboard navigation', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <RadioGroup items={['A', 'B', 'C']} defaultValue="A" onChange={onChange} />
    ))

    const radioA = screen.getByRole<HTMLInputElement>('radio', { name: 'A' })
    const radioB = screen.getByRole<HTMLInputElement>('radio', { name: 'B' })
    const radioC = screen.getByRole<HTMLInputElement>('radio', { name: 'C' })

    radioA.focus()

    fireEvent.keyDown(radioA, { key: 'ArrowDown' })
    expect(radioB.checked).toBe(true)

    fireEvent.keyDown(radioB, { key: 'End' })
    expect(radioC.checked).toBe(true)

    fireEvent.keyDown(radioC, { key: 'Home' })
    expect(radioA.checked).toBe(true)
    expect(onChange).toHaveBeenCalledWith('B')
    expect(onChange).toHaveBeenCalledWith('C')
    expect(onChange).toHaveBeenCalledWith('A')
  })

  test('selects with Space on keyup and ignores Enter', async () => {
    const onChange = vi.fn()
    const screen = render(() => <RadioGroup items={['A', 'B']} onChange={onChange} />)
    const radioA = screen.getByRole<HTMLInputElement>('radio', { name: 'A' })

    radioA.focus()
    const spaceDown = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: ' ' })
    radioA.dispatchEvent(spaceDown)

    expect(spaceDown.defaultPrevented).toBe(true)
    expect(onChange).not.toHaveBeenCalled()
    expect(radioA.checked).toBe(false)

    const spaceUp = new KeyboardEvent('keyup', { bubbles: true, cancelable: true, key: ' ' })
    radioA.dispatchEvent(spaceUp)

    expect(spaceUp.defaultPrevented).toBe(true)
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith('A')
    expect(radioA.checked).toBe(true)

    onChange.mockClear()
    const enter = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' })
    screen.getByRole<HTMLInputElement>('radio', { name: 'B' }).dispatchEvent(enter)

    expect(enter.defaultPrevented).toBe(false)
    expect(onChange).not.toHaveBeenCalled()
  })

  test('allows Shift+Arrow navigation and ignores Alt/Ctrl/Meta navigation', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <RadioGroup items={['A', 'B', 'C']} defaultValue="A" onChange={onChange} />
    ))
    const radioA = screen.getByRole<HTMLInputElement>('radio', { name: 'A' })
    const radioB = screen.getByRole<HTMLInputElement>('radio', { name: 'B' })

    radioA.focus()
    fireEvent.keyDown(radioA, { key: 'ArrowDown', shiftKey: true })
    expect(document.activeElement).toBe(radioB)
    expect(radioB.checked).toBe(true)

    for (const modifier of ['altKey', 'ctrlKey', 'metaKey'] as const) {
      const event = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'ArrowDown',
        [modifier]: true,
      })
      radioB.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(false)
      expect(document.activeElement).toBe(radioB)
    }
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  test('uses horizontal RTL direction and skips disabled items', async () => {
    const screen = render(() => (
      <RadioGroup
        dir="rtl"
        orientation="horizontal"
        defaultValue="A"
        items={['A', { value: 'B', label: 'B', disabled: true }, 'C']}
      />
    ))
    const radioA = screen.getByRole<HTMLInputElement>('radio', { name: 'A' })
    const radioC = screen.getByRole<HTMLInputElement>('radio', { name: 'C' })

    radioA.focus()
    fireEvent.keyDown(radioA, { key: 'ArrowLeft' })

    expect(document.activeElement).toBe(radioC)
    expect(radioC.checked).toBe(true)
  })

  test('assigns one roving tab stop for empty, stale, and all-disabled groups', () => {
    const empty = render(() => <RadioGroup items={[]} />)
    expect(empty.queryAllByRole('radio')).toHaveLength(0)
    empty.unmount()

    const stale = render(() => (
      <RadioGroup value="missing" items={[{ value: 'A', label: 'A', disabled: true }, 'B', 'C']} />
    ))
    const staleRadios = stale.getAllByRole('radio')
    expect(staleRadios.map((radio) => radio.getAttribute('tabindex'))).toEqual(['-1', '0', '-1'])
    stale.unmount()

    const disabled = render(() => <RadioGroup disabled items={['A', 'B']} />)
    expect(disabled.getAllByRole('radio').map((radio) => radio.getAttribute('tabindex'))).toEqual([
      '-1',
      '-1',
    ])
  })

  test('keeps controlled value until parent updates', async () => {
    const onChange = vi.fn()
    const screen = render(() => <RadioGroup items={['A', 'B']} value="A" onChange={onChange} />)

    const radioA = screen.getByRole<HTMLInputElement>('radio', { name: 'A' })
    const radioB = screen.getByRole<HTMLInputElement>('radio', { name: 'B' })

    fireEvent.click(radioB)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith('B')

    await waitFor(() => {
      expect(radioA.checked).toBe(true)
      expect(radioB.checked).toBe(false)
    })
  })

  test('synchronizes explicit controlled values with FormField and restores rejected DOM state', async () => {
    const [value, setValue] = createSignal('A')
    const onChange = vi.fn()
    const { screen, value: form } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ plan: v.string() }),
          initialInput: { plan: 'A' },
        }),
      (form) => (
        <Form of={form}>
          <FormField name="plan" label="Plan">
            <RadioGroup value={value()} items={['A', 'B']} onChange={onChange} />
          </FormField>
        </Form>
      ),
    )
    const radioA = screen.getByRole<HTMLInputElement>('radio', { name: 'A' })
    const radioB = screen.getByRole<HTMLInputElement>('radio', { name: 'B' })

    fireEvent.click(radioB)
    expect(onChange).toHaveBeenCalledWith('B')
    expect(radioA.checked).toBe(true)
    expect(radioB.checked).toBe(false)
    expect(getInput(form)).toEqual({ plan: 'A' })

    setValue('B')
    expect(radioB.checked).toBe(true)
    expect(getInput(form)).toEqual({ plan: 'B' })

    setInput(form, { path: ['plan'], input: 'A' })
    expect(radioB.checked).toBe(true)
    expect(getInput(form)).toEqual({ plan: 'B' })
  })

  test('reacts to external Formisch input without publishing callbacks', () => {
    const onChange = vi.fn()
    const { screen, value: form } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ plan: v.string() }),
          initialInput: { plan: 'A' },
        }),
      (form) => (
        <Form of={form}>
          <FormField name="plan" label="Plan">
            <RadioGroup items={['A', 'B']} onChange={onChange} />
          </FormField>
        </Form>
      ),
    )

    setInput(form, { path: ['plan'], input: 'B' })

    expect(screen.getByRole<HTMLInputElement>('radio', { name: 'B' }).checked).toBe(true)
    expect(onChange).not.toHaveBeenCalled()
  })

  test('uses unique item identity and canonicalizes duplicate values to the first item', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <form>
        <RadioGroup
          name="plan"
          defaultValue="same"
          items={[
            { value: 'same', label: 'First', description: 'First description' },
            { value: 'same', label: 'Second', description: 'Second description' },
          ]}
          onChange={onChange}
        />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const radios = screen.getAllByRole<HTMLInputElement>('radio')

    expect(new Set(radios.map((radio) => radio.id)).size).toBe(2)
    expect(radios.map((radio) => radio.checked)).toEqual([true, false])
    expect(new FormData(form).getAll('plan')).toEqual(['same'])

    radios[0]?.focus()
    fireEvent.keyDown(radios[0]!, { key: 'ArrowDown' })

    expect(document.activeElement).toBe(radios[1])
    expect(radios.map((radio) => radio.checked)).toEqual([true, false])
    expect(onChange).not.toHaveBeenCalled()
  })

  test('links item labels and descriptions while retaining FormField group messages', () => {
    const screen = render(() => (
      <FormField label="Plan" description="Choose one">
        <RadioGroup
          items={[
            { value: 'basic', label: 'Basic', description: 'Basic description' },
            { value: 'pro', label: 'Pro', description: 'Pro description' },
          ]}
        />
      </FormField>
    ))
    const group = screen.getByRole('radiogroup')
    const groupLabel = screen.getByText('Plan')
    const groupDescription = screen.getByText('Choose one')

    expect(group.getAttribute('aria-labelledby')).toBe(groupLabel.id)
    expect(group.getAttribute('aria-describedby')).toContain(groupDescription.id)

    for (const name of ['Basic', 'Pro']) {
      const radio = screen.getByRole<HTMLInputElement>('radio', { name })
      const itemDescription = screen.getByText(`${name} description`)
      expect(radio.getAttribute('aria-labelledby')).toBe(screen.getByText(name).id)
      expect(radio.getAttribute('aria-describedby')).toContain(itemDescription.id)
      expect(radio.getAttribute('aria-describedby')).toContain(groupDescription.id)
    }
  })

  test('moves focus to the next tab stop when a focused item is removed', async () => {
    const [items, setItems] = createSignal<(string | { value: string; label: string })[]>([
      'A',
      'B',
      'C',
    ])
    const screen = render(() => <RadioGroup value="B" items={items()} />)
    const radioB = screen.getByRole<HTMLInputElement>('radio', { name: 'B' })

    radioB.focus()
    setItems((current) => current.filter((item) => item !== 'B'))
    await Promise.resolve()

    expect(document.activeElement).toBe(screen.getByRole<HTMLInputElement>('radio', { name: 'A' }))
  })

  test('applies horizontal table layout classes', () => {
    const screen = render(() => (
      <RadioGroup items={['A', 'B']} orientation="horizontal" variant="table" size="lg" />
    ))

    const group = screen.getByRole('radiogroup')
    const firstItem = screen.container.querySelector('[data-slot="item"]')
    const firstInput = screen.container.querySelector('[data-slot="input"]')
    const firstContainer = screen.container.querySelector('[data-slot="container"]')
    const firstBase = screen.container.querySelector('[data-slot="control"]')

    expect(group.className).toContain('flex-row')
    expect(group.className).not.toContain('flex-wrap')
    expect(firstItem?.className).toContain('p-4')
    expect(firstItem?.className).toContain('first-of-type:rounded-s-lg')
    expect(firstItem?.className).toContain('last-of-type:rounded-e-lg')
    expect(firstItem?.className).toContain('not-first-of-type:-ms-px')
    expect(firstInput?.className).toContain('peer')
    expect(firstContainer?.className).toContain('h-5')
    expect(firstBase?.className).toContain('peer-focus-visible:effect-fv-border')
  })

  test('uses block labels for balanced list alignment', () => {
    const screen = render(() => (
      <RadioGroup
        items={[{ value: 'starter', label: 'Starter', description: 'For personal projects' }]}
      />
    ))

    expect(screen.getByText('Starter').className).toContain('block')
  })

  test('applies vertical table layout classes', () => {
    const screen = render(() => <RadioGroup items={['A', 'B']} variant="table" size="lg" />)

    const group = screen.getByRole('radiogroup')
    const firstItem = screen.container.querySelector('[data-slot="item"]')

    expect(group.className).toContain('flex-col')
    expect(firstItem?.className).toContain('first-of-type:rounded-t-lg')
    expect(firstItem?.className).toContain('last-of-type:rounded-b-lg')
    expect(firstItem?.className).toContain('not-first-of-type:-mt-px')
  })

  test.each(['card', 'table'] as const)(
    'marks the selected %s item for state styles',
    async (variant) => {
      const screen = render(() => (
        <RadioGroup items={['A', 'B']} variant={variant} defaultValue="A" />
      ))
      const items = screen.container.querySelectorAll('[data-slot="item"]')
      const firstItem = items[0]!
      const secondItem = items[1]!

      expect(items).toHaveLength(2)
      expect(firstItem.getAttribute('data-checked')).toBe('')
      expect(secondItem.getAttribute('data-checked')).toBeNull()

      fireEvent.click(secondItem)

      await waitFor(() => {
        expect(firstItem.getAttribute('data-checked')).toBeNull()
        expect(secondItem.getAttribute('data-checked')).toBe('')
      })
    },
  )

  test('raises the selected table item above adjacent rows', () => {
    const screen = render(() => <RadioGroup items={['A', 'B']} variant="table" defaultValue="A" />)
    const selectedItem = screen.container.querySelector('[data-slot="item"]')

    expect(selectedItem?.className).toContain('z-base')
  })

  test('prevents the default radio control from shrinking into an oval', () => {
    const screen = render(() => <RadioGroup items={['A']} defaultValue="A" />)
    const control = screen.container.querySelector('[data-slot="control"]')
    const indicator = screen.container.querySelector('[data-slot="indicator"]')

    expect(control?.className).toContain('rounded-full')
    expect(control?.className).toContain('size-4')
    expect(control?.className).toContain('shrink-0')
    expect(indicator?.className).toContain('size-2')
  })

  test('selects option when clicking table item container', async () => {
    const screen = render(() => <RadioGroup items={['A', 'B']} variant="table" defaultValue="A" />)

    const radioA = screen.getByRole<HTMLInputElement>('radio', { name: 'A' })
    const radioB = screen.getByRole<HTMLInputElement>('radio', { name: 'B' })
    const items = screen.container.querySelectorAll('[data-slot="item"]')

    expect(radioA.checked).toBe(true)
    expect(radioB.checked).toBe(false)

    fireEvent.click(items[1] as HTMLElement)

    await waitFor(() => {
      expect(radioA.checked).toBe(false)
      expect(radioB.checked).toBe(true)
    })
  })

  test('respects canceled group clicks and nested interactive label descendants', async () => {
    const onChange = vi.fn()
    const canceled = render(() => (
      <RadioGroup
        variant="card"
        items={['A', 'B']}
        onClick={(event: MouseEvent) => event.preventDefault()}
        onChange={onChange}
      />
    ))

    fireEvent.click(canceled.container.querySelectorAll('[data-slot="item"]')[1]!)
    expect(onChange).not.toHaveBeenCalled()
    canceled.unmount()

    const nested = render(() => (
      <RadioGroup
        variant="card"
        items={[{ value: 'A', label: <button type="button">Details</button> }]}
        onChange={onChange}
      />
    ))
    fireEvent.click(nested.getByRole('button', { name: 'Details' }))
    expect(onChange).not.toHaveBeenCalled()
  })

  test('preserves native FormData, required validity, readonly submission, and reset snapshots', async () => {
    const [defaultValue, setDefaultValue] = createSignal('A')
    const onChange = vi.fn()
    const screen = render(() => (
      <form>
        <RadioGroup
          name="plan"
          required
          defaultValue={defaultValue()}
          items={['A', 'B']}
          onChange={onChange}
        />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const radioA = screen.getByRole<HTMLInputElement>('radio', { name: 'A' })
    const radioB = screen.getByRole<HTMLInputElement>('radio', { name: 'B' })

    expect(form.checkValidity()).toBe(true)
    expect(new FormData(form).getAll('plan')).toEqual(['A'])
    setDefaultValue('B')
    fireEvent.click(radioB)
    expect(new FormData(form).getAll('plan')).toEqual(['B'])

    form.reset()
    await Promise.resolve()

    expect(radioA.checked).toBe(true)
    expect(radioB.checked).toBe(false)
    expect(new FormData(form).getAll('plan')).toEqual(['A'])
    expect(onChange).toHaveBeenCalledTimes(1)

    screen.unmount()
    const empty = render(() => (
      <form>
        <RadioGroup name="required-plan" required items={['A', 'B']} />
      </form>
    ))
    expect((empty.container.querySelector('form') as HTMLFormElement).checkValidity()).toBe(false)
    empty.unmount()

    const readOnly = render(() => (
      <form>
        <RadioGroup name="readonly-plan" readOnly defaultValue="A" items={['A', 'B']} />
      </form>
    ))
    expect(new FormData(readOnly.container.querySelector('form')!).getAll('readonly-plan')).toEqual(
      ['A'],
    )
  })

  test('does not select option when clicking list item container', async () => {
    const screen = render(() => <RadioGroup items={['A', 'B']} defaultValue="A" />)

    const radioA = screen.getByRole<HTMLInputElement>('radio', { name: 'A' })
    const radioB = screen.getByRole<HTMLInputElement>('radio', { name: 'B' })
    const items = screen.container.querySelectorAll('[data-slot="item"]')

    expect(radioA.checked).toBe(true)
    expect(radioB.checked).toBe(false)

    fireEvent.click(items[1] as HTMLElement)

    await waitFor(() => {
      expect(radioA.checked).toBe(true)
      expect(radioB.checked).toBe(false)
    })
  })

  test('sets aria-readonly and prevents changes when readOnly', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <RadioGroup items={['Dogs', 'Cats', 'Dragons']} readOnly onChange={onChange} />
    ))

    const group = screen.getByRole('radiogroup')
    const dragons = screen.getByRole<HTMLInputElement>('radio', { name: 'Dragons' })

    expect(group.getAttribute('aria-readonly')).toBe('true')
    expect(dragons.checked).toBe(false)

    fireEvent.click(dragons)

    expect(dragons.checked).toBe(false)
    expect(onChange).not.toHaveBeenCalled()
  })

  test('applies style overrides to item and radio slots', () => {
    const screen = render(() => (
      <RadioGroup
        items={['A']}
        styles={{
          item: { width: '200px' },
          control: { width: '200px' },
          label: { width: '200px' },
        }}
      />
    ))

    const item = screen.container.querySelector<HTMLElement>('[data-slot="item"]')
    const base = screen.container.querySelector<HTMLElement>('[data-slot="control"]')
    const label = screen.container.querySelector<HTMLElement>('[data-slot="label"]')

    expect(item?.style.width).toBe('200px')
    expect(base?.style.width).toBe('200px')
    expect(label?.style.width).toBe('200px')
  })
})
