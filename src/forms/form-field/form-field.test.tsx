import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import { createForm, Form } from '../form'
import { Input } from '../input'

import { FormField } from './form-field'
import type { FormFieldProps } from './form-field'

const TypedFormSchema = v.object({
  email: v.string(),
  profile: v.object({ name: v.string() }),
})

const typedTopLevelField: FormFieldProps<typeof TypedFormSchema> = { name: 'email' }
const typedNestedField: FormFieldProps<typeof TypedFormSchema> = {
  name: ['profile', 'name'],
}
// @ts-expect-error unknown top-level field
const invalidTypedField: FormFieldProps<typeof TypedFormSchema> = { name: 'unknown' }

void typedTopLevelField
void typedNestedField
void invalidTypedField

describe('FormField', () => {
  test('renders accessible standalone field content', () => {
    const screen = render(() => (
      <FormField label="Email" hint="Required" description="Use a valid email" help="Never shared">
        <Input />
      </FormField>
    ))

    const input = screen.getByLabelText('Email')
    expect(screen.getByText('Required')).not.toBeNull()
    expect(screen.getByText('Use a valid email')).not.toBeNull()
    expect(screen.getByText('Never shared')).not.toBeNull()
    expect(input.getAttribute('aria-describedby')).toContain('-description')
  })

  test('uses Formisch errors and supports nested numeric paths', async () => {
    const schema = v.object({
      users: v.array(v.object({ email: v.pipe(v.string(), v.email('Invalid email')) })),
    })
    const form = createForm({
      schema,
      initialInput: { users: [{ email: '' }] },
      validate: 'blur',
    })
    const screen = render(() => (
      <Form of={form}>
        <FormField name={['users', 0, 'email']} label="Email">
          <Input />
        </FormField>
      </Form>
    ))

    const input = screen.getByLabelText('Email')
    await fireEvent.focus(input)
    await fireEvent.blur(input)
    await waitFor(() => expect(screen.getByText('Invalid email')).not.toBeNull())
  })

  test('manual error overrides Formisch and false suppresses it', async () => {
    const form = createForm({
      schema: v.object({ value: v.pipe(v.string(), v.nonEmpty('Schema error')) }),
      initialInput: { value: '' },
    })
    const screen = render(() => (
      <Form of={form}>
        <FormField name="value" label="Manual" error="Manual error">
          <Input />
        </FormField>
        <FormField name="value" label="Suppressed" error={false}>
          <Input />
        </FormField>
      </Form>
    ))

    expect(screen.getByText('Manual error')).not.toBeNull()
    await fireEvent.submit(screen.container.querySelector('form')!)
    await waitFor(() => expect(screen.queryByText('Schema error')).toBeNull())
  })

  test('applies root class and style priority', () => {
    const screen = render(() => (
      <FormField class="root-override" style={{ width: '200px' }} label="Field">
        <Input />
      </FormField>
    ))
    const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement
    expect(root.className).toContain('root-override')
    expect(root.style.width).toBe('200px')
  })
})
