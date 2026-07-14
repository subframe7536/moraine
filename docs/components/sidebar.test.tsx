import { fireEvent, render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { Sidebar } from './sidebar'

const page = (key: string, group: string, badge?: string) => ({
  key,
  label: key,
  description: `${key} description`,
  order: 10,
  tags: [key],
  path: `/${key}`,
  group,
  ...(badge ? { badge } : {}),
})

describe('Sidebar', () => {
  test('renders optional badge labels for pages', () => {
    const [activePage] = createSignal('button')

    const screen = render(() => (
      <Sidebar
        pages={[
          { ...page('button', 'general', 'New'), label: 'Button' },
          { ...page('tabs', 'navigation', 'Updated'), label: 'Tabs' },
          { ...page('sidebar-frame', 'navigation', 'Preview'), label: 'Sidebar Frame' },
          { ...page('card', 'general'), label: 'Card' },
        ]}
        activePage={activePage}
        setActivePage={() => undefined}
      />
    ))

    expect(screen.getByText('New')).toBeDefined()
    expect(screen.getByText('Updated')).toBeDefined()
    expect(screen.getByText('Preview')).toBeDefined()
  })

  test('keeps badged pages clickable', async () => {
    const [activePage] = createSignal('button')
    const setActivePage = vi.fn()

    const screen = render(() => (
      <Sidebar
        pages={[{ ...page('sidebar-frame', 'navigation', 'New'), label: 'Sidebar Frame' }]}
        activePage={activePage}
        setActivePage={setActivePage}
      />
    ))

    const rowButton = screen.getByText('Sidebar Frame').closest('button') as HTMLButtonElement
    await fireEvent.click(rowButton)

    expect(setActivePage).toHaveBeenCalledWith('sidebar-frame')
  })

  test('links to the LLM documentation index as Markdown', () => {
    const [activePage] = createSignal('button')

    const screen = render(() => (
      <Sidebar
        pages={[page('button', 'general')]}
        activePage={activePage}
        setActivePage={() => undefined}
      />
    ))

    const link = screen.getByRole('link', { name: 'llms.txt' })
    expect(link.getAttribute('href')).toBe('/llms.txt')
    expect(link.getAttribute('rel')).toBe('alternate external')
    expect(link.getAttribute('type')).toBe('text/markdown')
  })
})
