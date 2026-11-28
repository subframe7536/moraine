import { flush } from 'solid-js'
import { describe, expect, it } from 'vitest'

import { hydrateFixture, renderSsrFixture } from '../../test-util/ssr-test'

import { Toast } from './toast'
describe('toast SSR Hydration', () => {
  it('server renders empty shell safely without portal leak', () => {
    const html = renderSsrFixture(
      '/src/components/toast/toast.ssr.fixture.tsx',
      'renderToastFixture',
    )
    expect(html).not.toContain('role="region"')
  })

  it('hydrates cleanly and mounts portal on client', async () => {
    Toast.close()
    const { container } = hydrateFixture(
      '/src/components/toast/toast.ssr.fixture.tsx',
      'renderToastFixture',
      () => <Toast />,
    )

    expect(container).not.toBeNull()

    const region = document.querySelector('[role="region"]')
    expect(region).not.toBeNull()
    expect(region?.getAttribute('aria-label')).toContain('Notifications')

    flush(() => Toast.show({ title: 'Hydrated toast message' }))
    const item = document.querySelector('[data-slot="toast-item"]')
    expect(item).not.toBeNull()
    expect(item?.textContent).toContain('Hydrated toast message')

    Toast.close()
  })
})
