import { fireEvent } from '@solidjs/testing-library'
import { describe, expect, test } from 'vitest'

import { hydrateFixture } from '../../test-utils/ssr-test'

import { Collapsible } from './collapsible'

describe('Collapsible SSR Hydration', () => {
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

    const trigger = container.querySelector('[data-slot="trigger"]')!
    expect(trigger).not.toBeNull()
    expect(contentMounts).toBe(0)
    expect(container.querySelector('[data-slot="content"]')).toBeNull()

    fireEvent.click(trigger)
    const contentWrapper = container.querySelector('[data-slot="content-wrapper"]')!
    expect(contentMounts).toBe(1)
    expect(trigger.getAttribute('aria-controls')).toBe(contentWrapper.id)
    expect(contentWrapper.getAttribute('aria-labelledby')).toBe(trigger.id)

    fireEvent.click(trigger)
    expect(container.querySelector('[data-slot="content"]')).toBeNull()
    fireEvent.click(trigger)
    expect(contentMounts).toBe(2)
  })
})
