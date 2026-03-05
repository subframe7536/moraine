import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { onMount, untrack } from 'solid-js'
import * as v from 'valibot'
import { describe, expect, test, vi } from 'vitest'

import { Checkbox } from '../checkbox'
import { FormField } from '../form-field'
import { useFormField } from '../form-field/form-field-context'
import { Input } from '../input'
import { RadioGroup } from '../radio-group'
import { Select } from '../select'
import type { SelectOption } from '../select/select'

import type { FormRenderProps, FormSubmitEvent } from './form'
import { Form } from './form'
import { useFormContext } from './form-context'

interface TestState {
  value: string
}

function TestInput(props: { state: TestState; deferInputValidation?: boolean }) {
  const field = useFormField(undefined, () => ({
    deferInputValidation: untrack(() => props.deferInputValidation),
    defaultId: 'test-input-default-id',
    defaultSize: 'md',
  }))

  return (
    <input
      data-testid="input"
      id={field.id()}
      name={field.name()}
      data-touched={String(field.runtimeState().touched)}
      data-dirty={String(field.runtimeState().dirty)}
      data-focused={String(field.runtimeState().focused)}
      data-validating={String(field.runtimeState().validating)}
      aria-invalid={field.ariaAttrs()['aria-invalid'] ? 'true' : undefined}
      aria-describedby={field.ariaAttrs()['aria-describedby'] as string | undefined}
      onInput={(event) => {
        props.state.value = event.currentTarget.value
        field.emit('input')
      }}
      onChange={() => field.emit('change')}
      onBlur={() => field.emit('blur')}
      onFocus={() => field.emit('focus')}
    />
  )
}

function TestInputWithoutExternalState() {
  const field = useFormField(undefined, () => ({
    defaultId: 'test-input-uncontrolled-default-id',
    defaultSize: 'md',
    initialValue: '',
  }))

  return (
    <input
      data-testid="input-uncontrolled"
      id={field.id()}
      name={field.name()}
      onInput={(event) => {
        field.setFormValue(event.currentTarget.value)
        field.emit('input')
      }}
      onChange={() => field.emit('change')}
      onBlur={() => field.emit('blur')}
      onFocus={() => field.emit('focus')}
    />
  )
}

function SetErrorsOnMount() {
  const formContext = useFormContext()

  onMount(() => {
    formContext?.setErrors([{ name: 'value', message: 'Manual error' }])
  })

  return null
}

describe('Form', () => {
  const roleOptions: SelectOption[] = [
    { label: 'Developer', value: 'developer' },
    { label: 'Designer', value: 'designer' },
  ]

  test('emits error on submit when validation fails', async () => {
    const state: TestState = { value: '' }
    const onSubmit = vi.fn()
    const onError = vi.fn()

    const screen = render(() => (
      <Form
        state={state}
        validateOnInputDelay={0}
        validate={(currentState) => {
          if (currentState?.value !== 'valid') {
            return [{ name: 'value', message: 'Error message' }]
          }

          return []
        }}
        onSubmit={onSubmit}
        onError={onError}
      >
        <FormField name="value" label="Value">
          <TestInput state={state} />
        </FormField>
      </Form>
    ))

    await fireEvent.submit(screen.container.querySelector('form') as HTMLFormElement)

    await waitFor(() => {
      expect(onError).toHaveBeenCalledTimes(1)
    })
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('Error message')).not.toBeNull()
  })

  test('input validation is deferred until blur when not eager', async () => {
    const state: TestState = { value: '' }

    const screen = render(() => (
      <Form
        state={state}
        validateOn={['input']}
        validateOnInputDelay={0}
        validate={(currentState) => {
          if (currentState?.value !== 'valid') {
            return [{ name: 'value', message: 'Error message' }]
          }

          return []
        }}
      >
        <FormField name="value" label="Value">
          <TestInput state={state} deferInputValidation />
        </FormField>
      </Form>
    ))

    const input = screen.getByTestId('input')

    await fireEvent.input(input, { target: { value: 'invalid' } })

    await waitFor(() => {
      expect(screen.queryByText('Error message')).toBeNull()
    })

    await fireEvent.blur(input)
    await fireEvent.input(input, { target: { value: 'invalid' } })

    await waitFor(() => {
      expect(screen.getByText('Error message')).not.toBeNull()
    })

    await fireEvent.input(input, { target: { value: 'valid' } })

    await waitFor(() => {
      expect(screen.queryByText('Error message')).toBeNull()
    })
  })

  test('passes validated data to submit handler', async () => {
    const state: TestState = { value: 'valid' }
    const onSubmit = vi.fn((event: FormSubmitEvent) => {
      expect(event.data).toEqual(state)
    })
    const onError = vi.fn()

    const screen = render(() => (
      <Form
        state={state}
        validate={(currentState) => {
          if (currentState?.value !== 'valid') {
            return [{ name: 'value', message: 'Error message' }]
          }

          return []
        }}
        onSubmit={onSubmit}
        onError={onError}
      >
        <FormField name="value" label="Value">
          <TestInput state={state} />
        </FormField>
      </Form>
    ))

    await fireEvent.submit(screen.container.querySelector('form') as HTMLFormElement)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })
    expect(onError).not.toHaveBeenCalled()
  })

  test('supports setErrors through form context', async () => {
    const state: TestState = { value: '' }

    const screen = render(() => (
      <Form state={state} validate={() => []}>
        <FormField name="value" label="Value">
          <TestInput state={state} />
        </FormField>
        <SetErrorsOnMount />
      </Form>
    ))

    await waitFor(() => {
      expect(screen.getByText('Manual error')).not.toBeNull()
    })
    expect(screen.getByTestId('input').getAttribute('aria-invalid')).toBe('true')
  })

  test('validates on blur when validateOn is blur', async () => {
    const state: TestState = { value: '' }

    const screen = render(() => (
      <Form
        state={state}
        validateOn={['blur']}
        validateOnInputDelay={0}
        validate={(currentState) => {
          if (currentState?.value === 'valid') {
            return []
          }

          return [{ name: 'value', message: 'Error message' }]
        }}
      >
        <FormField name="value" label="Value">
          <TestInput state={state} />
        </FormField>
      </Form>
    ))

    const input = screen.getByTestId('input')

    await fireEvent.input(input, { target: { value: 'invalid' } })
    await waitFor(() => {
      expect(screen.queryByText('Error message')).toBeNull()
    })

    await fireEvent.blur(input)
    await waitFor(() => {
      expect(screen.getByText('Error message')).not.toBeNull()
    })

    await fireEvent.input(input, { target: { value: 'valid' } })
    await waitFor(() => {
      expect(screen.getByText('Error message')).not.toBeNull()
    })

    await fireEvent.blur(input)
    await waitFor(() => {
      expect(screen.queryByText('Error message')).toBeNull()
    })
  })

  test('applies classes.root override', () => {
    const state: TestState = { value: '' }
    const screen = render(() => (
      <Form state={state} validate={() => []} classes={{ root: 'root-override' }}>
        <FormField name="value" label="Value">
          <TestInput state={state} />
        </FormField>
      </Form>
    ))

    expect((screen.container.querySelector('form') as HTMLFormElement).className).toContain(
      'root-override',
    )
  })

  test('supports children render prop with errors/loading props', async () => {
    const state: TestState = { value: '' }
    const snapshots: Array<{ loading: boolean; errors: string[] }> = []
    const validate = async (currentState: TestState | undefined) => {
      await new Promise((resolve) => {
        setTimeout(resolve, 10)
      })

      if (currentState?.value) {
        return []
      }

      return [{ name: 'value', message: 'Required value' }]
    }

    const screen = render(() => (
      <Form state={state} validate={validate}>
        {(props: FormRenderProps) => {
          snapshots.push({
            loading: props.loading,
            errors: props.errors.map((error) => error.message),
          })

          return <button type="submit">Submit</button>
        }}
      </Form>
    ))

    await fireEvent.submit(screen.container.querySelector('form') as HTMLFormElement)

    await waitFor(() => {
      expect(snapshots.some((snapshot) => snapshot.loading)).toBe(true)
    })

    await waitFor(() => {
      expect(snapshots.some((snapshot) => snapshot.errors.includes('Required value'))).toBe(true)
    })
  })

  test('supports children render prop without params', () => {
    const state: TestState = { value: '' }
    const noArgChildren = vi.fn(() => <div data-testid="no-arg-children">No args</div>)

    const screen = render(() => (
      <Form state={state} validate={() => []}>
        {noArgChildren}
      </Form>
    ))

    expect(screen.getByTestId('no-arg-children')).not.toBeNull()
    expect(noArgChildren).toHaveBeenCalled()
  })

  test('exposes touched/dirty/focused/validating field runtime state', async () => {
    const state: TestState = { value: '' }

    const screen = render(() => (
      <Form
        state={state}
        validateOn={['blur']}
        validate={() =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve([])
            }, 30)
          })
        }
      >
        <FormField name="value" label="Value">
          <TestInput state={state} />
        </FormField>
      </Form>
    ))

    const input = screen.getByTestId('input')

    expect(input.getAttribute('data-touched')).toBe('false')
    expect(input.getAttribute('data-dirty')).toBe('false')
    expect(input.getAttribute('data-focused')).toBe('false')
    expect(input.getAttribute('data-validating')).toBe('false')

    await fireEvent.focus(input)
    await waitFor(() => {
      expect(input.getAttribute('data-touched')).toBe('true')
      expect(input.getAttribute('data-focused')).toBe('true')
    })

    await fireEvent.input(input, { target: { value: 'next' } })
    await waitFor(() => {
      expect(input.getAttribute('data-dirty')).toBe('true')
    })

    await fireEvent.blur(input)
    await waitFor(() => {
      expect(input.getAttribute('data-validating')).toBe('true')
    })
    await waitFor(() => {
      expect(input.getAttribute('data-validating')).toBe('false')
      expect(input.getAttribute('data-focused')).toBe('false')
    })
  })

  test('schema validation shows errors on submit (invalid state)', async () => {
    const schema = v.object({
      value: v.pipe(v.string(), v.minLength(1, 'Value is required')),
    })
    const state: TestState = { value: '' }
    const onSubmit = vi.fn()
    const onError = vi.fn()

    const screen = render(() => (
      <Form state={state} schema={schema} onSubmit={onSubmit} onError={onError}>
        <FormField name="value" label="Value">
          <TestInput state={state} />
        </FormField>
      </Form>
    ))

    await fireEvent.submit(screen.container.querySelector('form') as HTMLFormElement)

    await waitFor(() => {
      expect(onError).toHaveBeenCalledTimes(1)
    })
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('Value is required')).not.toBeNull()
  })

  test('schema validation passes and calls onSubmit (valid state)', async () => {
    const schema = v.object({
      value: v.pipe(v.string(), v.minLength(1, 'Value is required')),
    })
    const state: TestState = { value: 'hello' }
    const onSubmit = vi.fn()
    const onError = vi.fn()

    const screen = render(() => (
      <Form state={state} schema={schema} onSubmit={onSubmit} onError={onError}>
        <FormField name="value" label="Value">
          <TestInput state={state} />
        </FormField>
      </Form>
    ))

    await fireEvent.submit(screen.container.querySelector('form') as HTMLFormElement)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })
    expect(onError).not.toHaveBeenCalled()
  })

  test('schema + validate errors merge together', async () => {
    const schema = v.object({
      value: v.pipe(v.string(), v.minLength(3, 'Too short')),
    })
    const state: TestState = { value: 'ab' }
    const onError = vi.fn()

    const screen = render(() => (
      <Form
        state={state}
        schema={schema}
        validate={() => [{ name: 'value', message: 'Custom error' }]}
        onError={onError}
      >
        <FormField name="value" label="Value">
          <TestInput state={state} />
        </FormField>
      </Form>
    ))

    await fireEvent.submit(screen.container.querySelector('form') as HTMLFormElement)

    await waitFor(() => {
      expect(onError).toHaveBeenCalledTimes(1)
    })
    const errors = onError.mock.calls[0]![0].errors
    expect(errors).toHaveLength(2)
    expect(errors.some((e: { message: string }) => e.message === 'Too short')).toBe(true)
    expect(errors.some((e: { message: string }) => e.message === 'Custom error')).toBe(true)
  })

  test('schema works without validate callback', async () => {
    const schema = v.object({
      value: v.pipe(v.string(), v.minLength(1, 'Required')),
    })
    const state: TestState = { value: '' }
    const onError = vi.fn()

    const screen = render(() => (
      <Form state={state} schema={schema} onError={onError}>
        <FormField name="value" label="Value">
          <TestInput state={state} />
        </FormField>
      </Form>
    ))

    await fireEvent.submit(screen.container.querySelector('form') as HTMLFormElement)

    await waitFor(() => {
      expect(onError).toHaveBeenCalledTimes(1)
    })
    expect(screen.getByText('Required')).not.toBeNull()
  })

  test('schema validation works without external state prop', async () => {
    const schema = v.object({
      value: v.pipe(v.string(), v.minLength(1, 'Value is required')),
    })
    const onSubmit = vi.fn((event: FormSubmitEvent<{ value: string }>) => {
      expect(event.data).toEqual({ value: 'hello' })
    })
    const onError = vi.fn()

    const screen = render(() => (
      <Form schema={schema} onError={onError} onSubmit={onSubmit}>
        <FormField name="value" label="Value">
          <TestInputWithoutExternalState />
        </FormField>
      </Form>
    ))

    const form = screen.container.querySelector('form') as HTMLFormElement
    await fireEvent.submit(form)

    await waitFor(() => {
      expect(onError).toHaveBeenCalledTimes(1)
    })
    expect(screen.container.querySelector('[data-slot="error"]')?.textContent).toBeTruthy()

    const input = screen.getByTestId('input-uncontrolled')
    await fireEvent.input(input, { target: { value: 'hello' } })
    await fireEvent.change(input)

    await fireEvent.submit(form)
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })
  })

  test('schema with Input component maps empty value to required message', async () => {
    const schema = v.object({
      username: v.pipe(v.string(), v.minLength(1, 'Username is required.')),
    })

    const screen = render(() => (
      <Form schema={schema}>
        <FormField name="username" label="Username">
          <Input placeholder="johndoe" />
        </FormField>
      </Form>
    ))

    const form = screen.container.querySelector('form') as HTMLFormElement
    await fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText('Username is required.')).not.toBeNull()
    })
  })

  test('schema with Checkbox component maps unchecked value to required message', async () => {
    const schema = v.object({
      agree: v.pipe(v.boolean(), v.value(true, 'You must accept the terms.')),
    })

    const screen = render(() => (
      <Form schema={schema}>
        <FormField name="agree" label="Terms" required>
          <Checkbox label="I agree to the terms of service" />
        </FormField>
      </Form>
    ))

    const form = screen.container.querySelector('form') as HTMLFormElement
    await fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText('You must accept the terms.')).not.toBeNull()
    })
  })

  test('schema with RadioGroup component maps unselected value to required message', async () => {
    const schema = v.object({
      plan: v.picklist(['starter', 'pro'], 'Select a plan.'),
    })

    const screen = render(() => (
      <Form schema={schema}>
        <FormField name="plan" label="Plan" required>
          <RadioGroup
            items={[
              { value: 'starter', label: 'Starter' },
              { value: 'pro', label: 'Pro' },
            ]}
          />
        </FormField>
      </Form>
    ))

    const form = screen.container.querySelector('form') as HTMLFormElement
    await fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText('Select a plan.')).not.toBeNull()
    })
  })

  test('schema with Select component maps empty value to required message', async () => {
    const schema = v.object({
      role: v.pipe(v.string(), v.minLength(1, 'Please select a role.')),
    })

    const screen = render(() => (
      <Form schema={schema}>
        <FormField name="role" label="Role" required>
          <Select options={roleOptions} placeholder="Choose a role..." />
        </FormField>
      </Form>
    ))

    const form = screen.container.querySelector('form') as HTMLFormElement
    await fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText('Please select a role.')).not.toBeNull()
    })
  })

  test('array name field receives validation errors from schema', async () => {
    const schema = v.object({
      user: v.object({
        email: v.pipe(v.string(), v.minLength(1, 'Email is required')),
      }),
    })
    const state = { user: { email: '' } }
    const onError = vi.fn()

    const screen = render(() => (
      <Form state={state} schema={schema} onError={onError}>
        <FormField name={['user', 'email']} label="User Email">
          <TestInput state={{ value: '' }} />
        </FormField>
      </Form>
    ))

    await fireEvent.submit(screen.container.querySelector('form') as HTMLFormElement)

    await waitFor(() => {
      expect(onError).toHaveBeenCalledTimes(1)
    })
    expect(screen.getByText('Email is required')).not.toBeNull()
  })

  test('prefix matching: parent field sees nested errors', async () => {
    const state = { user: { email: '' } }
    const onError = vi.fn()

    const screen = render(() => (
      <Form
        state={state}
        validate={() => [{ name: ['user', 'email'], message: 'Nested error' }]}
        onError={onError}
      >
        <FormField name="user" label="User">
          <TestInput state={{ value: '' }} />
        </FormField>
      </Form>
    ))

    await fireEvent.submit(screen.container.querySelector('form') as HTMLFormElement)

    await waitFor(() => {
      expect(onError).toHaveBeenCalledTimes(1)
    })
    expect(screen.getByText('Nested error')).not.toBeNull()
  })
})
