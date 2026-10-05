import { fireEvent, waitFor } from '@solidjs/testing-library'
import { afterEach, expect, test, vi } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test'

import { SidebarFrame } from './sidebar-frame'
import { useSidebarFrame } from './sidebar-frame-context'

function FixtureContent() {
  const frame = useSidebarFrame()

  return (
    <>
      <SidebarFrame.Sidebar>
        <SidebarFrame.SidebarHeader>
          <span>Header</span>
        </SidebarFrame.SidebarHeader>
        <SidebarFrame.SidebarBody>
          <SidebarFrame.Group>
            <SidebarFrame.GroupLabel as="h2">Navigation</SidebarFrame.GroupLabel>
            <SidebarFrame.Menu>
              <SidebarFrame.Item leading="i-lucide:house" href="/home">
                Home
              </SidebarFrame.Item>
              <SidebarFrame.Sub label="Submenu" leading="i-lucide:folder">
                <SidebarFrame.Item href="/sub-item">Sub Item</SidebarFrame.Item>
              </SidebarFrame.Sub>
            </SidebarFrame.Menu>
          </SidebarFrame.Group>
        </SidebarFrame.SidebarBody>
        <SidebarFrame.SidebarFooter>
          <span>Footer</span>
        </SidebarFrame.SidebarFooter>
      </SidebarFrame.Sidebar>
      <SidebarFrame.Main data-open={frame.isOpen() ? '' : undefined}>
        <SidebarFrame.Trigger>Toggle</SidebarFrame.Trigger>
        <h1>Main content</h1>
      </SidebarFrame.Main>
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
    '/src/navigation/sidebar-frame/sidebar-frame.ssr.fixture.tsx',
    'renderSidebarFrameFixture',
    () => (
      <SidebarFrame>
        <FixtureContent />
      </SidebarFrame>
    ),
  )
  await waitFor(() =>
    expect(container.querySelector('[data-slot="sidebar-frame-sidebar"]')).toBeNull(),
  )
  expect(container.querySelectorAll('h1')).toHaveLength(1)
  expect(container.querySelector('[data-slot="sidebar-frame-main"] h1')?.textContent).toBe(
    'Main content',
  )
  expect(container.querySelectorAll('[data-slot="sidebar-frame-trigger"]')).toHaveLength(1)
  expect(
    container.querySelector('[data-slot="sidebar-frame-trigger"]')?.getAttribute('aria-expanded'),
  ).toBe('false')

  fireEvent.click(container.querySelector('[data-slot="sidebar-frame-trigger"]')!)
  await waitFor(() =>
    expect(document.body.querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe(
      'Sidebar navigation',
    ),
  )

  const dialog = document.body.querySelector('[role="dialog"]')!
  expect(dialog.querySelector('[data-slot="sidebar-frame-group"]')).not.toBeNull()
  expect(dialog.querySelector('h2')?.textContent).toBe('Navigation')
  expect(dialog.querySelector('[data-slot="sidebar-frame-menu"]')).not.toBeNull()
  expect(dialog.querySelector('a[href="/home"]')?.textContent).toBe('Home')
  expect(dialog.querySelector('[data-slot="sidebar-frame-item-leading"]')).not.toBeNull()
  expect(dialog.querySelector('[data-slot="sidebar-frame-sub"]')).not.toBeNull()
})
