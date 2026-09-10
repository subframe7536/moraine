import { fireEvent, waitFor } from '@solidjs/testing-library'
import * as v from 'valibot'
import { describe, expect, test, vi } from 'vitest'

import { Button } from '../../elements/button'
import { hydrateFixture } from '../../test-utils/ssr-test'
import { Input } from '../input'
import { Switch } from '../switch'

import { createForm } from './'

describe('Form SSR Hydration', () => {
  test('hydrates and resets the same controls before submitting the client-owned store', async () => {
    const onSubmit = vi.fn()

    function ClientForm() {
      const form = createForm({
        schema: v.object({ value: v.string(), enabled: v.boolean() }),
        initialInput: { value: 'Server value', enabled: true },
      })

      return (
        <form.Form onSubmit={onSubmit} aria-label="Hydrated form">
          <form.Field name="value" label="Value">
            <Input />
          </form.Field>
          <form.Field name="enabled" label="Enabled">
            <Switch />
          </form.Field>
          <Button type="reset">Reset</Button>
          <Button type="submit">Submit</Button>
        </form.Form>
      )
    }

    const { container } = hydrateFixture(
      '/src/forms/form/form.ssr.fixture.tsx',
      'renderFormFixture',
      () => <ClientForm />,
    )

    const form = container.querySelector('form')
    expect(form).not.toBeNull()
    expect(container.querySelector<HTMLInputElement>('input')?.value).toBe('Server value')

    const control = container.querySelector('[role="switch"]')!
    const checkbox = container.querySelector<HTMLInputElement>('input[type="checkbox"]')!
    const reset = container.querySelector('button[type="reset"]')!
    const input = container.querySelector<HTMLInputElement>('input[type="text"]')!

    for (const change of [false, true]) {
      if (change) {
        fireEvent.click(control)
        fireEvent.input(input, { target: { value: 'Changed' } })
      }
      fireEvent.click(reset)
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(control.getAttribute('aria-checked')).toBe('true')
      expect(checkbox.checked).toBe(true)
      expect(input.value).toBe('Server value')
      expect(container.querySelector('[role="switch"]')).toBe(control)
    }

    fireEvent.click(container.querySelector('button[type="submit"]')!)
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({ value: 'Server value', enabled: true })
  })
})
