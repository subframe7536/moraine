import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterEach, expect, test, vi } from 'vitest'

import { SidebarFrame } from '../../../../src'
import type { ThemeMode } from '../../hooks/use-theme'

import { DocsHeader } from './docs-header'

vi.mock('@solidjs/router', () => ({
  useLocation: () => ({ pathname: '/docs/getting-started' }),
  useNavigate: () => vi.fn(),
}))

afterEach(cleanup)

function setup() {
  const [mobile, setMobile] = createSignal(false)
  const [theme, setTheme] = createSignal<ThemeMode>('light')
  const [paletteOpen, setPaletteOpen] = createSignal(false)
  render(() => (
    <SidebarFrame isMobile={mobile()}>
      <DocsHeader
        pages={[]}
        paletteOpen={paletteOpen}
        setPaletteOpen={setPaletteOpen}
        onNavigate={vi.fn()}
        theme={theme}
        updateTheme={setTheme}
      />
    </SidebarFrame>
  ))
  return { setMobile, theme, paletteOpen }
}

test('search keeps its shortcut inside desktop content and removes it on mobile', () => {
  const { setMobile } = setup()
  const search = screen.getByRole('button', { name: 'Open search' })
  expect(search.textContent).toContain('Search docs')
  expect(search.textContent).toContain('⌘')
  expect(search.querySelector('[data-slot="button-trailing"]')).toBeNull()
  setMobile(true)
  expect(search.textContent).not.toContain('Search docs')
  expect(search.textContent).not.toContain('⌘')
  expect(search.textContent).not.toContain('K')
  fireEvent.click(search)
  expect(screen.getByPlaceholderText('Search components, hooks, and pages...')).not.toBeNull()
})

test('surface links and menu follow the same frame state, and theme controls name their action', () => {
  const { setMobile, theme } = setup()
  expect(screen.getByRole('link', { name: 'Docs' }).getAttribute('aria-current')).toBe('true')
  expect(screen.queryByRole('button', { name: 'Toggle sidebar' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Switch to dark theme' }))
  expect(theme()).toBe('dark')
  expect(screen.getByRole('button', { name: 'Switch to light theme' })).not.toBeNull()
  setMobile(true)
  expect(screen.queryByRole('link', { name: 'Docs' })).toBeNull()
  expect(screen.getByRole('button', { name: 'Toggle sidebar' })).not.toBeNull()
})
