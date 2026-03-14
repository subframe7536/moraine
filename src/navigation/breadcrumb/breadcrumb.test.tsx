import { A, Route, Router } from '@solidjs/router'
import { render } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { Breadcrumb } from './breadcrumb'
import type { BreadcrumbItemRenderContext } from './breadcrumb'

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
        } as any}
        items={[
          { label: 'Home', href: '/', icon: 'i-lucide-house' },
          { label: 'Docs', href: '/docs' },
        ]}
      />
    ))

    const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement | null
    const link = screen.container.querySelector('[data-slot="link"]') as HTMLElement | null
    const separator = screen.container.querySelector('[data-slot="separator"]') as HTMLElement | null

    expect(root?.style.width).toBe('200px')
    expect(link?.style.width).toBe('200px')
    expect(separator?.style.width).toBe('200px')
  })

  test('supports itemRender with @solidjs/router A component', () => {
    const itemRender = vi.fn<(context: BreadcrumbItemRenderContext) => typeof A>((_) => A)

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
      .filter((context): context is BreadcrumbItemRenderContext => context !== undefined)
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
})
