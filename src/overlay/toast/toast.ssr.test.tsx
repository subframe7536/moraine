import { describe, expect, test } from 'vitest'

import { hydrateFixture, renderSsrFixture } from '../../test-util/ssr-test'

import { Toast } from './toast'

describe('Toast SSR Hydration', () => {
  test('server renders empty shell safely without portal leak', () => {
    const html = renderSsrFixture('/src/overlay/toast/toast.ssr.fixture.tsx', 'renderToastFixture')
    expect(html).not.toContain('role="region"')
  })

  test('hydrates cleanly and mounts portal on client', async () => {
    Toast.close()
    const { container } = hydrateFixture(
      '/src/overlay/toast/toast.ssr.fixture.tsx',
      'renderToastFixture',
      () => <Toast />,
    )

    expect(container).not.toBeNull()

    const region = document.querySelector('[role="region"]')
    expect(region).not.toBeNull()
    expect(region?.getAttribute('aria-label')).toContain('Notifications')

    Toast.add({ title: 'Hydrated toast message' })
    const item = document.querySelector('[data-slot="toast"]')
    expect(item).not.toBeNull()
    expect(item?.textContent).toContain('Hydrated toast message')

    Toast.close()
  })
})
