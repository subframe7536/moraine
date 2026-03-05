import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { Form } from '../form'
import { useFormContext } from '../form/form-context'
import { RadioGroup } from '../radio-group'

import { FormField } from './form-field'
import type { FormFieldRenderProps } from './form-field'
import { useFormField } from './form-field-context'

function FieldControl(props: {
  state?: { value: string }
  id?: string
  bind?: boolean
  testId?: string
}) {
  const field = useFormField(
    () => ({
      id: props.id,
    }),
    () => ({
      bind: props.bind,
      deferInputValidation: true,
      defaultId: 'field-control-default-id',
      defaultSize: 'md',
    }),
  )

  return (
    <input
      data-testid={props.testId ?? 'control'}
      id={field.id()}
      name={field.name()}
      aria-invalid={field.ariaAttrs()['aria-invalid'] ? 'true' : undefined}
      aria-describedby={field.ariaAttrs()['aria-describedby'] as string | undefined}
      onInput={(event) => {
        if (props.state) {
          props.state.value = event.currentTarget.value
        }
        field.emit('input')
      }}
      onChange={() => field.emit('change')}
      onBlur={() => field.emit('blur')}
      onFocus={() => field.emit('focus')}
    />
  )
}

function FieldMetaProbe(props: { id?: string; size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' }) {
  const field = useFormField(
    () => ({
      id: props.id,
      size: props.size,
    }),
    () => ({
      defaultId: 'meta-default-id',
      defaultSize: 'md',
    }),
  )

  return (
    <output
      data-testid="meta-probe"
      data-id={field.id()}
      data-size={field.size()}
      data-invalid={String(field.invalid())}
      data-aria-key-count={String(Object.keys(field.ariaAttrs()).length)}
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

  test('returns defaults outside providers', () => {
    const screen = render(() => <FieldMetaProbe />)
    const probe = screen.getByTestId('meta-probe')

    expect(probe.getAttribute('data-id')).toBe('meta-default-id')
    expect(probe.getAttribute('data-size')).toBe('md')
    expect(probe.getAttribute('data-invalid')).toBe('false')
    expect(probe.getAttribute('data-aria-key-count')).toBe('0')
  })

  test('id prop takes priority over context and defaults', () => {
    const screen = render(() => (
      <FormField id="form-field-id">
        <FieldMetaProbe id="explicit-id" />
      </FormField>
    ))

    expect(screen.getByTestId('meta-probe').getAttribute('data-id')).toBe('explicit-id')
  })

  test('size prop takes priority over context and defaults', () => {
    const screen = render(() => (
      <FormField size="lg">
        <FieldMetaProbe size="xl" />
      </FormField>
    ))

    expect(screen.getByTestId('meta-probe').getAttribute('data-size')).toBe('xl')
  })

  test('invalid reflects form field error state', () => {
    const screen = render(() => (
      <FormField error="Error">
        <FieldMetaProbe />
      </FormField>
    ))

    expect(screen.getByTestId('meta-probe').getAttribute('data-invalid')).toBe('true')
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

  test('binds label to last bind=true control', () => {
    const screen = render(() => (
      <FormField label="Multi control">
        <FieldControl id="first-control" bind testId="first-control" />
        <FieldControl id="second-control" bind testId="second-control" />
      </FormField>
    ))

    const label = screen.getByText('Multi control')
    expect(label.getAttribute('for')).toBe('second-control')
  })

  test('does not bind label when all registered controls bind=false', () => {
    const screen = render(() => (
      <FormField label="Unbound controls">
        <FieldControl id="first-control" bind={false} testId="first-control" />
        <FieldControl id="second-control" bind={false} testId="second-control" />
      </FormField>
    ))

    const label = screen.getByText('Unbound controls')
    expect(label.getAttribute('for')).toBeNull()
  })

  test('falls back to form-field identity id when no controls are registered', () => {
    const screen = render(() => (
      <FormField id="fallback-form-field-id" label="Standalone label">
        <div data-testid="placeholder" />
      </FormField>
    ))

    const label = screen.getByText('Standalone label')
    expect(label.getAttribute('for')).toBe('fallback-form-field-id')
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

  test('supports array name prop', async () => {
    const state = { user: { email: '' } }

    const screen = render(() => (
      <Form state={state} validate={() => [{ name: ['user', 'email'], message: 'Email required' }]}>
        <FormField name={['user', 'email']} label="Email">
          <FieldControl state={{ value: '' }} />
        </FormField>
      </Form>
    ))

    const form = screen.container.querySelector('form') as HTMLFormElement
    await fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText('Email required')).not.toBeNull()
    })
  })

  test('supports children render prop with error injection', async () => {
    const state = { value: '' }
    const renderChildren = vi.fn((props: FormFieldRenderProps) => (
      <>
        <output data-testid="field-render-error">{String(props.error ?? '')}</output>
        <FieldControl state={state} />
      </>
    ))

    const screen = render(() => (
      <Form state={state} validate={() => [{ name: 'value', message: 'Error message' }]}>
        <FormField name="value" label="Value">
          {renderChildren}
        </FormField>
      </Form>
    ))

    await fireEvent.submit(screen.container.querySelector('form') as HTMLFormElement)

    await waitFor(() => {
      expect(screen.getByTestId('field-render-error').textContent).toBe('Error message')
    })

    expect(renderChildren).toHaveBeenCalled()
    expect(renderChildren.mock.calls.some(([props]) => props?.error === 'Error message')).toBe(true)
  })

  test('supports children render prop without params', () => {
    const renderChildren = vi.fn(() => <div data-testid="field-no-arg-children">No args</div>)

    const screen = render(() => <FormField>{renderChildren}</FormField>)

    expect(screen.getByTestId('field-no-arg-children')).not.toBeNull()
    expect(renderChildren).toHaveBeenCalled()
  })
})
