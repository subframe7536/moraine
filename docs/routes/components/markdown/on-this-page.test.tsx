import { MemoryRouter, Route } from '@solidjs/router'
import { fireEvent, render, screen } from '@solidjs/testing-library'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { OnThisPage } from './on-this-page.tsx'

const originalScrollIntoView = HTMLElement.prototype.scrollIntoView
const originalUrl = window.location.href

afterEach(() => {
  document.body.innerHTML = ''
  HTMLElement.prototype.scrollIntoView = originalScrollIntoView
  window.history.replaceState(null, '', originalUrl)
  vi.restoreAllMocks()
})

describe('OnThisPage', () => {
  test('renders semantic anchors and preserves modified activation', () => {
    render(() => (
      <MemoryRouter>
        <Route
          path="/*"
          component={() => <OnThisPage entries={[{ id: 'usage', label: 'Usage', level: 2 }]} />}
        />
      </MemoryRouter>
    ))

    const link = screen.getByRole('link', { name: 'Usage' })
    expect(link.getAttribute('href')).toBe('#usage')

    const preventDefault = vi.fn()
    link.addEventListener('click', (event) => {
      if (event.defaultPrevented) {
        preventDefault()
      }
    })
    fireEvent.click(link, { ctrlKey: true })
    expect(preventDefault).not.toHaveBeenCalled()
  })

  test('marks the initial browser fragment as the current location without scrolling', () => {
    const scrollIntoView = vi.fn()
    HTMLElement.prototype.scrollIntoView = scrollIntoView
    window.history.replaceState(null, '', '/button#usage')

    render(() => (
      <MemoryRouter>
        <Route
          path="/*"
          component={() => <OnThisPage entries={[{ id: 'usage', label: 'Usage', level: 2 }]} />}
        />
      </MemoryRouter>
    ))

    expect(screen.getByRole('link', { name: 'Usage' }).getAttribute('aria-current')).toBe('location')
    expect(scrollIntoView).not.toHaveBeenCalled()
  })
})
