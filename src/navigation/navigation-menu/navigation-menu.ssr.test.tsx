import { fireEvent, waitFor } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { hydrateFixture } from '../../test-util/ssr-test'

import { NavigationMenuFixture } from './navigation-menu.ssr.fixture'

describe('NavigationMenu SSR hydration', () => {
  test.each([false, true])(
    'reuses server navigation and lazily mounts portaled content (initiallyOpen=%s)',
    async (initiallyOpen) => {
      const { container } = hydrateFixture(
        '/src/navigation/navigation-menu/navigation-menu.ssr.fixture.tsx',
        initiallyOpen ? 'renderOpenNavigationMenuFixture' : 'renderClosedNavigationMenuFixture',
        () => <NavigationMenuFixture initiallyOpen={initiallyOpen} />,
      )
      const nav = container.querySelector('nav')!
      const trigger = container.querySelector<HTMLButtonElement>('button')!
      expect(nav.getAttribute('aria-label')).toBe('Server navigation')
      expect(container.querySelector('[data-slot="navigation-menu-content"]')).toBeNull()
      expect(document.querySelector('[data-slot="navigation-menu-positioner"]')).toBeNull()
      if (!initiallyOpen) {
        fireEvent.keyDown(trigger, { key: 'ArrowDown' })
      }
      await waitFor(() =>
        expect(document.querySelector('[data-slot="navigation-menu-content"]')?.textContent).toBe(
          'Server link',
        ),
      )
      expect(trigger.getAttribute('aria-expanded')).toBe('true')
      expect(container.querySelector('nav')).toBe(nav)
      expect(container.querySelector('button')).toBe(trigger)
      const firstContent = document.querySelector('[data-slot="navigation-menu-content"]')!
      const panel = firstContent.parentElement
      fireEvent.click(container.querySelectorAll('button')[1]!)
      await waitFor(() => {
        const guide = document.querySelector(
          '[data-slot="navigation-menu-content"][data-expanded]',
        )!
        expect(guide.textContent).toBe('Server guide')
        expect(guide.parentElement).toBe(panel)
      })
      expect(firstContent.hasAttribute('data-closed')).toBe(true)
      expect(container.querySelector('nav')).toBe(nav)
    },
  )
})
