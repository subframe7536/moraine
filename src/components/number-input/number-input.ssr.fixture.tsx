import { renderToString } from 'solid-js/web'

import { NumberInput } from './number-input'

export function renderNumberInputFixture(): string {
  return renderToString(() => <NumberInput id="horizontal-number" value={12.5} locale="de-DE" />)
}

export function renderVerticalNumberInputFixture(): string {
  return renderToString(() => (
    <NumberInput id="vertical-number" defaultValue={-2.5} locale="en-US" orientation="vertical" />
  ))
}

export function renderHiddenNumberInputFixture(): string {
  return renderToString(() => (
    <NumberInput
      id="hidden-controls-number"
      defaultValue={3.25}
      locale="en-US"
      increment={false}
      decrement={false}
    />
  ))
}
