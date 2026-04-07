import { fireEvent, render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { Sidebar } from './sidebar'

describe('Sidebar', () => {
  test('renders optional status labels for pages', () => {
    const [activePage] = createSignal('button')
    const [search] = createSignal('')

    const screen = render(() => (
      <Sidebar
        pages={[
          { key: 'button', label: 'Button', group: 'general', status: 'new' },
          { key: 'tabs', label: 'Tabs', group: 'navigation', status: 'update' },
          {
            key: 'sidebar-frame',
            label: 'Sidebar Frame',
            group: 'navigation',
            status: 'unreleased',
          },
          { key: 'card', label: 'Card', group: 'general' },
        ]}
        activePage={activePage}
        setActivePage={() => undefined}
        search={search}
      />
    ))

    expect(screen.getByText('NEW')).toBeDefined()
    expect(screen.getByText('UPDATE')).toBeDefined()
    expect(screen.getByText('UNRELEASED')).toBeDefined()
  })

  test('keeps unreleased pages clickable', async () => {
    const [activePage] = createSignal('button')
    const [search] = createSignal('')
    const setActivePage = vi.fn()

    const screen = render(() => (
      <Sidebar
        pages={[
          {
            key: 'sidebar-frame',
            label: 'Sidebar Frame',
            group: 'navigation',
            status: 'unreleased',
          },
        ]}
        activePage={activePage}
        setActivePage={setActivePage}
        search={search}
      />
    ))

    const rowButton = screen.getByText('Sidebar Frame').closest('button') as HTMLButtonElement
    await fireEvent.click(rowButton)

    expect(setActivePage).toHaveBeenCalledWith('sidebar-frame')
  })
})
