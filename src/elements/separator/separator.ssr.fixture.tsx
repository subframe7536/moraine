import { renderToString } from 'solid-js/web'

import { Separator } from './separator.tsx'

export function renderSeparatorFixture(): string {
  return renderToString(() => <Separator />)
}
