import { fireEvent, render, waitFor } from '@solidjs/testing-library'
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

  test('maps object items with valueKey, labelKey and descriptionKey', () => {
    const items = [{ meta: { key: 'a' }, title: 'Alpha', details: 'First option' }]
    const screen = render(() => (
      <CheckboxGroup
        items={items}
        valueKey="meta.key"
        labelKey="title"
        descriptionKey="details"
        legend="Mapped"
      />
    ))

    expect(screen.getByRole('checkbox', { name: 'Alpha' }).getAttribute('value')).toBe('a')
    expect(screen.getByText('First option')).not.toBeNull()
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

  test('applies orientation, table variant and size classes', () => {
    const screen = render(() => (
      <CheckboxGroup items={['A']} orientation="horizontal" variant="table" size="xl" />
    ))

    const fieldset = screen.container.querySelector('[data-slot="fieldset"]')
    const item = screen.container.querySelector('[data-slot="item"]')

    expect(fieldset?.className).toContain('flex-row')
    expect(item?.className).toContain('border')
    expect(item?.className).toContain('p-4.5')
  })

  test('toggles item when clicking checkbox root in table variant', async () => {
    const screen = render(() => <CheckboxGroup items={['A']} variant="table" />)

    const checkbox = screen.getByRole('checkbox', { name: 'A' }) as HTMLInputElement
    const item = screen.container.querySelector('[data-slot="item"]')
    const checkboxRoot = item?.querySelector('[data-slot="root"]') as HTMLElement

    expect(checkbox.checked).toBe(false)

    await fireEvent.click(checkboxRoot)

    await waitFor(() => {
      expect(checkbox.checked).toBe(true)
    })
  })

  test('applies classes.root on group and items', () => {
    const screen = render(() => (
      <CheckboxGroup
        classes={{ root: 'group-root-override' }}
        items={[
          {
            value: 'A',
            label: 'A',
            classes: {
              root: 'item-root-override',
              checkbox: {
                root: 'checkbox-root-override',
              },
            },
          },
        ]}
      />
    ))

    const root = screen.container.querySelector('[data-slot="root"]')
    const item = screen.container.querySelector('[data-slot="item"]')
    const checkboxRoot = item?.querySelector('[data-slot="root"]')

    expect(root?.className).toContain('group-root-override')
    expect(item?.className).toContain('item-root-override')
    expect(checkboxRoot?.className).toContain('checkbox-root-override')
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
})
