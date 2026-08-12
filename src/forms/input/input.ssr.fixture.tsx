import { renderToString } from 'solid-js/web'

import { Input } from './input.tsx'

export function renderInputFixture(): string {
  return renderToString(() => (
    <Input value="Server value" leading="i-lucide-search" trailing="i-lucide-at-sign">
      <button type="button" data-testid="nested-action">
        Action
      </button>
    </Input>
  ))
}
