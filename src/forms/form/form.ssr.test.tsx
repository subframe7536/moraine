import { fireEvent, waitFor } from '@solidjs/testing-library'
import * as v from 'valibot'
import { describe, expect, test, vi } from 'vitest'

import { Button } from '../../elements/button/index.ts'
import { hydrateFixture } from '../../test-utils/ssr-test.ts'
import { Input } from '../input/index.ts'

import { createForm } from './index.ts'

describe('Form SSR Hydration', () => {
  test('hydrates the same form and submits through the client-owned store', async () => {
    const onSubmit = vi.fn()

    function ClientForm() {
      const form = createForm({
        schema: v.object({ value: v.string() }),
        initialInput: { value: 'Server value' },
      })

      return (
        <form.Form onSubmit={onSubmit} aria-label="Hydrated form">
          <form.Field name="value" label="Value">
            <Input />
          </form.Field>
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

    fireEvent.click(container.querySelector('button')!)
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({ value: 'Server value' })
  })
})
