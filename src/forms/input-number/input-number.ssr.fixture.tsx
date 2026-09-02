import { renderToString } from 'solid-js/web'

import { InputNumber } from './input-number'

export function renderInputNumberFixture(): string {
  return renderToString(() => <InputNumber id="horizontal-number" value={12.5} locale="de-DE" />)
}

export function renderVerticalInputNumberFixture(): string {
  return renderToString(() => (
    <InputNumber id="vertical-number" defaultValue={-2.5} locale="en-US" orientation="vertical" />
  ))
}

export function renderHiddenInputNumberFixture(): string {
  return renderToString(() => (
    <InputNumber
      id="hidden-controls-number"
      defaultValue={3.25}
      locale="en-US"
      increment={false}
      decrement={false}
    />
  ))
}
