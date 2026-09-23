import { fireEvent } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { hydrateFixture, renderSsrFixture } from '../../test-utils/ssr-test'

import { Collapsible } from './collapsible'

describe('Collapsible SSR Hydration', () => {
  test('hydrates public content state and retains it through animated toggles', async () => {
    const fixture = '/src/elements/collapsible/collapsible.ssr.fixture.tsx'
    const server = document.createElement('div')
    server.innerHTML = renderSsrFixture(fixture, 'renderOpenCollapsibleFixture')
    expect(
      server.querySelector('[data-slot="collapsible-content"][data-expanded][data-transition]'),
    ).not.toBeNull()
    expect(
      server.querySelector('[data-slot="collapsible-content-wrapper"][data-expanded]'),
    ).toBeNull()

    const { container } = hydrateFixture(fixture, 'renderOpenCollapsibleFixture', () => (
      <Collapsible defaultOpen transition unmountOnHide={false}>
        <Collapsible.Trigger>Details</Collapsible.Trigger>
        <Collapsible.Content as="section">Content</Collapsible.Content>
      </Collapsible>
    ))
    const trigger = container.querySelector('[data-slot="collapsible-trigger"]')!
    const content = container.querySelector('section[data-slot="collapsible-content"]')!
    const wrapper = content.parentElement!
    expect(content.hasAttribute('data-expanded')).toBe(true)
    expect(content.hasAttribute('data-transition')).toBe(true)
    fireEvent.click(trigger)
    expect(content.hasAttribute('data-expanded')).toBe(false)
    expect(content.hasAttribute('data-closed')).toBe(true)
    expect(wrapper.hasAttribute('data-closed')).toBe(false)
    expect(wrapper.hidden).toBe(false)
    await Promise.resolve()
    fireEvent.animationEnd(wrapper, { animationName: 'accordion-up' })
    await Promise.resolve()
    expect(wrapper.hidden).toBe(true)
    fireEvent.click(trigger)
    expect(container.querySelector('[data-slot="collapsible-content"]')).toBe(content)
    expect(content.hasAttribute('data-expanded')).toBe(true)
    expect(content.hasAttribute('data-closed')).toBe(false)
    expect(wrapper.hidden).toBe(false)
  })

  test('hydrates closed composable markup without content and supports open, close, and reopen', () => {
    let contentMounts = 0
    const Content = () => {
      contentMounts += 1
      return <span data-testid="hydrated-content">Content</span>
    }

    const { container } = hydrateFixture(
      '/src/elements/collapsible/collapsible.ssr.fixture.tsx',
      'renderCollapsibleFixture',
      () => (
        <Collapsible>
          <Collapsible.Trigger>Details</Collapsible.Trigger>
          <Collapsible.Content>
            <Content />
          </Collapsible.Content>
        </Collapsible>
      ),
    )

    const trigger = container.querySelector('[data-slot="collapsible-trigger"]')!
    expect(trigger).not.toBeNull()
    expect(contentMounts).toBe(0)
    expect(container.querySelector('[data-slot="collapsible-content-wrapper"]')).toBeNull()

    fireEvent.click(trigger)
    const wrapper = container.querySelector('[data-slot="collapsible-content-wrapper"]')!
    expect(contentMounts).toBe(1)
    expect(trigger.getAttribute('aria-controls')).toBe(wrapper.id)
    expect(wrapper.getAttribute('aria-labelledby')).toBe(trigger.id)

    fireEvent.click(trigger)
    expect(container.querySelector('[data-slot="collapsible-content-wrapper"]')).toBeNull()
    fireEvent.click(trigger)
    expect(contentMounts).toBe(2)
  })
})
