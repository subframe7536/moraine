import { renderToString } from '@solidjs/web'

import { MoraineProvider } from '../../provider'

import { Separator } from './separator'
export function renderSeparatorFixture(): string {
  return renderToString(() => (
    <MoraineProvider>
      <Separator />
    </MoraineProvider>
  ))
}
