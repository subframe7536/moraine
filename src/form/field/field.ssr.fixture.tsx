import { Show } from 'solid-js'
import { renderToString } from 'solid-js/web'

import { Input } from '../input'

import { Field } from './field'

export function renderFieldFixture(): string {
  return renderToString(() => (
    <Field label="Value" required description="Enter a value" help="Helpful text">
      <Input />
    </Field>
  ))
}

export function renderConditionalFieldFixture(): string {
  return renderToString(() => (
    <Field label="Value">
      <Show when={true}>
        <span data-testid="conditional-child">Visible</span>
      </Show>
    </Field>
  ))
}

export function renderFieldRenderPropFixture(): string {
  return renderToString(() => (
    <Field label="Value" error="Missing">
      {(state) => <span data-testid="field-error-child">{state.error}</span>}
    </Field>
  ))
}

export function renderHiddenLabelFieldFixture(): string {
  return renderToString(() => (
    <Field hiddenLabel="Filter" orientation="horizontal" disabled error="No matching commands">
      <Input />
    </Field>
  ))
}
