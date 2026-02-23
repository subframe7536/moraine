import { fireEvent, render } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { Pagination } from './pagination'

type PaginationProps = Parameters<typeof Pagination>[0]

// @ts-expect-error edge controls are removed
;({ showEdges: true }) satisfies PaginationProps
// @ts-expect-error edge icons are removed
;({ firstIcon: 'icon-chevrons-left' }) satisfies PaginationProps
// @ts-expect-error edge icons are removed
;({ lastIcon: 'icon-chevrons-right' }) satisfies PaginationProps

describe('Pagination', () => {
  test('derives page count from total and itemsPerPage', () => {
    const screen = render(() => (
      <Pagination total={42} itemsPerPage={10} siblingCount={1} showControls={false} />
    ))

    expect(screen.getByText('1')).not.toBeNull()
    expect(screen.getByText('5')).not.toBeNull()
  })

  test('supports controlled page changes', async () => {
    const onPageChange = vi.fn()

    const screen = render(() => (
      <Pagination
        page={2}
        onPageChange={onPageChange}
        total={50}
        itemsPerPage={10}
        showControls={false}
      />
    ))

    await fireEvent.click(screen.getByText('3'))

    expect(onPageChange).toHaveBeenCalledWith(3)

    const current = screen.container.querySelector('[data-current]')
    expect(current?.textContent).toBe('2')
  })

  test('toggles controls visibility', () => {
    const withControls = render(() => <Pagination total={30} itemsPerPage={10} showControls />)

    expect(withControls.container.querySelector('[data-slot="prev"]')).not.toBeNull()
    expect(withControls.container.querySelector('[data-slot="next"]')).not.toBeNull()

    const withoutControls = render(() => (
      <Pagination total={30} itemsPerPage={10} showControls={false} />
    ))

    expect(withoutControls.container.querySelector('[data-slot="prev"]')).toBeNull()
    expect(withoutControls.container.querySelector('[data-slot="next"]')).toBeNull()
  })

  test('renders page items as links when `to` is provided and controls are enabled', () => {
    const screen = render(() => (
      <Pagination
        total={30}
        itemsPerPage={10}
        to={(page) => `/page/${page}`}
        classes={{ item: 'item-override', control: 'control-override' }}
      />
    ))

    const pageLink = screen.getByText('2').closest('a')
    const pageControl = screen.getByText('2').closest('[data-slot="control"]')

    expect(pageLink?.getAttribute('href')).toBe('/page/2')
    expect(pageControl?.className).toContain('control-override')
    expect(pageLink?.className).toContain('item-override')
  })

  test('does not render first/last slots', () => {
    const screen = render(() => <Pagination total={30} itemsPerPage={10} showControls />)

    expect(screen.container.querySelector('[data-slot="first"]')).toBeNull()
    expect(screen.container.querySelector('[data-slot="last"]')).toBeNull()
  })

  test('disables prev/next buttons at boundaries', () => {
    const firstPage = render(() => (
      <Pagination page={1} total={30} itemsPerPage={10} showControls />
    ))

    const prevAtStart = firstPage.container.querySelector(
      '[data-slot="prev"] [data-slot="control"]',
    )
    const nextAtStart = firstPage.container.querySelector(
      '[data-slot="next"] [data-slot="control"]',
    )

    expect(prevAtStart?.getAttribute('disabled')).not.toBeNull()
    expect(nextAtStart?.getAttribute('disabled')).toBeNull()

    const lastPage = render(() => <Pagination page={3} total={30} itemsPerPage={10} showControls />)

    const prevAtEnd = lastPage.container.querySelector('[data-slot="prev"] [data-slot="control"]')
    const nextAtEnd = lastPage.container.querySelector('[data-slot="next"] [data-slot="control"]')

    expect(prevAtEnd?.getAttribute('disabled')).toBeNull()
    expect(nextAtEnd?.getAttribute('disabled')).not.toBeNull()
  })

  test('applies classes overrides to root, list, controls, and ellipsis', () => {
    const screen = render(() => (
      <Pagination
        page={5}
        total={100}
        itemsPerPage={10}
        siblingCount={0}
        classes={{
          root: 'root-override',
          list: 'list-override',
          control: 'control-override',
          item: 'item-override',
          prev: 'prev-override',
          next: 'next-override',
          ellipsis: 'ellipsis-override',
        }}
      />
    ))

    const root = screen.container.querySelector('[data-slot="root"]')
    const list = screen.container.querySelector('[data-slot="list"]')
    const currentPage = screen.getByText('5').closest('[data-slot="control"]')
    const prev = screen.container.querySelector('[data-slot="prev"] [data-slot="control"]')
    const next = screen.container.querySelector('[data-slot="next"] [data-slot="control"]')
    const ellipsis = screen.container.querySelector('[data-slot="ellipsis"] span')

    expect(root?.className).toContain('root-override')
    expect(list?.className).toContain('list-override')
    expect(currentPage?.className).toContain('control-override')
    expect(currentPage?.className).toContain('item-override')
    expect(prev?.className).toContain('control-override')
    expect(prev?.className).toContain('prev-override')
    expect(next?.className).toContain('control-override')
    expect(next?.className).toContain('next-override')
    expect(ellipsis?.className).toContain('ellipsis-override')
  })
})
