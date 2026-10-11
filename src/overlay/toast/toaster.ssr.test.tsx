import { describe, expect, test } from 'vitest'

import { hydrateFixture, renderSsrFixture } from '../../test-util/ssr-test'

import { toast } from './toast-store'
import { Toaster } from './toaster'

describe('Toaster SSR Hydration', () => {
  test('server renders empty shell safely without portal leak', () => {
    const html = renderSsrFixture(
      '/src/overlay/toast/toaster.ssr.fixture.tsx',
      'renderToasterFixture',
    )
    expect(html).not.toContain('role="region"')
  })

  test('hydrates cleanly and mounts portal on client', async () => {
    toast.clear()
    const { container } = hydrateFixture(
      '/src/overlay/toast/toaster.ssr.fixture.tsx',
      'renderToasterFixture',
      () => <Toaster />,
    )

    expect(container).not.toBeNull()

    // Microtask runs to mount client portal
    await Promise.resolve()

    const region = document.querySelector('[role="region"]')
    expect(region).not.toBeNull()
    expect(region?.getAttribute('aria-label')).toContain('Notifications')

    toast.add('Hydrated toast message')
    const item = document.querySelector('[data-slot="toast"]')
    expect(item).not.toBeNull()
    expect(item?.textContent).toContain('Hydrated toast message')

    toast.clear()
  })
})
