import { renderToString } from 'solid-js/web'

import { Separator } from './separator'

export function renderSeparatorFixture(): string {
  return renderToString(() => <Separator />)
}
