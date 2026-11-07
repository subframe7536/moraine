import { renderToString } from 'solid-js/web'

import { PinInput } from './pin-input'

export function renderPinInputFixture(): string {
  return renderToString(() => <PinInput id="test-pin" defaultValue={['1', '2', '3']} length={5} />)
}

export function renderPinInputWithSeparatorsFixture(): string {
  return renderToString(() => (
    <PinInput id="sep-pin" defaultValue="123456" length={6} separator={3} />
  ))
}
