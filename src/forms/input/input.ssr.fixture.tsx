import { renderToString } from 'solid-js/web'

import { Input } from './input.tsx'

export function renderInputFixture(): string {
  return renderToString(() => <Input value="Server value" modelModifiers={{ trim: true }} />)
}
