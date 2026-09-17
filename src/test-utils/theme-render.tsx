import { render } from '@solidjs/testing-library'
import type { JSX } from 'solid-js'

/** Renders components with their built-in official presentation. */
export function renderWithTheme(content: () => JSX.Element) {
  return render(content)
}
