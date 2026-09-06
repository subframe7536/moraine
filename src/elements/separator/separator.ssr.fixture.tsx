import { renderToString } from 'solid-js/web'

import { createDesign } from '../../design.ts'
import { MoraineProvider } from '../../shared/provider/index.ts'

import { Separator } from './separator.tsx'

const officialDesign = createDesign()

export function renderSeparatorFixture(): string {
  return renderToString(() => (
    <MoraineProvider design={officialDesign}>
      <Separator />
    </MoraineProvider>
  ))
}
