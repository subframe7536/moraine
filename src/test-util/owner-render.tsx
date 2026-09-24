import { render } from '@solidjs/testing-library'
import type { JSX } from 'solid-js'

/** Creates reactive test state inside the same Solid owner that renders its consumer. */
export function renderWithOwner<T>(
  createValue: () => T,
  renderContent: (value: T) => JSX.Element,
): { screen: ReturnType<typeof render>; value: T } {
  let value!: T
  const screen = render(() => {
    value = createValue()
    return renderContent(value)
  })

  return { screen, value }
}
