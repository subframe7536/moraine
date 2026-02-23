import { render } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { Breadcrumb } from './breadcrumb'

describe('Breadcrumb', () => {
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

  test('marks the last item as current by default', () => {
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
  })

  test('applies disabled state and classes overrides', () => {
    const screen = render(() => (
      <Breadcrumb
        classes={{
          root: 'root-override',
          link: 'link-override',
          separator: 'separator-override',
        }}
        items={[
          { label: 'Home', href: '/' },
          { label: 'Disabled', href: '/disabled', disabled: true },
        ]}
      />
    ))

    const root = screen.container.querySelector('[data-slot="root"]')
    const disabled = screen.getByText('Disabled').closest('[data-slot="link"]')
    const separator = screen.container.querySelector('[data-slot="separator"]')

    expect(root?.className).toContain('root-override')
    expect(disabled?.className).toContain('link-override')
    expect(disabled?.getAttribute('aria-disabled')).toBe('true')
    expect(separator?.className).toContain('separator-override')
  })
})
