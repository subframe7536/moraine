import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import * as v from 'valibot'
import { describe, expect, test, vi } from 'vitest'

import { Form } from '../form'
import { FormField } from '../form-field'

import { CheckboxGroup } from './checkbox-group'

describe('CheckboxGroup', () => {
  test('renders legend and primitive items', () => {
    const screen = render(() => <CheckboxGroup legend="Fruits" items={['Apple', 'Banana']} />)

    expect(screen.getByText('Fruits')).not.toBeNull()
    expect(screen.getByRole('checkbox', { name: 'Apple' })).not.toBeNull()
    expect(screen.getByRole('checkbox', { name: 'Banana' })).not.toBeNull()
  })

  test('maps object items using default value/label/description fields', () => {
    const items = [{ value: 'a', label: 'Alpha', description: 'First option' }]
    const screen = render(() => <CheckboxGroup items={items} legend="Mapped" />)

    expect(screen.getByRole('checkbox', { name: 'Alpha' }).getAttribute('value')).toBe('a')
    expect(screen.getByText('First option')).not.toBeNull()
  })

  test('supports indeterminate item state and icon for object items', async () => {
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

    const checkbox = screen.getByRole('checkbox', { name: 'Alpha' }) as HTMLInputElement
    const item = screen.container.querySelector('[data-slot="fieldset"] > [data-slot="root"]')

    await waitFor(() => {
      expect(checkbox.indeterminate).toBe(true)
      expect(checkbox.checked).toBe(false)
      expect(item?.getAttribute('data-indeterminate')).not.toBeNull()
      expect(screen.getByTestId('indeterminate-icon').textContent).toBe('I')
    })
  })

  test('supports uncontrolled value changes', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <CheckboxGroup items={['A', 'B']} defaultValue={['A']} onChange={onChange} />
    ))

    const checkboxA = screen.getByRole('checkbox', { name: 'A' }) as HTMLInputElement
    const checkboxB = screen.getByRole('checkbox', { name: 'B' }) as HTMLInputElement

    expect(checkboxA.checked).toBe(true)
    expect(checkboxB.checked).toBe(false)

    await fireEvent.click(checkboxB)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith(['A', 'B'])
    expect(checkboxB.checked).toBe(true)
  })

  test('keeps controlled selection until parent updates', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <CheckboxGroup items={['A', 'B']} value={['A']} onChange={onChange} />
    ))

    const checkboxA = screen.getByRole('checkbox', { name: 'A' }) as HTMLInputElement
    const checkboxB = screen.getByRole('checkbox', { name: 'B' }) as HTMLInputElement

    await fireEvent.click(checkboxB)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith(['A', 'B'])

    await waitFor(() => {
      expect(checkboxA.checked).toBe(true)
      expect(checkboxB.checked).toBe(false)
    })
  })

  test('integrates with form-field validation aria attributes', async () => {
    const state = { choices: [] as string[] }

    const screen = render(() => (
      <Form
        state={state}
        validateOnInputDelay={0}
        validate={(currentState) => {
          if ((currentState?.choices as string[] | undefined)?.length) {
            return []
          }

          return [{ name: 'choices', message: 'Select at least one' }]
        }}
      >
        <FormField name="choices" label="Choices">
          <CheckboxGroup
            items={['A', 'B']}
            value={state.choices}
            onChange={(nextValue) => {
              state.choices = nextValue
            }}
          />
        </FormField>
      </Form>
    ))

    await fireEvent.submit(screen.container.querySelector('form') as HTMLFormElement)

    await waitFor(() => {
      expect(screen.getByText('Select at least one')).not.toBeNull()
    })

    const fieldset = screen.container.querySelector('[data-slot="fieldset"]')
    expect(fieldset?.getAttribute('aria-invalid')).toBe('true')

    const checkboxA = screen.getByRole('checkbox', { name: 'A' })
    await fireEvent.click(checkboxA)

    await waitFor(() => {
      expect(screen.queryByText('Select at least one')).toBeNull()
    })
  })

  test('applies horizontal table layout classes', () => {
    const screen = render(() => (
      <CheckboxGroup items={['A', 'B']} orientation="horizontal" variant="table" size="xl" />
    ))

    const fieldset = screen.container.querySelector('[data-slot="fieldset"]')
    const item = screen.container.querySelector('[data-slot="fieldset"] > [data-slot="root"]')

    expect(fieldset?.className).toContain('flex-row')
    expect(item?.className).toContain('border')
    expect(item?.className).toContain('rounded-none')
    expect(item?.className).toContain('p-4.5')
    expect(item?.className).toContain('first-of-type:rounded-s-lg')
    expect(item?.className).toContain('last-of-type:rounded-e-lg')
    expect(item?.className).toContain('not-first-of-type:-ms-px')
  })

  test('applies vertical table layout classes', () => {
    const screen = render(() => <CheckboxGroup items={['A', 'B']} variant="table" size="xl" />)

    const fieldset = screen.container.querySelector('[data-slot="fieldset"]')
    const item = screen.container.querySelector('[data-slot="fieldset"] > [data-slot="root"]')

    expect(fieldset?.className).toContain('flex-col')
    expect(item?.className).toContain('first-of-type:rounded-t-lg')
    expect(item?.className).toContain('last-of-type:rounded-b-lg')
    expect(item?.className).toContain('not-first-of-type:-mt-px')
  })

  test('renders checkbox items as direct fieldset children', () => {
    const screen = render(() => <CheckboxGroup items={['A', 'B']} variant="table" />)

    const directItems = screen.container.querySelectorAll(
      '[data-slot="fieldset"] > [data-slot="root"]',
    )

    expect(directItems).toHaveLength(2)
    expect(
      screen.container.querySelector(
        '[data-slot="fieldset"] > [data-slot="root"] [data-slot="root"]',
      ),
    ).toBeNull()
  })

  test('toggles item when clicking table item root', async () => {
    const screen = render(() => <CheckboxGroup items={['A']} variant="table" />)

    const checkbox = screen.getByRole('checkbox', { name: 'A' }) as HTMLInputElement
    const item = screen.container.querySelector('[data-slot="fieldset"] > [data-slot="root"]')

    expect(checkbox.checked).toBe(false)

    await fireEvent.click(item as HTMLElement)

    await waitFor(() => {
      expect(checkbox.checked).toBe(true)
    })
  })

  test('does not toggle item when clicking list item root', async () => {
    const screen = render(() => <CheckboxGroup items={['A', 'B']} defaultValue={['A']} />)

    const checkboxA = screen.getByRole('checkbox', { name: 'A' }) as HTMLInputElement
    const checkboxB = screen.getByRole('checkbox', { name: 'B' }) as HTMLInputElement
    const items = screen.container.querySelectorAll('[data-slot="fieldset"] > [data-slot="root"]')

    expect(checkboxA.checked).toBe(true)
    expect(checkboxB.checked).toBe(false)

    await fireEvent.click(items[1] as HTMLElement)

    await waitFor(() => {
      expect(checkboxA.checked).toBe(true)
      expect(checkboxB.checked).toBe(false)
    })
  })

  test('applies flattened classes to item and checkbox slots', () => {
    const screen = render(() => (
      <CheckboxGroup
        items={['A']}
        variant="table"
        classes={{
          item: 'item-override',
          base: 'base-override',
          label: 'label-override',
        }}
      />
    ))

    const item = screen.container.querySelector('[data-slot="fieldset"] > [data-slot="root"]')
    const base = screen.container.querySelector('[data-slot="base"]')
    const label = screen.container.querySelector('[data-slot="label"]')

    expect(item?.className).toContain('item-override')
    expect(base?.className).toContain('base-override')
    expect(label?.className).toContain('label-override')
  })

  test('applies style overrides to item and checkbox slots', () => {
    const screen = render(() => (
      <CheckboxGroup
        items={['A']}
        variant="table"
        styles={
          {
            root: { width: '200px' },
            base: { width: '200px' },
            label: { width: '200px' },
          } as any
        }
      />
    ))

    const item = screen.container.querySelector(
      '[data-slot="fieldset"] > [data-slot="root"]',
    ) as HTMLElement | null
    const base = screen.container.querySelector('[data-slot="base"]') as HTMLElement | null
    const label = screen.container.querySelector('[data-slot="label"]') as HTMLElement | null

    expect(item?.style.width).toBe('200px')
    expect(base?.style.width).toBe('200px')
    expect(label?.style.width).toBe('200px')
  })

  test('validates on change when validateOn is change', async () => {
    const state = { choices: [] as string[] }

    const screen = render(() => (
      <Form
        state={state}
        validateOn={['change']}
        validateOnInputDelay={0}
        validate={(currentState) => {
          if ((currentState?.choices as string[] | undefined)?.includes('B')) {
            return []
          }

          return [{ name: 'choices', message: 'Select B' }]
        }}
      >
        <FormField name="choices" label="Choices">
          <CheckboxGroup
            id="choices-input"
            items={['A', 'B']}
            defaultValue={state.choices}
            onChange={(nextValue) => {
              state.choices = nextValue
            }}
          />
        </FormField>
      </Form>
    ))

    const checkboxA = screen.container.querySelector(
      'input[type="checkbox"][value="A"]',
    ) as HTMLInputElement
    const checkboxB = screen.container.querySelector(
      'input[type="checkbox"][value="B"]',
    ) as HTMLInputElement
    expect(checkboxA).not.toBeNull()
    expect(checkboxB).not.toBeNull()

    await fireEvent.click(checkboxA)
    await waitFor(() => {
      expect(screen.getByText('Select B')).not.toBeNull()
    })

    await fireEvent.click(checkboxB)
    await waitFor(() => {
      expect(screen.queryByText('Select B')).toBeNull()
    })
  })

  test('validates on input when validateOn is input', async () => {
    const state = { choices: [] as string[] }

    const screen = render(() => (
      <Form
        state={state}
        validateOn={['input']}
        validateOnInputDelay={0}
        validate={(currentState) => {
          if ((currentState?.choices as string[] | undefined)?.includes('B')) {
            return []
          }

          return [{ name: 'choices', message: 'Select B' }]
        }}
      >
        <FormField name="choices" label="Choices">
          <CheckboxGroup
            id="choices-input"
            items={['A', 'B']}
            defaultValue={state.choices}
            onChange={(nextValue) => {
              state.choices = nextValue
            }}
          />
        </FormField>
      </Form>
    ))

    const checkboxA = screen.container.querySelector(
      'input[type="checkbox"][value="A"]',
    ) as HTMLInputElement
    const checkboxB = screen.container.querySelector(
      'input[type="checkbox"][value="B"]',
    ) as HTMLInputElement
    expect(checkboxA).not.toBeNull()
    expect(checkboxB).not.toBeNull()

    await fireEvent.click(checkboxA)
    await waitFor(() => {
      expect(screen.getByText('Select B')).not.toBeNull()
    })

    await fireEvent.click(checkboxB)
    await waitFor(() => {
      expect(screen.queryByText('Select B')).toBeNull()
    })
  })

  test('does not bind form-field label for grouped controls', () => {
    const state = { choices: [] as string[] }

    const screen = render(() => (
      <Form state={state} validate={() => []}>
        <FormField name="choices" label="Checkbox group">
          <CheckboxGroup id="choices-input" items={['A', 'B']} defaultValue={state.choices} />
        </FormField>
      </Form>
    ))

    const label = screen.getByText('Checkbox group')
    expect(label.getAttribute('for')).toBeNull()
  })

  test('keeps array shape for schema validation after selecting item', async () => {
    const schema = v.object({
      channels: v.pipe(v.array(v.string()), v.nonEmpty('Select at least one release channel.')),
    })

    const screen = render(() => (
      <Form schema={schema}>
        <FormField name="channels" label="Release Channels">
          <CheckboxGroup items={['A', 'B']} variant="table" />
        </FormField>
      </Form>
    ))

    const form = screen.container.querySelector('form') as HTMLFormElement

    await fireEvent.submit(form)
    await waitFor(() => {
      expect(screen.getByText('Select at least one release channel.')).not.toBeNull()
    })

    await fireEvent.click(screen.getByRole('checkbox', { name: 'A' }))
    await waitFor(() => {
      expect(screen.queryByText('Select at least one release channel.')).toBeNull()
    })

    expect(screen.queryByText('Invalid type: Expected Array but received true')).toBeNull()
  })
})
