import { render } from '@solidjs/testing-library'
import { Show, createComponent, createSignal, flush } from 'solid-js'
import { expect, it } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test'
import { Input } from '../input'

import { Field } from './field'
it('hydrates standalone Field semantics', () => {
  const { container } = hydrateFixture(
    '/src/components/field/field.ssr.fixture.tsx',
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

it('hydrates conditional Field children and updates them after hydration', () => {
  const [visible, setVisible] = createSignal(true)
  const { container } = hydrateFixture(
    '/src/components/field/field.ssr.fixture.tsx',
    'renderConditionalFieldFixture',
    () => (
      <Field label="Value">
        <Show when={visible()}>
          <span data-testid="conditional-child">Visible</span>
        </Show>
      </Field>
    ),
  )
  const child = container.querySelector('[data-testid="conditional-child"]')
  expect(child?.textContent).toBe('Visible')
  expect(child?.parentElement?.getAttribute('data-slot')).toBe('field-container')

  flush(() => setVisible(false))
  expect(container.querySelector('[data-testid="conditional-child"]')).toBeNull()
})

it('hydrates Field render props and keeps them reactive', () => {
  const [error, setError] = createSignal<string | undefined>('Missing')
  const { container } = hydrateFixture(
    '/src/components/field/field.ssr.fixture.tsx',
    'renderFieldRenderPropFixture',
    () => (
      <Field label="Value" error={error()}>
        {(state) => <span data-testid="field-error-child">{state.error}</span>}
      </Field>
    ),
  )
  const child = container.querySelector('[data-testid="field-error-child"]')
  expect(child?.textContent).toBe('Missing')

  flush(() => setError('Still missing'))
  expect(container.querySelector('[data-testid="field-error-child"]')?.textContent).toBe(
    'Still missing',
  )
})

it('hydrates hidden-label Field without replacing its label or control', () => {
  const { container } = hydrateFixture(
    '/src/components/field/field.ssr.fixture.tsx',
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

it('reads a JSX label getter once within a single mount', () => {
  let labelReads = 0
  const view = render(() =>
    createComponent(Field, {
      get label() {
        labelReads += 1
        return <span>Email</span>
      },
      children: <Input />,
    }),
  )

  expect(labelReads).toBe(1)
  expect(view.container.querySelector('[data-slot="field-label"]')?.textContent).toBe('Email')
  view.unmount()
})
