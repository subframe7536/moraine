import { getInput } from '@formisch/solid'
import { fireEvent, waitFor } from '@solidjs/testing-library'
import * as v from 'valibot'
import { describe, expect, test, vi } from 'vitest'

import { Button } from '../../elements/button/index.ts'
import { renderWithOwner } from '../../test-utils/owner-render.tsx'
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
    const onSubmit = vi.fn()
    const { screen } = renderWithOwner(
      () =>
        createForm({
          schema: Schema,
          initialInput: { email: 'initial@example.com', enabled: false },
        }),
      (form) => (
        <Form of={form} onSubmit={onSubmit}>
          <FormField name="email" label="Email">
            <Input />
          </FormField>
          <FormField name="enabled" label="Enabled">
            <Switch />
          </FormField>
          <Button type="submit">Save</Button>
        </Form>
      ),
    )

    expect(screen.getByLabelText<HTMLInputElement>('Email').value).toBe('initial@example.com')
    fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'dev@example.com' } })
    fireEvent.click(screen.getByRole('switch'))
    fireEvent.submit(screen.container.querySelector('form')!)

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({ email: 'dev@example.com', enabled: true })
  })

  test('renders field errors and forwards native form props', async () => {
    const { screen } = renderWithOwner(
      () =>
        createForm({
          schema: Schema,
          initialInput: { email: '', enabled: false },
          validate: 'blur',
        }),
      (form) => (
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
      ),
    )

    const input = screen.getByLabelText('Email')
    fireEvent.focus(input)
    fireEvent.blur(input)

    await waitFor(() => expect(screen.getByText('Enter a valid email.')).not.toBeNull())
    expect(input.getAttribute('aria-invalid')).toBe('true')
    const element = screen.getByRole('form')
    expect(element.className).toContain('root-override')
    expect(element.style.width).toBe('200px')
  })

  test('uses a control initialValue only when Formisch has no field input', async () => {
    const { screen } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ value: v.optional(v.string()) }),
          initialInput: {},
        }),
      (form) => (
        <Form of={form}>
          <FormField name="value" label="Value">
            <Input defaultValue="Fallback" />
          </FormField>
        </Form>
      ),
    )

    await waitFor(() => {
      expect(screen.getByLabelText<HTMLInputElement>('Value').value).toBe('Fallback')
    })
  })

  test('blocks invalid submission and renders the first field error', async () => {
    const onSubmit = vi.fn()
    const { screen } = renderWithOwner(
      () =>
        createForm({
          schema: Schema,
          initialInput: { email: '', enabled: false },
        }),
      (form) => (
        <Form of={form} onSubmit={onSubmit}>
          <FormField name="email" label="Email">
            <Input />
          </FormField>
          <Button type="submit">Save</Button>
        </Form>
      ),
    )
    const input = screen.getByLabelText('Email')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(screen.getByText('Enter a valid email.')).not.toBeNull())
    expect(onSubmit).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(input)
    expect(screen.container.querySelector('form')?.hasAttribute('novalidate')).toBe(true)
  })

  test('preserves the native submitter and exposes exact async submitting state', async () => {
    let resolveSubmit: (() => void) | undefined
    const onSubmit = vi.fn(
      (_output: v.InferOutput<typeof Schema>, _event: SubmitEvent) =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve
        }),
    )
    const { screen } = renderWithOwner(
      () =>
        createForm({
          schema: Schema,
          initialInput: { email: 'dev@example.com', enabled: false },
        }),
      (form) => (
        <Form of={form} onSubmit={onSubmit}>
          <Button type="submit" name="intent" value="save">
            Save
          </Button>
        </Form>
      ),
    )
    const formElement = screen.container.querySelector('form')!
    const submitter = screen.getByRole('button', { name: 'Save' })

    fireEvent.click(submitter)

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0]?.[1].submitter).toBe(submitter)
    expect(onSubmit.mock.calls[0]?.[1].defaultPrevented).toBe(true)
    expect(formElement.getAttribute('data-submitting')).toBe('')

    resolveSubmit?.()
    await waitFor(() => expect(formElement.getAttribute('data-submitting')).toBeNull())
  })

  test('captures rejected submit handlers as form errors and clears submitting state', async () => {
    const { screen, value: form } = renderWithOwner(
      () =>
        createForm({
          schema: Schema,
          initialInput: { email: 'dev@example.com', enabled: false },
        }),
      (form) => (
        <Form of={form} onSubmit={() => Promise.reject(new Error('Submit failed'))}>
          <Button type="submit">Save</Button>
        </Form>
      ),
    )
    const formElement = screen.container.querySelector('form')!

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(form.errors).toEqual(['Submit failed']))
    expect(formElement.getAttribute('data-submitting')).toBeNull()
  })

  test('resets native controls and Formisch state after the caller handler', async () => {
    const resetSnapshots: unknown[] = []
    const { screen, value: form } = renderWithOwner(
      () =>
        createForm({
          schema: Schema,
          initialInput: { email: 'initial@example.com', enabled: false },
          validate: 'blur',
        }),
      (form) => (
        <Form
          of={form}
          onReset={() => {
            resetSnapshots.push({ dirty: form.isDirty, input: getInput(form) })
          }}
        >
          <FormField name="email" label="Email">
            <Input />
          </FormField>
          <FormField name="enabled" label="Enabled">
            <Switch />
          </FormField>
          <Button type="reset">Reset</Button>
        </Form>
      ),
    )
    const input = screen.getByLabelText('Email') as HTMLInputElement

    fireEvent.input(input, { target: { value: 'invalid' } })
    fireEvent.blur(input)
    fireEvent.click(screen.getByRole('switch'))
    await waitFor(() => expect(screen.getByText('Enter a valid email.')).not.toBeNull())
    expect(form.isDirty).toBe(true)
    expect(form.isTouched).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))

    await waitFor(() => {
      expect(input.value).toBe('initial@example.com')
      expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('false')
      expect(screen.queryByText('Enter a valid email.')).toBeNull()
    })
    expect(form.isDirty).toBe(false)
    expect(form.isTouched).toBe(false)
    expect(getInput(form)).toEqual({ email: 'initial@example.com', enabled: false })
    expect(resetSnapshots).toEqual([
      {
        dirty: true,
        input: { email: 'invalid', enabled: true },
      },
    ])
  })

  test('does not reset native or Formisch state when the caller cancels reset', async () => {
    const { screen, value: form } = renderWithOwner(
      () =>
        createForm({
          schema: v.object({ value: v.string() }),
          initialInput: { value: 'Initial' },
        }),
      (form) => (
        <Form of={form} onReset={(event) => event.preventDefault()}>
          <FormField name="value" label="Value">
            <Input />
          </FormField>
          <Button type="reset">Reset</Button>
        </Form>
      ),
    )
    const input = screen.getByLabelText('Value') as HTMLInputElement

    fireEvent.input(input, { target: { value: 'Changed' } })
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))

    expect(input.value).toBe('Changed')
    expect(getInput(form)).toEqual({ value: 'Changed' })
    expect(form.isDirty).toBe(true)
  })

  test('keeps sibling form providers and submissions isolated', async () => {
    const schema = v.object({ value: v.string() })
    const firstSubmit = vi.fn()
    const secondSubmit = vi.fn()
    const { screen, value: forms } = renderWithOwner(
      (): [
        ReturnType<typeof createForm<typeof schema>>,
        ReturnType<typeof createForm<typeof schema>>,
      ] => [
        createForm({ schema, initialInput: { value: 'First' } }),
        createForm({ schema, initialInput: { value: 'Second' } }),
      ],
      ([firstForm, secondForm]) => (
        <>
          <Form of={firstForm} onSubmit={firstSubmit} aria-label="First form">
            <FormField name="value" label="First value">
              <Input />
            </FormField>
            <Button type="submit">Submit first</Button>
          </Form>
          <Form of={secondForm} onSubmit={secondSubmit} aria-label="Second form">
            <FormField name="value" label="Second value">
              <Input />
            </FormField>
            <Button type="submit">Submit second</Button>
          </Form>
        </>
      ),
    )
    const [, secondForm] = forms

    fireEvent.input(screen.getByLabelText('First value'), { target: { value: 'Changed' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit first' }))

    await waitFor(() => expect(firstSubmit).toHaveBeenCalledTimes(1))
    expect(firstSubmit.mock.calls[0]?.[0]).toEqual({ value: 'Changed' })
    expect(secondSubmit).not.toHaveBeenCalled()
    expect(getInput(secondForm)).toEqual({ value: 'Second' })

    fireEvent.click(screen.getByRole('button', { name: 'Submit second' }))
    await waitFor(() => expect(secondSubmit).toHaveBeenCalledTimes(1))
    expect(secondSubmit.mock.calls[0]?.[0]).toEqual({ value: 'Second' })
  })
})
