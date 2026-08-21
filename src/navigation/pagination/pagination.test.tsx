import { fireEvent, render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { hydrate } from 'solid-js/web'
import { describe, expect, test, vi } from 'vitest'

import { installHydrationState, renderSsrFixture } from '../../test-utils/ssr-test.ts'

import { Pagination } from './pagination.tsx'

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

  test('normalizes non-finite pagination inputs to finite defaults', () => {
    const screen = render(() => (
      <Pagination
        total={Number.POSITIVE_INFINITY}
        itemsPerPage={Number.NaN}
        siblingCount={Number.NEGATIVE_INFINITY}
        page={Number.POSITIVE_INFINITY}
      />
    ))

    const status = screen.container.querySelector('[data-slot="status"]')
    expect(status?.textContent?.replace(/\s+/g, ' ').trim()).toBe('Page 1 of 1')
    expect(screen.container.textContent).not.toContain('Infinity')
    expect(screen.container.textContent).not.toContain('NaN')
  })

  test.each([
    [{ total: -5 }, 'Page 1 of 1'],
    [{ total: 42.9, itemsPerPage: 10.9, page: 3.9 }, 'Page 3 of 5'],
    [{ total: 3, itemsPerPage: 0, defaultPage: -4 }, 'Page 1 of 3'],
    [{ total: 30, itemsPerPage: Number.POSITIVE_INFINITY }, 'Page 1 of 3'],
  ] as const)('normalizes fractional and out-of-range inputs %#', (input, expected) => {
    const screen = render(() => <Pagination {...input} />)
    const status = screen.container.querySelector('[data-slot="status"]')

    expect(status?.textContent?.replace(/\s+/g, ' ').trim()).toBe(expected)
  })

  test('bounds very large finite sibling counts without allocating an unbounded range', () => {
    const screen = render(() => (
      <Pagination
        total={Number.MAX_SAFE_INTEGER}
        itemsPerPage={1}
        page={4_000_000_000}
        siblingCount={Number.MAX_SAFE_INTEGER}
        showControls={false}
      />
    ))

    expect(screen.container.querySelectorAll('[data-slot="link"]').length).toBeLessThanOrEqual(205)
    expect(
      screen.getByLabelText('Page 4000000000 of 9007199254740991, current page'),
    ).not.toBeNull()
  })

  test('retains the requested page while the reactive page domain temporarily shrinks', () => {
    const [total, setTotal] = createSignal(100)
    const onPageChange = vi.fn()
    const screen = render(() => (
      <Pagination defaultPage={8} total={total()} itemsPerPage={10} onPageChange={onPageChange} />
    ))
    const status = () =>
      screen.container
        .querySelector('[data-slot="status"]')
        ?.textContent?.replace(/\s+/g, ' ')
        .trim()

    expect(status()).toBe('Page 8 of 10')
    setTotal(20)
    expect(status()).toBe('Page 2 of 2')
    setTotal(100)
    expect(status()).toBe('Page 8 of 10')
    expect(onPageChange).not.toHaveBeenCalled()
  })

  test('clamps a controlled request without publishing during page-domain changes', () => {
    const [total, setTotal] = createSignal(20)
    const onPageChange = vi.fn()
    const screen = render(() => (
      <Pagination page={8} total={total()} itemsPerPage={10} onPageChange={onPageChange} />
    ))
    const status = () =>
      screen.container
        .querySelector('[data-slot="status"]')
        ?.textContent?.replace(/\s+/g, ' ')
        .trim()

    expect(status()).toBe('Page 2 of 2')
    setTotal(100)
    expect(status()).toBe('Page 8 of 10')
    expect(onPageChange).not.toHaveBeenCalled()
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

  test('does not change pages when a caller cancels the click during capture', async () => {
    const onPageChange = vi.fn()
    const screen = render(() => (
      <Pagination
        defaultPage={2}
        onPageChange={onPageChange}
        oncapture:click={(event: MouseEvent) => event.preventDefault()}
        total={50}
        itemsPerPage={10}
        showControls={false}
      />
    ))

    await fireEvent.click(screen.getByText('3'))

    expect(onPageChange).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Page 2 of 5, current page')).not.toBeNull()
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

  test('renders icon-only controls with icons in Button children', () => {
    const screen = render(() => <Pagination total={30} itemsPerPage={10} showControls />)
    const prev = screen.container.querySelector('[data-slot="prev"]')
    const next = screen.container.querySelector('[data-slot="next"]')

    expect(prev?.getAttribute('data-size')).toBe('icon-md')
    expect(next?.getAttribute('data-size')).toBe('icon-md')
    expect(prev?.className).not.toContain('ps-2!')
    expect(next?.className).not.toContain('pe-2!')
    expect(prev?.querySelector('[data-slot="leading"]')).toBeNull()
    expect(next?.querySelector('[data-slot="trailing"]')).toBeNull()
    expect(prev?.querySelector('[data-slot="label"] > [data-slot="icon"]')).not.toBeNull()
    expect(next?.querySelector('[data-slot="label"] > [data-slot="icon"]')).not.toBeNull()
  })

  test('renders text controls with icons in their leading and trailing slots', () => {
    const screen = render(() => (
      <Pagination total={30} itemsPerPage={10} prevText="Previous" nextText="Next" showControls />
    ))
    const prev = screen.container.querySelector('[data-slot="prev"]')
    const next = screen.container.querySelector('[data-slot="next"]')

    expect(prev?.getAttribute('data-size')).toBe('md')
    expect(next?.getAttribute('data-size')).toBe('md')
    expect(prev?.className).toContain('ps-2!')
    expect(next?.className).toContain('pe-2!')
    expect(prev?.querySelector('[data-slot="leading"]')).not.toBeNull()
    expect(next?.querySelector('[data-slot="trailing"]')).not.toBeNull()
    expect(prev?.querySelector('[data-slot="label"]')?.textContent).toBe('Previous')
    expect(next?.querySelector('[data-slot="label"]')?.textContent).toBe('Next')
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

  test('resolves each visible link destination once and keeps current-page activation a no-op', async () => {
    const to = vi.fn((page: number) => `/page/${page}`)
    const onPageChange = vi.fn()
    const screen = render(() => (
      <Pagination
        page={2}
        total={30}
        itemsPerPage={10}
        to={to}
        onPageChange={onPageChange}
        oncapture:click={(event: MouseEvent) => event.preventDefault()}
      />
    ))

    expect(to.mock.calls.map(([page]) => page)).toEqual([1, 1, 2, 3, 3])

    await fireEvent.click(screen.getByLabelText('Page 2 of 3, current page'))
    expect(onPageChange).not.toHaveBeenCalled()
    expect(to).toHaveBeenCalledTimes(5)
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

  test('releases focus when a reactive boundary link becomes a disabled button', () => {
    const [page, setPage] = createSignal(2)
    const screen = render(() => (
      <Pagination page={page()} total={30} itemsPerPage={10} to={(target) => `/page/${target}`} />
    ))
    const nextLink = screen.container.querySelector('[data-slot="next"]') as HTMLElement

    nextLink.focus()
    expect(document.activeElement).toBe(nextLink)
    expect(nextLink.tagName).toBe('A')
    setPage(3)
    const nextButton = screen.container.querySelector('[data-slot="next"]') as HTMLElement
    expect(nextButton.tagName).toBe('BUTTON')
    expect(nextButton.hasAttribute('disabled')).toBe(true)
    expect(document.activeElement).toBe(document.body)
  })

  test('applies current-page aria attributes and labels', () => {
    const screen = render(() => (
      <Pagination page={5} total={100} itemsPerPage={10} siblingCount={1} showControls />
    ))

    const currentPage = screen.getByLabelText('Page 5 of 10, current page')
    const anotherPage = screen.getByLabelText('Go to page 4 of 10')

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

  test('announces current page via a polite live region', async () => {
    const [page, setPage] = createSignal(1)

    const screen = render(() => (
      <Pagination
        page={page()}
        onPageChange={setPage}
        total={50}
        itemsPerPage={10}
        showControls={false}
      />
    ))

    const status = screen.container.querySelector('[data-slot="status"]') as HTMLElement | null
    expect(status).not.toBeNull()
    expect(status?.getAttribute('role')).toBe('status')
    expect(status?.getAttribute('aria-live')).toBe('polite')
    expect(status?.getAttribute('aria-atomic')).toBe('true')
    expect(status?.className).toContain('sr-only')
    expect(status?.textContent?.replace(/\s+/g, ' ').trim()).toBe('Page 1 of 5')

    await fireEvent.click(screen.getByText('3'))

    expect(status?.textContent?.replace(/\s+/g, ' ').trim()).toBe('Page 3 of 5')
  })

  test('exposes target page in previous and next labels', () => {
    const middle = render(() => <Pagination page={3} total={50} itemsPerPage={10} showControls />)

    expect(middle.getByLabelText('Go to previous page, page 2')).not.toBeNull()
    expect(middle.getByLabelText('Go to next page, page 4')).not.toBeNull()

    const start = render(() => <Pagination page={1} total={50} itemsPerPage={10} showControls />)

    expect(start.getByLabelText('Go to previous page')).not.toBeNull()
    expect(start.getByLabelText('Go to next page, page 2')).not.toBeNull()

    const end = render(() => <Pagination page={5} total={50} itemsPerPage={10} showControls />)

    expect(end.getByLabelText('Go to previous page, page 4')).not.toBeNull()
    expect(end.getByLabelText('Go to next page')).not.toBeNull()
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
    const currentPage = screen.getByLabelText('Page 5 of 10, current page')
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

  test('renders deterministic single-page SSR markup', () => {
    const markup = renderSsrFixture(
      '/src/navigation/pagination/pagination.ssr.fixture.tsx',
      'renderSinglePagePaginationFixture',
    )

    expect(markup.match(/data-slot="link"/g)).toHaveLength(1)
    expect(markup).toContain('Page 1 of 1')
    expect(markup).not.toContain('data-slot="ellipsis"')
  })

  test('hydrates ellipsis link mode without replacing nodes and handles first navigation', async () => {
    const markup = renderSsrFixture(
      '/src/navigation/pagination/pagination.ssr.fixture.tsx',
      'renderPaginationFixture',
    )
    const container = document.createElement('div')
    container.innerHTML = markup
    document.body.append(container)
    const serverRoot = container.querySelector('[data-slot="root"]')
    const serverList = container.querySelector('[data-slot="list"]')
    const serverStatus = container.querySelector('[data-slot="status"]')
    const [page, setPage] = createSignal(5)
    const restoreHydrationState = installHydrationState()

    const dispose = hydrate(
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
      container,
    )

    expect(container.querySelector('[data-slot="root"]')).toBe(serverRoot)
    expect(container.querySelector('[data-slot="list"]')).toBe(serverList)
    expect(container.querySelector('[data-slot="status"]')).toBe(serverStatus)
    expect(container.querySelectorAll('[data-slot="ellipsis"]')).toHaveLength(2)

    await fireEvent.click(container.querySelector('[data-slot="next"]')!)
    expect(serverStatus?.textContent?.replace(/\s+/g, ' ').trim()).toBe('Page 6 of 10')

    dispose()
    container.remove()
    restoreHydrationState()
  }, 15_000)
})
