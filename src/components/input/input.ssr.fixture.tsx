import { renderToString } from '@solidjs/web'

import { Input } from './input'
export function renderInputFixture(): string {
  return renderToString(() => <Input value="Server value" modifiers={{ trim: true }} />)
}
