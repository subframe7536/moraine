import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import * as v from 'valibot'
import { describe, expect, test, vi } from 'vitest'

import { Button } from '../../elements/button/index.ts'
import { FormField } from '../form-field/index.ts'
import { Input } from '../input/index.ts'
import { Switch } from '../switch/index.ts'

import { createForm, Form } from './index.ts'

const Schema = v.object({
  email: v.pipe(v.string(), v.email('Enter a valid email.')),
  enabled: v.boolean(),
})

describe('Form', () => {
  test('submits Formisch output through the high-level adapters', async () => {
    const form = createForm({
      schema: Schema,
      initialInput: { email: 'initial@example.com', enabled: false },
    })
    const onSubmit = vi.fn()
    const screen = render(() => (
      <Form of={form} onSubmit={onSubmit}>
        <FormField name="email" label="Email">
          <Input />
        </FormField>
        <FormField name="enabled" label="Enabled">
          <Switch />
        </FormField>
        <Button type="submit">Save</Button>
      </Form>
    ))

    expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe('initial@example.com')
    await fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'dev@example.com' } })
    await fireEvent.click(screen.getByRole('switch'))
    await fireEvent.submit(screen.container.querySelector('form')!)

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({ email: 'dev@example.com', enabled: true })
  })

  test('renders field errors and forwards native form props', async () => {
    const form = createForm({
      schema: Schema,
      initialInput: { email: '', enabled: false },
      validate: 'blur',
    })
    const screen = render(() => (
      <Form
        of={form}
        aria-label="Settings"
        classes={{ root: 'root-override' }}
        styles={{ root: { width: '200px' } }}
      >
        <FormField name="email" label="Email">
          <Input />
        </FormField>
      </Form>
    ))

    const input = screen.getByLabelText('Email')
    await fireEvent.focus(input)
    await fireEvent.blur(input)

    await waitFor(() => expect(screen.getByText('Enter a valid email.')).not.toBeNull())
    expect(input.getAttribute('aria-invalid')).toBe('true')
    const element = screen.getByRole('form')
    expect(element.className).toContain('root-override')
    expect(element.style.width).toBe('200px')
  })

  test('uses a control initialValue only when Formisch has no field input', async () => {
    const form = createForm({
      schema: v.object({ value: v.optional(v.string()) }),
      initialInput: {},
    })
    const screen = render(() => (
      <Form of={form}>
        <FormField name="value" label="Value">
          <Input defaultValue="Fallback" />
        </FormField>
      </Form>
    ))

    await waitFor(() => {
      expect((screen.getByLabelText('Value') as HTMLInputElement).value).toBe('Fallback')
    })
  })
})
