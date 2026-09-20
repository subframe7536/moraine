import { fireEvent, render } from '@solidjs/testing-library'
import { createSignal, untrack } from 'solid-js'
import type { JSX } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { useOverlayInteraction } from './interaction'

function RebindableInteraction(props: {
  onEscape: () => void
  setContent: (setContent: (content: HTMLElement) => void) => void
}): JSX.Element {
  const [contentElement, setContentElement] = createSignal<HTMLElement>(
    document.createElement('div'),
  )
  const onEscape = untrack(() => props.onEscape)
  untrack(() => props.setContent((content) => setContentElement(content)))

  useOverlayInteraction({
    contentElement,
    enabled: () => true,
    onEscape,
    requireContent: true,
  })

  return <></>
}

describe('useOverlayInteraction', () => {
  test('rebinds document interactions when the mounted content changes documents', async () => {
    const onEscape = vi.fn()
    const foreignDocument = document.implementation.createHTMLDocument('foreign')
    let setContent: (content: HTMLElement) => void = () => undefined
    const screen = render(() => (
      <RebindableInteraction
        onEscape={onEscape}
        setContent={(nextContent) => (setContent = nextContent)}
      />
    ))

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onEscape).toHaveBeenCalledTimes(1)

    setContent(foreignDocument.createElement('div'))
    await Promise.resolve()

    fireEvent.keyDown(document, { key: 'Escape' })
    foreignDocument.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(onEscape).toHaveBeenCalledTimes(2)

    screen.unmount()
    foreignDocument.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(onEscape).toHaveBeenCalledTimes(2)
  })
})
