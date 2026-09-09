import { renderToString } from 'solid-js/web'

import { MoraineProvider } from '../../shared/provider/index.ts'
import { defaultTheme } from '../../theme.ts'

import { Separator } from './separator.tsx'

export function renderSeparatorFixture(): string {
  return renderToString(() => (
    <MoraineProvider theme={defaultTheme}>
      <Separator />
    </MoraineProvider>
  ))
}
