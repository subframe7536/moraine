import { fireEvent, render } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { NavigationMenu } from './navigation-menu'

if (!(globalThis as Record<string, unknown>).ResizeObserver) {
  ;(globalThis as Record<string, unknown>).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

describe('NavigationMenu', () => {
  test('renders horizontal menu and open content', async () => {
    const screen = render(() => (
      <NavigationMenu
        arrow
        defaultValue="docs"
        items={[
          {
            label: 'Docs',
            value: 'docs',
            children: [
              { label: 'Guides', href: '/guides' },
              { label: 'API', href: '/api', target: '_blank' },
            ],
          },
          { label: 'Blog', href: '/blog' },
        ]}
      />
    ))

    await fireEvent.click(screen.getByRole('menuitem', { name: 'Docs' }))

    expect(screen.getByText('Guides')).not.toBeNull()
    expect(screen.getByText('API')).not.toBeNull()
    expect(screen.container.querySelector('[data-slot="indicator"]')).not.toBeNull()
  })

  test('supports vertical accordion and emits single value', async () => {
    const onValueChange = vi.fn()

    const screen = render(() => (
      <NavigationMenu
        orientation="vertical"
        type="single"
        defaultValue="item-0-0"
        onValueChange={onValueChange}
        items={[
          {
            label: 'Getting Started',
            children: [{ label: 'Install', href: '/install' }],
          },
          {
            label: 'Components',
            children: [{ label: 'Button', href: '/button' }],
          },
        ]}
      />
    ))

    expect(screen.getByText('Install')).not.toBeNull()

    await fireEvent.click(screen.getByRole('button', { name: 'Components' }))

    expect(onValueChange).toHaveBeenCalledWith('item-0-1')
    expect(screen.getByText('Button')).not.toBeNull()
  })

  test('supports collapsed mode with popover + tooltip wrappers', () => {
    const screen = render(() => (
      <NavigationMenu
        orientation="vertical"
        collapsed
        tooltip
        popover
        items={[
          {
            label: 'Projects',
            icon: 'icon-folder',
            children: [{ label: 'Alpha', href: '/alpha' }],
          },
        ]}
      />
    ))

    const link = screen.container.querySelector('[data-slot="link"]')
    const trigger = screen.container.querySelector('[data-slot="trigger"]')

    expect(link?.className).toContain('justify-center')
    expect(trigger).not.toBeNull()
  })

  test('applies classes overrides', () => {
    const screen = render(() => (
      <NavigationMenu
        defaultValue="home"
        items={[{ label: 'Home', value: 'home', children: [{ label: 'Intro', href: '/intro' }] }]}
        classes={{
          root: 'root-override',
          link: 'link-override',
          viewport: 'viewport-override',
        }}
      />
    ))

    const root = screen.container.querySelector('[data-slot="root"]')
    const trigger = screen.container.querySelector('[data-slot="trigger"]')
    const viewport = screen.container.querySelector('[data-slot="viewport"]')

    expect(root?.className).toContain('root-override')
    expect(trigger?.className).toContain('link-override')
    expect(viewport?.className).toContain('viewport-override')
  })
})
