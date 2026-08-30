import { fireEvent } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { hydrateFixture, renderSsrFixture } from '../../test-utils/ssr-test.ts'

import { Pagination } from './pagination.tsx'

describe('Pagination SSR Hydration', () => {
  test('renders deterministic single-page SSR markup', () => {
    const markup = renderSsrFixture(
      '/src/navigation/pagination/pagination.ssr.fixture.tsx',
      'renderSinglePagePaginationFixture',
    )

    expect(markup.match(/data-slot="link"/g)).toHaveLength(1)
    expect(markup).toContain('Page 1 of 1')
    expect(markup).not.toContain('data-slot="ellipsis"')
  })

  test('hydrates ellipsis link mode without replacing nodes and handles first navigation', () => {
    const [page, setPage] = createSignal(5)

    const { container } = hydrateFixture(
      '/src/navigation/pagination/pagination.ssr.fixture.tsx',
      'renderPaginationFixture',
      () => (
        <Pagination
          page={page()}
          onPageChange={setPage}
          total={100}
          itemsPerPage={10}
          siblingCount={1}
          to={(target) => `#page-${target}`}
        />
      ),
    )

    const root = container.querySelector('[data-slot="root"]')
    const list = container.querySelector('[data-slot="list"]')
    const status = container.querySelector('[data-slot="status"]')

    expect(root).not.toBeNull()
    expect(list).not.toBeNull()
    expect(status).not.toBeNull()
    expect(container.querySelectorAll('[data-slot="ellipsis"]')).toHaveLength(2)

    fireEvent.click(container.querySelector('[data-slot="next"]')!)
    expect(status?.textContent?.replace(/\s+/g, ' ').trim()).toBe('Page 6 of 10')
  })
})
