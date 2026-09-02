import { fireEvent } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test'

import { Breadcrumb } from './breadcrumb'
import { renderBreadcrumbItem } from './breadcrumb.ssr.fixture'

describe('Breadcrumb SSR Hydration', () => {
  test('hydrates the default page branch without replacing the trail', () => {
    const { container } = hydrateFixture(
      '/src/navigation/breadcrumb/breadcrumb.ssr.fixture.tsx',
      'renderBreadcrumbDefaultFixture',
      () => (
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Current', href: '/current' },
          ]}
        />
      ),
    )

    const root = container.querySelector('[data-slot="root"]')
    const list = container.querySelector('[data-slot="list"]')
    const page = container.querySelector('[data-slot="page"]')
    const separator = container.querySelector('[data-slot="separator"]')

    expect(root).not.toBeNull()
    expect(list).not.toBeNull()
    expect(page).not.toBeNull()
    expect(separator).not.toBeNull()
  })

  test('hydrates a custom renderer without replacing the trail and preserves activation', () => {
    const onClick = vi.fn((event: MouseEvent) => event.preventDefault())

    const { container } = hydrateFixture(
      '/src/navigation/breadcrumb/breadcrumb.ssr.fixture.tsx',
      'renderBreadcrumbFixture',
      () => (
        <Breadcrumb
          aria-label="Fixture breadcrumbs"
          itemRender={renderBreadcrumbItem}
          items={[
            { label: 0, href: '/zero', onClick },
            { label: 'Current', href: '/current' },
          ]}
        />
      ),
    )

    const root = container.querySelector('[data-slot="root"]')
    const list = container.querySelector('[data-slot="list"]')
    const firstLink = container.querySelector<HTMLElement>('[data-slot="custom-link"]')

    expect(root).not.toBeNull()
    expect(list).not.toBeNull()
    expect(firstLink).not.toBeNull()

    fireEvent.click(firstLink!)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
