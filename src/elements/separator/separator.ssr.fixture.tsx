import { renderToString } from 'solid-js/web'

import { MoraineProvider } from '../../shared/provider/index.ts'
import { createTheme } from '../../theme.ts'

import { Separator } from './separator.tsx'

const officialDesign = createTheme()

export function renderSeparatorFixture(): string {
  return renderToString(() => (
    <MoraineProvider theme={officialDesign}>
      <Separator />
    </MoraineProvider>
  ))
}
