import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { Form } from '../form'
import { useFormContext } from '../form/form-context'
import { RadioGroup } from '../radio-group'

import { FormField } from './form-field'
import { useFormField } from './form-field-context'

function FieldControl(props: { state?: { value: string }; id?: string }) {
  const field = useFormField(
    () => ({
      id: props.id,
    }),
    { deferInputValidation: true },
  )

  return (
    <input
      data-testid="control"
      id={field.id()}
      name={field.name()}
      aria-invalid={field.ariaAttrs()?.['aria-invalid'] ? 'true' : undefined}
      aria-describedby={field.ariaAttrs()?.['aria-describedby'] as string | undefined}
      onInput={(event) => {
        if (props.state) {
          props.state.value = event.currentTarget.value
        }
        field.emitFormInput()
      }}
      onChange={() => field.emitFormChange()}
      onBlur={() => field.emitFormBlur()}
      onFocus={() => field.emitFormFocus()}
    />
  )
}

function InputMetaView(props: { name: string }) {
  const formContext = useFormContext()

  return <output data-testid="meta-id">{formContext?.getInputMeta(props.name)?.id ?? ''}</output>
}

describe('FormField', () => {
  test('renders label, hint, description and help', () => {
    const screen = render(() => (
      <FormField label="Email" hint="Required" description="Use a valid email" help="Never shared">
        <FieldControl />
      </FormField>
    ))

    const label = screen.getByText('Email')
    const control = screen.getByTestId('control')

    expect(label.getAttribute('for')).toBe(control.getAttribute('id'))
    expect(screen.getByText('Required')).not.toBeNull()
    expect(screen.getByText('Use a valid email')).not.toBeNull()
    expect(screen.getByText('Never shared')).not.toBeNull()
  })

  test('supports explicit input id and form registration', async () => {
    const state = { value: '' }

    const screen = render(() => (
      <Form state={state} validate={() => []}>
        <FormField name="value" label="Value">
          <FieldControl id="custom-id" />
        </FormField>
        <InputMetaView name="value" />
      </Form>
    ))

    const label = screen.getByText('Value')

    await waitFor(() => {
      expect(label.getAttribute('for')).toBe('custom-id')
      expect(screen.getByTestId('meta-id').textContent).toBe('custom-id')
    })
  })

  test('wires aria-describedby and aria-invalid through form context', async () => {
    const state = { value: '' }

    const screen = render(() => (
      <Form
        state={state}
        validateOn={['blur']}
        validate={(currentState) => {
          if (currentState?.value !== 'valid') {
            return [{ name: 'value', message: 'Error message' }]
          }

          return []
        }}
      >
        <FormField
          name="value"
          label="Value"
          hint="Hint"
          description="Description"
          help="Help text"
        >
          <FieldControl state={state} />
        </FormField>
      </Form>
    ))

    const control = screen.getByTestId('control')
    await fireEvent.blur(control)

    const errorNode = await screen.findByText('Error message')
    const errorId = errorNode.getAttribute('id')!
    const ariaPrefix = errorId.replace(/-error$/, '')
    const describedBy = control.getAttribute('aria-describedby') ?? ''

    expect(control.getAttribute('aria-invalid')).toBe('true')
    expect(describedBy).toContain(`${ariaPrefix}-error`)
    expect(describedBy).toContain(`${ariaPrefix}-hint`)
    expect(describedBy).toContain(`${ariaPrefix}-description`)
    expect(describedBy).toContain(`${ariaPrefix}-help`)
  })

  test('does not throw outside form providers', () => {
    const screen = render(() => <FieldControl />)

    expect(screen.getByTestId('control')).not.toBeNull()
  })

  test('does not bind form-field label for grouped controls', () => {
    const state = { value: '' }

    const screen = render(() => (
      <Form state={state} validate={() => []}>
        <FormField name="value" label="Radio group">
          <RadioGroup id="plan-input" items={['Basic', 'Pro']} value={state.value} />
        </FormField>
      </Form>
    ))

    const label = screen.getByText('Radio group')
    expect(label.getAttribute('for')).toBeNull()
  })

  test('applies classes.root override', () => {
    const screen = render(() => (
      <FormField classes={{ root: 'root-override' }}>
        <FieldControl />
      </FormField>
    ))

    const root = screen.container.querySelector('[data-slot="root"]')
    expect(root?.className).toContain('root-override')
  })
})
