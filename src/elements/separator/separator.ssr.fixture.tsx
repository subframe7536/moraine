import { renderToString } from 'solid-js/web'

import { MoraineProvider } from '../../shared/provider'
import { defaultTheme } from '../../theme'

import { Separator } from './separator'

export function renderSeparatorFixture(): string {
  return renderToString(() => (
    <MoraineProvider theme={defaultTheme}>
      <Separator />
    </MoraineProvider>
  ))
}
