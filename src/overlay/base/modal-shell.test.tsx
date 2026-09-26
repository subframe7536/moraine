import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { MoraineProvider } from '../../provider'
import { defineTheme } from '../../theme'
import { Dialog } from '../dialog/dialog'
import { Sheet } from '../sheet/sheet'

describe.each([
  { name: 'Dialog', Root: Dialog },
  { name: 'Sheet', Root: Sheet },
])('$name composition', ({ Root, name }) => {
  const owner = name.toLowerCase()
  test('does not instantiate closed content parts before opening', () => {
    let reads = 0
    const screen = render(() => (
      <Root>
        <Root.Trigger>Open</Root.Trigger>
        <Root.Content title="Title">
          <Root.Body>
            {(() => {
              reads += 1
              return 'Children'
            })()}
          </Root.Body>
        </Root.Content>
      </Root>
    ))
    expect(reads).toBe(0)
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(reads).toBe(1)
    expect(document.body.querySelector(`[data-slot="${owner}-body"]`)?.textContent).toBe('Children')
  })

  test('renders recipe-backed default presentation without a provider', () => {
    render(() => (
      <Root defaultOpen>
        <Root.Trigger>Open</Root.Trigger>
        <Root.Content title="Title" description="Description">
          <Root.Body>Body</Root.Body>
          <Root.Footer>Footer</Root.Footer>
        </Root.Content>
      </Root>
    ))
    const slots = [
      'trigger',
      'overlay',
      'content',
      'header',
      'title',
      'description',
      'content-close',
      'body',
      'footer',
    ]
    expect(
      document.body.querySelector<HTMLElement>(`[data-slot="${owner}-content"]`)?.className,
    ).not.toBe('')
    expect(
      document.body.querySelector<HTMLElement>(`[data-slot="${owner}-overlay"]`)?.className,
    ).not.toBe('')
    const selector = slots.map((slot) => `[data-slot="${owner}-${slot}"]`).join(',')
    for (const element of document.body.querySelectorAll<HTMLElement>(selector)) {
      expect(element.getAttribute('style')).toBeNull()
    }
  })

  test('replaces Design while preserving content identity and focus', () => {
    const key = name === 'Dialog' ? 'dialog' : 'sheet'
    const [design, setDesign] = createSignal(
      defineTheme({
        [key]: { base: { content: 'first-content' } },
      }),
    )
    render(() => (
      <MoraineProvider theme={design()}>
        <Root defaultOpen>
          <Root.Content title="Title">
            <Root.Body>Body</Root.Body>
          </Root.Content>
        </Root>
      </MoraineProvider>
    ))
    const content = document.body.querySelector<HTMLElement>(`[data-slot="${owner}-content"]`)!
    content.focus()
    setDesign(defineTheme({ [key]: { base: { content: 'next-content' } } }))
    expect(document.body.querySelector(`[data-slot="${owner}-content"]`)).toBe(content)
    expect(content.className).toContain('next-content')
    expect(content.className).not.toContain('first-content')
    expect(document.activeElement).toBe(content)
  })

  test('updates modal isolation when root trapFocus changes', async () => {
    const [trapFocus, setTrapFocus] = createSignal(false)
    const screen = render(() => (
      <>
        <main data-testid="background">Background</main>
        <Root defaultOpen trapFocus={trapFocus()}>
          <Root.Content title="Title">Content</Root.Content>
        </Root>
      </>
    ))
    const content = document.body.querySelector(`[data-slot="${owner}-content"]`)!
    const background = screen.getByTestId('background')

    expect(content.getAttribute('aria-modal')).toBeNull()
    expect(background.closest('[aria-hidden="true"]')).toBeNull()
    expect(document.body.style.overflow).toBe('')

    setTrapFocus(true)
    await waitFor(() => {
      expect(content.getAttribute('aria-modal')).toBe('true')
      expect(background.closest('[aria-hidden="true"]')).not.toBeNull()
      expect(document.body.style.overflow).toBe('hidden')
    })

    setTrapFocus(false)
    await waitFor(() => {
      expect(content.getAttribute('aria-modal')).toBeNull()
      expect(background.closest('[aria-hidden="true"]')).toBeNull()
      expect(document.body.style.overflow).toBe('')
    })
  })
})
