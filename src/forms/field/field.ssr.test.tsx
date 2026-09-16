import { expect, test } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test'
import { Input } from '../input'

import { Field } from './field'

test('hydrates standalone Field semantics', () => {
  const { container } = hydrateFixture(
    '/src/forms/field/field.ssr.fixture.tsx',
    'renderFieldFixture',
    () => (
      <Field label="Value" required description="Enter a value" help="Helpful text">
        <Input />
      </Field>
    ),
  )
  const input = container.querySelector('input')!
  const label = container.querySelector<HTMLLabelElement>('[data-slot="label"]')!
  expect(label.htmlFor).toBe(input.id)
  expect(input.required).toBe(true)
  expect(input.getAttribute('aria-describedby')).toContain('-description')
})
