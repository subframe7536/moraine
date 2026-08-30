import { fireEvent } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { hydrateFixture, renderSsrFixture } from '../../test-utils/ssr-test.ts'

import { Tabs } from './tabs.tsx'

describe('Tabs SSR Hydration', () => {
  test('renders deterministic vertical SSR relationships and selected panel', () => {
    const markup = renderSsrFixture(
      '/src/navigation/tabs/tabs.ssr.fixture.tsx',
      'renderVerticalTabsFixture',
    )

    expect(markup).toContain('id="ssr-vertical-tabs"')
    expect(markup).toContain('aria-orientation="vertical"')
    expect(markup).toContain('id="ssr-vertical-tabs-other-0-trigger"')
    expect(markup).toContain('aria-labelledby="ssr-vertical-tabs-other-0-trigger"')
    expect(markup).toContain('Other panel')
    expect(markup).not.toContain('Empty panel')
  })

  test('hydrates empty-value JSX without replacing nodes and handles first keyboard activation', () => {
    const [value, setValue] = createSignal('')
    const items = [
      { label: 0, value: '', content: <span data-testid="empty-panel">Empty panel</span> },
      {
        label: 'Other',
        value: 'other',
        content: <span data-testid="other-panel">Other panel</span>,
      },
    ]

    const { container } = hydrateFixture(
      '/src/navigation/tabs/tabs.ssr.fixture.tsx',
      'renderTabsFixture',
      () => <Tabs id="ssr-tabs" value={value()} onChange={setValue} items={items} />,
    )

    const root = container.querySelector('[data-slot="root"]')
    const list = container.querySelector('[data-slot="list"]')
    const firstTrigger = container.querySelector<HTMLElement>('[role="tab"]')
    const panel = container.querySelector('[role="tabpanel"]')

    expect(root).not.toBeNull()
    expect(list).not.toBeNull()
    expect(firstTrigger).not.toBeNull()
    expect(panel).not.toBeNull()

    firstTrigger!.focus()
    fireEvent.keyDown(firstTrigger!, { key: 'ArrowRight' })
    expect(container.querySelector('[role="tab"][aria-selected="true"]')?.textContent).toContain(
      'Other',
    )
    expect(container.querySelector('[data-testid="other-panel"]')?.textContent).toBe('Other panel')
  })
})
