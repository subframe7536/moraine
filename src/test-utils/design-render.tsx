import { render } from '@solidjs/testing-library'
import type { JSX } from 'solid-js'

import { createDesign } from '../design.ts'
import { MoraineProvider } from '../shared/provider/index.ts'

const officialDesign = createDesign()

/** Explicit presentation setup for tests that assert official Design output. */
export function renderWithDesign(content: () => JSX.Element) {
  return render(() => <MoraineProvider design={officialDesign}>{content()}</MoraineProvider>)
}
