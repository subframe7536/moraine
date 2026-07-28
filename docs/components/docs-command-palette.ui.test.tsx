import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { DocsCommandPalette, DocsSearchTrigger } from './docs-command-palette'

const PAGES = [
  {
    key: 'button',
    label: 'Button',
    description: 'Triggers an action.',
    order: 10,
    tags: ['submit', 'loading'],
    path: '/button',
    group: 'general',
  },
  {
    key: 'tabs',
    label: 'Tabs',
    description: 'Switches between content panels.',
    order: 20,
    tags: ['navigation'],
    path: '/tabs',
    group: 'navigation',
  },
]

describe('Docs search UI', () => {
  test('keeps the search icon in the button leading slot', () => {
    const screen = render(() => <DocsSearchTrigger onOpen={() => undefined} />)
    const trigger = screen.getByRole('button', { name: 'Open search' })

    expect(trigger.firstElementChild?.getAttribute('data-slot')).toBe('leading')
    expect(trigger.textContent).toContain('Search docs')
    expect(trigger.getAttribute('aria-keyshortcuts')).toBe('Meta+K Control+K')
  })

  test('opens from the keyboard shortcut and filters pages', async () => {
    const [open, setOpen] = createSignal(false)
    const onNavigate = vi.fn()
    render(() => (
      <DocsCommandPalette pages={PAGES} open={open} setOpen={setOpen} onNavigate={onNavigate} />
    ))

    await fireEvent.keyDown(window, { key: 'k', metaKey: true })

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="input"]')).not.toBeNull()
    })

    const input = document.body.querySelector('[data-slot="input"]') as HTMLInputElement
    await fireEvent.input(input, { target: { value: 'tabs' } })

    await waitFor(() => {
      const options = document.body.querySelectorAll('[role="option"]')
      expect(options).toHaveLength(1)
      expect(options[0]?.textContent).toContain('Tabs')
    })
  })

  test('claims the global shortcut before page-level listeners', async () => {
    const [open, setOpen] = createSignal(false)
    const competingHandler = vi.fn()
    window.addEventListener('keydown', competingHandler)

    render(() => (
      <DocsCommandPalette
        pages={PAGES}
        open={open}
        setOpen={setOpen}
        onNavigate={() => undefined}
      />
    ))

    await fireEvent.keyDown(document.body, { key: 'k', metaKey: true })

    await waitFor(() => {
      expect(document.body.querySelectorAll('[role="dialog"]')).toHaveLength(1)
      expect(competingHandler).not.toHaveBeenCalled()
    })

    window.removeEventListener('keydown', competingHandler)
  })
})
