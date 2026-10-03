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

export function renderHiddenLabelFieldFixture(): string {
  return renderToString(() => (
    <Field hiddenLabel="Filter" orientation="horizontal" disabled error="No matching commands">
      <Input />
    </Field>
  ))
}
