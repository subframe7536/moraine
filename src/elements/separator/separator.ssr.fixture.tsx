import { renderToString } from 'solid-js/web'

import { MoraineProvider } from '../../shared/provider'

import { Separator } from './separator'

export function renderSeparatorFixture(): string {
  return renderToString(() => (
    <MoraineProvider>
      <Separator />
    </MoraineProvider>
  ))
}
