import { fireEvent, waitFor } from '@solidjs/testing-library'
import { createComponent } from 'solid-js'
import * as v from 'valibot'
import { describe, expect, test } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test'
import { Input } from '../input/index'

import { createForm } from './form'

describe('FormField SSR Hydration', () => {
  test('hydrates registered controls and replaces help with the focused validation error', async () => {
    const reads = { children: 0, description: 0, error: 0, help: 0, hint: 0, label: 0 }

    function ClientField() {
      const form = createForm({
        schema: v.object({ value: v.pipe(v.string(), v.nonEmpty('Value is required')) }),
        initialInput: { value: '' },
      })

      return (
        <form.Form aria-label="Hydrated field form">
          {createComponent(form.Field, {
            name: 'value' as const,
            required: true,
            get label() {
              reads.label += 1
              return 'Value'
            },
            get hint() {
              reads.hint += 1
              return 'Required'
            },
            get description() {
              reads.description += 1
              return 'Enter a value'
            },
            get help() {
              reads.help += 1
              return 'Helpful text'
            },
            get error() {
              reads.error += 1
              return undefined
            },
            get children() {
              reads.children += 1
              return <Input />
            },
          })}
        </form.Form>
      )
    }

    const { container } = hydrateFixture(
      '/src/forms/form/form-field.ssr.fixture.tsx',
      'renderFormFieldFixture',
      () => <ClientField />,
    )

    const input = container.querySelector('input')!
    const label = container.querySelector<HTMLLabelElement>('[data-slot="label"]')!
    const root = container.querySelector('[data-slot="root"]')!

    expect(root).not.toBeNull()
    expect(input).not.toBeNull()
    await waitFor(() => expect(label.htmlFor).toBe(input.id))
    expect(reads).toEqual({ children: 1, description: 1, error: 1, help: 1, hint: 1, label: 1 })

    fireEvent.submit(container.querySelector('form')!)
    await waitFor(() => expect(container.querySelector('[data-slot="error"]')).not.toBeNull())

    const errorMessage = container.querySelector('[data-slot="error"]')!
    expect(document.activeElement).toBe(input)
    expect(container.querySelector('[data-slot="help"]')).toBeNull()
    expect(input.getAttribute('aria-describedby')?.split(' ')).toEqual([
      container.querySelector('[data-slot="hint"]')?.id,
      container.querySelector('[data-slot="description"]')?.id,
      errorMessage.id,
    ])
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(reads).toEqual({ children: 1, description: 1, error: 1, help: 1, hint: 1, label: 1 })
  })
})
