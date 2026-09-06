import { waitFor } from '@solidjs/testing-library'
import { afterEach, expect, test, vi } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test.ts'

import { SidebarFrame } from './sidebar-frame.tsx'

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
      <SidebarFrame
        sidebarBodyRender={() => <span>Navigation</span>}
        mainRender={() => <h1>Main content</h1>}
      />
    ),
  )
  await waitFor(() => expect(container.querySelector('[data-slot="layout"]')).toBeNull())
  expect(container.querySelectorAll('h1')).toHaveLength(1)
  expect(container.querySelector('[data-slot="main"] h1')?.textContent).toBe('Main content')
})
