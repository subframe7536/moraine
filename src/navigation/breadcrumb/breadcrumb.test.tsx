import { A, Route, Router } from '@solidjs/router'
import { fireEvent, render } from '@solidjs/testing-library'
import { createComponent, createSignal } from 'solid-js'
import { hydrate } from 'solid-js/web'
import { describe, expect, test, vi } from 'vitest'

import { installHydrationState, renderSsrFixture } from '../../test-utils/ssr-test.ts'

import { renderBreadcrumbItem } from './breadcrumb.ssr.fixture.tsx'
import { Breadcrumb } from './breadcrumb.tsx'
import type { BreadcrumbT } from './breadcrumb.tsx'

describe('Breadcrumb', () => {
  test('uses default root aria-label', () => {
    const screen = render(() => <Breadcrumb items={[{ label: 'Home', href: '/' }]} />)
    const root = screen.getByRole('navigation')

    expect(root.getAttribute('aria-label')).toBe('Breadcrumbs')
  })

  test('allows explicit aria-label override', () => {
    const explicit = render(() => (
      <Breadcrumb
        aria-label="Custom label"
        items={[
          { label: 'Home', href: '/' },
          { label: 'Page', href: '/page' },
        ]}
      />
    ))
    const explicitRoot = explicit.getByRole('navigation')

    expect(explicitRoot.getAttribute('aria-label')).toBe('Custom label')
  })

  test('renders breadcrumb items and separators', () => {
    const screen = render(() => (
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Docs', href: '/docs' },
          { label: 'API', href: '/docs/api' },
        ]}
      />
    ))

    expect(screen.getByText('Home')).not.toBeNull()
    expect(screen.getByText('Docs')).not.toBeNull()
    expect(screen.getByText('API')).not.toBeNull()
    expect(screen.container.querySelectorAll('[data-slot="separator"]').length).toBe(2)
  })

  test('renders default separator icon and keeps separators aria-hidden', () => {
    const screen = render(() => (
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Docs', href: '/docs' },
          { label: 'API', href: '/docs/api' },
        ]}
      />
    ))

    const separators = screen.container.querySelectorAll('[data-slot="separator"]')
    const separatorIcons = screen.container.querySelectorAll(
      '[data-slot="separator"] [data-slot="icon"]',
    )

    expect(separators.length).toBe(2)
    expect(separatorIcons.length).toBe(2)
    expect(separatorIcons[0]?.className).toContain('icon-chevron-right')

    for (const separator of separators) {
      expect(separator.getAttribute('aria-hidden')).toBe('true')
    }
  })

  test('supports custom separator icon', () => {
    const screen = render(() => (
      <Breadcrumb
        separator="icon-dot"
        items={[
          { label: 'Home', href: '/' },
          { label: 'Docs', href: '/docs' },
          { label: 'API', href: '/docs/api' },
        ]}
      />
    ))

    const separatorIcons = screen.container.querySelectorAll(
      '[data-slot="separator"] [data-slot="icon"]',
    )
    expect(separatorIcons.length).toBe(2)
    expect(separatorIcons[0]?.className).toContain('icon-dot')
  })

  test('marks current item with full link semantics', () => {
    const screen = render(() => (
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Current', href: '/current' },
        ]}
      />
    ))

    const current = screen.getByText('Current').closest('[data-slot="link"]')

    expect(current?.getAttribute('aria-current')).toBe('page')
    expect(current?.hasAttribute('data-current')).toBe(true)
    expect(current?.getAttribute('aria-disabled')).toBe('true')
    expect(current?.hasAttribute('data-disabled')).toBe(true)
    expect(current?.getAttribute('href')).toBeNull()
  })

  test('supports explicit active item', () => {
    const screen = render(() => (
      <Breadcrumb
        items={[
          { label: 'Home', href: '/', active: true },
          { label: 'Current', href: '/current' },
        ]}
      />
    ))

    const explicit = screen.getByText('Home').closest('[data-slot="link"]')
    expect(explicit?.getAttribute('aria-current')).toBe('page')
    expect(explicit?.getAttribute('href')).toBeNull()
  })

  test('renders icon slot and direct label text via button composition', () => {
    const screen = render(() => (
      <Breadcrumb
        items={[
          { label: 'Home', href: '/', icon: 'i-lucide-house' },
          { label: 'Docs', href: '/docs' },
        ]}
      />
    ))

    const homeLink = screen.getByText('Home').closest('[data-slot="link"]')
    const leading = homeLink?.querySelector('[data-slot="leading"]')

    expect(leading).not.toBeNull()
    expect(leading?.className).toContain('i-lucide-house')
    expect(homeLink?.textContent).toContain('Home')
    expect(homeLink?.querySelector('[data-slot="label"]')).not.toBeNull()
  })

  test('applies disabled state and classes overrides', () => {
    const screen = render(() => (
      <Breadcrumb
        classes={{
          root: 'root-override',
          link: 'link-override',
          leading: 'leading-override',
          separator: 'separator-override',
        }}
        items={[
          { label: 'Home', href: '/', icon: 'i-lucide-house' },
          { label: 'Disabled', href: '/disabled', disabled: true },
        ]}
      />
    ))

    const root = screen.container.querySelector('[data-slot="root"]')
    const home = screen.getByText('Home').closest('[data-slot="link"]')
    const homeLeading = home?.querySelector('[data-slot="leading"]')
    const disabled = screen.getByText('Disabled').closest('[data-slot="link"]')
    const separator = screen.container.querySelector('[data-slot="separator"]')

    expect(root?.className).toContain('root-override')
    expect(homeLeading?.className).toContain('leading-override')
    expect(disabled?.className).toContain('link-override')
    expect(disabled?.getAttribute('aria-disabled')).toBe('true')
    expect(disabled?.getAttribute('href')).toBeNull()
    expect(separator?.className).toContain('separator-override')
  })

  test('applies styles overrides', () => {
    const screen = render(() => (
      <Breadcrumb
        styles={{
          root: { width: '200px' },
          link: { width: '200px' },
          separator: { width: '200px' },
        }}
        items={[
          { label: 'Home', href: '/', icon: 'i-lucide-house' },
          { label: 'Docs', href: '/docs' },
        ]}
      />
    ))

    const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement | null
    const link = screen.container.querySelector('[data-slot="link"]') as HTMLElement | null
    const separator = screen.container.querySelector(
      '[data-slot="separator"]',
    ) as HTMLElement | null

    expect(root?.style.width).toBe('200px')
    expect(link?.style.width).toBe('200px')
    expect(separator?.style.width).toBe('200px')
  })

  test('supports itemRender with @solidjs/router A component', () => {
    const itemRender = vi.fn((props: BreadcrumbT.ItemRenderProps) => (
      <A data-slot="link" href={props.item.href ?? props.item.to ?? '#'}>
        {props.item.label}
      </A>
    ))

    const screen = render(() => (
      <Router url="/">
        <Route
          path="/"
          component={() => (
            <Breadcrumb
              itemRender={itemRender}
              items={[
                { label: 'Home', href: '/' },
                { label: 'Current', href: '/current' },
              ]}
            />
          )}
        />
      </Router>
    ))

    const links = screen.container.querySelectorAll('[data-slot="link"]')
    const homeLink = screen.getByRole('link', { name: 'Home' })

    expect(screen.getByText('Home')).not.toBeNull()
    expect(links.length).toBe(2)
    expect(homeLink.getAttribute('href')).toBe('/')
    expect(itemRender).toHaveBeenCalled()

    const contexts = itemRender.mock.calls
      .map(([context]) => context)
      .filter((context): context is BreadcrumbT.ItemRenderProps => context !== undefined)
    expect(
      contexts.some(
        (context) => context.index === 0 && context.current === false && context.disabled === false,
      ),
    ).toBe(true)
    expect(
      contexts.some(
        (context) => context.index === 1 && context.current === true && context.disabled === true,
      ),
    ).toBe(true)
  })

  test('reads itemRender once and invokes it once per item', () => {
    let reads = 0
    const itemRender = vi.fn((context: BreadcrumbT.ItemRenderProps) => (
      <span data-slot="custom-item">{context.item.label}</span>
    ))

    const screen = render(() =>
      createComponent(Breadcrumb, {
        items: [
          { label: 'Home', href: '/' },
          { label: 'Disabled', href: '/disabled', disabled: true },
          { label: 'Current', href: '/current', active: true },
        ],
        get itemRender() {
          reads += 1
          return itemRender
        },
      }),
    )

    expect(reads).toBe(1)
    expect(itemRender).toHaveBeenCalledTimes(3)
    expect(screen.container.querySelectorAll('[data-slot="custom-item"]')).toHaveLength(3)
    expect(screen.container.querySelectorAll('[data-slot="separator"]')).toHaveLength(2)
  })

  test('keeps one current page while items are inserted, reordered, and removed', () => {
    const [items, setItems] = createSignal<BreadcrumbT.Item[]>([
      { label: 'Home', href: '/', active: true },
      { label: 'Docs', href: '/docs', active: true },
      { label: 'API', href: '/api' },
    ])
    const screen = render(() => <Breadcrumb items={items()} />)
    const currentLabel = () =>
      screen.container.querySelector('[aria-current="page"]')?.textContent?.trim()

    expect(screen.container.querySelectorAll('[aria-current="page"]')).toHaveLength(1)
    expect(currentLabel()).toBe('Home')

    setItems([
      { label: 'Intro', href: '/intro' },
      { label: 'Docs', href: '/docs', active: true },
      { label: 'Home', href: '/', active: true },
    ])
    expect(screen.container.querySelectorAll('[aria-current="page"]')).toHaveLength(1)
    expect(currentLabel()).toBe('Docs')

    setItems([
      { label: 'Intro', href: '/intro' },
      { label: 'Reference', href: '/reference' },
    ])
    expect(screen.container.querySelectorAll('[aria-current="page"]')).toHaveLength(1)
    expect(currentLabel()).toBe('Reference')

    setItems([])
    expect(screen.container.querySelectorAll('[aria-current="page"]')).toHaveLength(0)
    expect(screen.container.querySelectorAll('[data-slot="separator"]')).toHaveLength(0)
  })

  test('renders numeric zero but omits empty and boolean label wrappers', () => {
    const screen = render(() => (
      <Breadcrumb
        items={[
          { label: 0, href: '/zero' },
          { label: '', href: '/empty' },
          { label: false, href: '/false' },
        ]}
      />
    ))

    expect(screen.getByRole('link', { name: '0' })).not.toBeNull()
    expect(screen.container.querySelectorAll('[data-slot="label"]')).toHaveLength(1)
  })

  test('hydrates a custom renderer without replacing the trail and preserves activation', async () => {
    const markup = renderSsrFixture(
      '/src/navigation/breadcrumb/breadcrumb.ssr.fixture.tsx',
      'renderBreadcrumbFixture',
    )
    const container = document.createElement('div')
    container.innerHTML = markup
    document.body.append(container)
    const serverRoot = container.querySelector('[data-slot="root"]')
    const serverList = container.querySelector('[data-slot="list"]')
    const serverFirstLink = container.querySelector('[data-slot="custom-link"]')
    const onClick = vi.fn((event: MouseEvent) => event.preventDefault())
    const restoreHydrationState = installHydrationState()

    const dispose = hydrate(
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
      container,
    )

    expect(container.querySelector('[data-slot="root"]')).toBe(serverRoot)
    expect(container.querySelector('[data-slot="list"]')).toBe(serverList)
    expect(container.querySelector('[data-slot="custom-link"]')).toBe(serverFirstLink)
    await fireEvent.click(serverFirstLink!)
    expect(onClick).toHaveBeenCalledTimes(1)

    dispose()
    container.remove()
    restoreHydrationState()
  }, 15_000)
})
