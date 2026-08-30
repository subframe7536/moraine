import { fireEvent, waitFor } from '@solidjs/testing-library'
import * as v from 'valibot'
import { describe, expect, test, vi } from 'vitest'

import { Button } from '../../elements/button/index.ts'
import { hydrateFixture } from '../../test-utils/ssr-test.ts'
import { FormField } from '../form-field/index.ts'
import { Input } from '../input/index.ts'

import { createForm, Form } from './index.ts'

describe('Form SSR Hydration', () => {
  test('hydrates the same form and submits through the client-owned store', async () => {
    const onSubmit = vi.fn()

    function ClientForm() {
      const form = createForm({
        schema: v.object({ value: v.string() }),
        initialInput: { value: 'Server value' },
      })

      return (
        <Form of={form} onSubmit={onSubmit} aria-label="Hydrated form">
          <FormField name="value" label="Value">
            <Input />
          </FormField>
          <Button type="submit">Submit</Button>
        </Form>
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

    fireEvent.click(container.querySelector('button')!)
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({ value: 'Server value' })
  })
})
