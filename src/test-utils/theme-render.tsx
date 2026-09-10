import { render } from '@solidjs/testing-library'
import type { JSX } from 'solid-js'

import { MoraineProvider } from '../shared/provider'
import { defaultTheme } from '../theme/default-theme'

/** Provides official presentation for component style assertions. */
export function renderWithTheme(content: () => JSX.Element) {
  return render(() => <MoraineProvider theme={defaultTheme}>{content()}</MoraineProvider>)
}
