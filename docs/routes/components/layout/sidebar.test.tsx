import { fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { Sidebar } from './sidebar.tsx'

describe('Sidebar', () => {
  test('renders page entries as semantic links and marks the active page', () => {
    const close = vi.fn()
    const [activePage] = createSignal('button')

    render(() => (
      <Sidebar
        pages={[
          {
            key: 'introduction',
            label: 'Introduction',
            description: 'Start here.',
            order: 1,
            tags: [],
            path: '/',
            sections: [],
          },
          {
            key: 'button',
            label: 'Button',
            description: 'Trigger an action.',
            order: 2,
            tags: [],
            group: 'general',
            path: '/button',
            sections: [],
          },
        ]}
        activePage={activePage}
        setActivePage={close}
      />
    ))

    const button = screen.getByRole('link', { name: 'Button' })
    expect(button.getAttribute('href')).toBe('/button')
    expect(button.getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('link', { name: 'Introduction' }).hasAttribute('aria-current')).toBe(
      false,
    )

    button.addEventListener('click', (event) => event.preventDefault(), { once: true })
    fireEvent.click(button, { ctrlKey: true })
    expect(close).not.toHaveBeenCalled()

    button.addEventListener('click', (event) => event.preventDefault(), { once: true })
    fireEvent.click(button)
    expect(close).toHaveBeenCalledOnce()
  })
})
