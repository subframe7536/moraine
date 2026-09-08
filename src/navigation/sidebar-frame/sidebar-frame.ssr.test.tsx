import { waitFor } from '@solidjs/testing-library'
import { afterEach, expect, test, vi } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test.ts'

import { SidebarFrame, useSidebarFrame } from './sidebar-frame.tsx'

function FixtureContent() {
  const frame = useSidebarFrame()

  return (
    <>
      <SidebarFrame.Sidebar>
        <SidebarFrame.SidebarBody>
          <span>Navigation</span>
        </SidebarFrame.SidebarBody>
      </SidebarFrame.Sidebar>
      <SidebarFrame.Main data-open={frame.isOpen() ? '' : undefined}>
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
    expect(container.querySelector('[data-slot="sidebar"]')).toHaveProperty('hidden', true),
  )
  expect(container.querySelectorAll('h1')).toHaveLength(1)
  expect(container.querySelector('[data-slot="main"] h1')?.textContent).toBe('Main content')
})
