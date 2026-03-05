import { fireEvent, render } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { Pagination } from './pagination'

describe('Pagination', () => {
  test('renders semantic root attributes by default', () => {
    const screen = render(() => <Pagination total={30} itemsPerPage={10} />)
    const root = screen.container.querySelector('[data-slot="root"]')

    expect(root?.getAttribute('aria-label')).toBe('Pagination')
    expect(root?.getAttribute('role')).toBe('navigation')
  })

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

    const current = screen.container.querySelector('[data-slot="link"][aria-current="page"]')
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

  test('renders page items and controls as links when `to` is provided', () => {
    const screen = render(() => (
      <Pagination page={2} total={30} itemsPerPage={10} to={(page) => `/page/${page}`} />
    ))

    const prev = screen.container.querySelector('[data-slot="prev"]')
    const pageLink = screen.getByText('3').closest('[data-slot="link"]')
    const next = screen.container.querySelector('[data-slot="next"]')

    expect(prev?.tagName).toBe('A')
    expect(prev?.getAttribute('rel')).toBe('prev')
    expect(prev?.getAttribute('href')).toBe('/page/1')
    expect(pageLink?.tagName).toBe('A')
    expect(pageLink?.getAttribute('href')).toBe('/page/3')
    expect(next?.tagName).toBe('A')
    expect(next?.getAttribute('rel')).toBe('next')
    expect(next?.getAttribute('href')).toBe('/page/3')
  })

  test('uses disabled buttons when boundary is reached or `to` is absent', () => {
    const firstPage = render(() => (
      <Pagination
        page={1}
        total={30}
        itemsPerPage={10}
        to={(page) => `/page/${page}`}
        showControls
      />
    ))

    const prevAtStart = firstPage.container.querySelector('[data-slot="prev"]')
    const nextAtStart = firstPage.container.querySelector('[data-slot="next"]')

    expect(prevAtStart?.tagName).toBe('BUTTON')
    expect(prevAtStart?.getAttribute('disabled')).not.toBeNull()
    expect(nextAtStart?.tagName).toBe('A')
    expect(nextAtStart?.getAttribute('href')).toBe('/page/2')

    const withoutTo = render(() => (
      <Pagination page={2} total={30} itemsPerPage={10} showControls={false} />
    ))

    const pageControl = withoutTo.getByText('3').closest('[data-slot="link"]')
    expect(pageControl?.tagName).toBe('BUTTON')
  })

  test('applies current-page aria attributes and labels', () => {
    const screen = render(() => (
      <Pagination page={5} total={100} itemsPerPage={10} siblingCount={1} showControls />
    ))

    const currentPage = screen.getByLabelText('Page 5, current page')
    const anotherPage = screen.getByLabelText('Go to page 4')

    expect(currentPage?.getAttribute('aria-current')).toBe('page')
    expect(anotherPage?.getAttribute('aria-current')).toBeNull()
  })

  test('renders ellipsis in `li[data-slot=item][aria-hidden]`', () => {
    const screen = render(() => (
      <Pagination page={5} total={100} itemsPerPage={10} siblingCount={1} showControls={false} />
    ))

    const ellipsisNodes = screen.container.querySelectorAll(
      'li[data-slot="item"][aria-hidden] > [data-slot="ellipsis"]',
    )

    expect(ellipsisNodes.length).toBe(2)
  })

  test('does not expose pagination-specific icon/label slots', () => {
    const screen = render(() => <Pagination total={30} itemsPerPage={10} showControls />)

    expect(screen.container.querySelector('[data-slot="prev-icon"]')).toBeNull()
    expect(screen.container.querySelector('[data-slot="prev-label"]')).toBeNull()
    expect(screen.container.querySelector('[data-slot="next-icon"]')).toBeNull()
    expect(screen.container.querySelector('[data-slot="next-label"]')).toBeNull()
  })

  test('applies classes overrides to root, list, item, control, link, prev, next and ellipsis', () => {
    const screen = render(() => (
      <Pagination
        page={5}
        total={100}
        itemsPerPage={10}
        siblingCount={0}
        classes={{
          root: 'root-override',
          list: 'list-override',
          item: 'item-override',
          link: 'link-override',
          prev: 'prev-override',
          next: 'next-override',
          ellipsis: 'ellipsis-override',
        }}
      />
    ))

    const root = screen.container.querySelector('[data-slot="root"]')
    const list = screen.container.querySelector('[data-slot="list"]')
    const currentPage = screen.getByLabelText('Page 5, current page')
    const pageItem = currentPage.closest('li[data-slot="item"]')
    const prev = screen.container.querySelector('[data-slot="prev"]')
    const next = screen.container.querySelector('[data-slot="next"]')
    const ellipsis = screen.container.querySelector('[data-slot="ellipsis"]')

    expect(root?.className).toContain('root-override')
    expect(list?.className).toContain('list-override')
    expect(pageItem?.className).toContain('item-override')
    expect(currentPage?.className).toContain('link-override')
    expect(prev?.className).toContain('prev-override')
    expect(next?.className).toContain('next-override')
    expect(ellipsis?.className).toContain('ellipsis-override')
  })
})
