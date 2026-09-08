import { render } from '@solidjs/testing-library'
import type { JSX } from 'solid-js'

import { MoraineProvider } from '../shared/provider/index.ts'

/** Provides official presentation for component style assertions. */
export function renderWithTheme(content: () => JSX.Element) {
  return render(() => <MoraineProvider>{content()}</MoraineProvider>)
}
