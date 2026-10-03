import { expect, test } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test'
import { Input } from '../input'

import { Field } from './field'

test('hydrates standalone Field semantics', () => {
  const { container } = hydrateFixture(
    '/src/form/field/field.ssr.fixture.tsx',
    'renderFieldFixture',
    () => (
      <Field label="Value" required description="Enter a value" help="Helpful text">
        <Input />
      </Field>
    ),
  )
  const input = container.querySelector('input')!
  const label = container.querySelector<HTMLLabelElement>('[data-slot="field-label"]')!
  expect(label.htmlFor).toBe(input.id)
  expect(input.required).toBe(true)
  expect(input.getAttribute('aria-describedby')).toContain('-description')
})

test('hydrates hidden-label Field without replacing its label or control', () => {
  const { container } = hydrateFixture(
    '/src/form/field/field.ssr.fixture.tsx',
    'renderHiddenLabelFieldFixture',
    () => (
      <Field hiddenLabel="Filter" orientation="horizontal" disabled error="No matching commands">
        <Input />
      </Field>
    ),
  )
  const input = container.querySelector('input')!
  const label = container.querySelector<HTMLLabelElement>('[data-slot="field-label"]')!
  expect(label.textContent).toBe('Filter')
  expect(label.htmlFor).toBe(input.id)
  expect(input.getAttribute('aria-labelledby')).toBe(label.id)
  expect(input.disabled).toBe(true)
  expect(input.getAttribute('aria-invalid')).toBe('true')
  expect(document.getElementById(input.getAttribute('aria-describedby')!)?.textContent).toBe(
    'No matching commands',
  )
})
