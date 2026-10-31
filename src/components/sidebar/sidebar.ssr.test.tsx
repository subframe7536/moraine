import { fireEvent, waitFor } from '@solidjs/testing-library'
import { afterEach, expect, test, vi } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test'

import { Sidebar } from './sidebar'
import { useSidebarContext } from './sidebar-context'

function FixtureContent() {
  const frame = useSidebarContext()

  return (
    <>
      <Sidebar.Panel>
        <Sidebar.Header>
          <span>Header</span>
        </Sidebar.Header>
        <Sidebar.Content>
          <Sidebar.Group>
            <Sidebar.GroupLabel as="h2">Navigation</Sidebar.GroupLabel>
            <Sidebar.Menu>
              <Sidebar.MenuItem>
                <Sidebar.MenuButton leading="i-lucide:house" href="/home">
                  Home
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
              <Sidebar.MenuItem>
                <Sidebar.MenuButton href="/project">Project</Sidebar.MenuButton>
                <Sidebar.MenuAction>
                  <button type="button">Project options</button>
                </Sidebar.MenuAction>
              </Sidebar.MenuItem>
              <Sidebar.MenuItem>
                <Sidebar.MenuSub>
                  <Sidebar.MenuSubTrigger leading="i-lucide:folder">Submenu</Sidebar.MenuSubTrigger>
                  <Sidebar.MenuSubContent>
                    <Sidebar.MenuItem>
                      <Sidebar.MenuButton href="/sub-item">Sub Item</Sidebar.MenuButton>
                    </Sidebar.MenuItem>
                  </Sidebar.MenuSubContent>
                </Sidebar.MenuSub>
              </Sidebar.MenuItem>
            </Sidebar.Menu>
          </Sidebar.Group>
        </Sidebar.Content>
        <Sidebar.Footer>
          <span>Footer</span>
        </Sidebar.Footer>
      </Sidebar.Panel>
      <Sidebar.Inset data-open={frame.isOpen() ? '' : undefined}>
        <Sidebar.Trigger>Toggle</Sidebar.Trigger>
        <h1>Main content</h1>
      </Sidebar.Inset>
    </>
  )
}

const originalMatchMedia = window.matchMedia
afterEach(() => {
  window.matchMedia = originalMatchMedia
})

test('replaces the SSR desktop layout without retaining duplicate mobile content', async () => {
  window.matchMedia = vi
    .fn()
    .mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })
  const { container } = hydrateFixture(
    '/src/components/sidebar/sidebar.ssr.fixture.tsx',
    'renderSidebarFixture',
    () => (
      <Sidebar panelId="sidebar-fixture">
        <FixtureContent />
      </Sidebar>
    ),
  )
  await waitFor(() => expect(container.querySelector('[data-slot="sidebar-panel"]')).toBeNull())
  expect(container.querySelectorAll('h1')).toHaveLength(1)
  expect(container.querySelector('[data-slot="sidebar-inset"] h1')?.textContent).toBe(
    'Main content',
  )
  expect(container.querySelectorAll('[data-slot="sidebar-trigger"]')).toHaveLength(1)
  expect(
    container.querySelector('[data-slot="sidebar-trigger"]')?.getAttribute('aria-expanded'),
  ).toBe('false')
  expect(
    container.querySelector('[data-slot="sidebar-trigger"]')?.getAttribute('aria-controls'),
  ).toBeNull()

  fireEvent.click(container.querySelector('[data-slot="sidebar-trigger"]')!)
  await waitFor(() =>
    expect(document.body.querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe(
      'Sidebar navigation',
    ),
  )

  const dialog = document.body.querySelector('[role="dialog"]')!
  expect(dialog.querySelector('[data-slot="sidebar-group"]')).not.toBeNull()
  expect(dialog.querySelector('ul[data-slot="sidebar-menu"] > li')).not.toBeNull()
  expect(dialog.querySelector('h2')?.textContent).toBe('Navigation')
  expect(dialog.querySelector('a[href="/home"]')?.textContent).toBe('Home')
  expect(dialog.querySelector('[data-slot="sidebar-menu-button-leading"]')).not.toBeNull()
  expect(dialog.querySelector('[data-slot="sidebar-menu-sub"]')).not.toBeNull()
  expect(
    container.querySelector('[data-slot="sidebar-trigger"]')?.getAttribute('aria-controls'),
  ).toBe('sidebar-fixture')
})
