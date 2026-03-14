import { fireEvent, render } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { Tabs } from './tabs'

if (!(globalThis as Record<string, unknown>).ResizeObserver) {
  ;(globalThis as Record<string, unknown>).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

describe('Tabs', () => {
  const ITEMS = [
    { label: 'Overview', value: 'overview', content: 'Overview content' },
    { label: 'Settings', value: 'settings', content: 'Settings content' },
  ]

  test('renders triggers and tab content', () => {
    const screen = render(() => <Tabs items={ITEMS} defaultValue="overview" />)

    expect(screen.getByRole('tab', { name: 'Overview' })).not.toBeNull()
    expect(screen.getByRole('tab', { name: 'Settings' })).not.toBeNull()
    expect(screen.getByText('Overview content')).not.toBeNull()
  })

  test('supports controlled value and emits onChange', async () => {
    const onChange = vi.fn()

    const screen = render(() => (
      <Tabs
        value="one"
        onChange={onChange}
        items={[
          { label: 'One', value: 'one', content: 'Panel one' },
          { label: 'Two', value: 'two', content: 'Panel two' },
        ]}
      />
    ))

    await fireEvent.click(screen.getByRole('tab', { name: 'Two' }))

    expect(onChange).toHaveBeenCalledWith('two')

    const selected = screen.getByRole('tab', { name: 'One' })
    expect(selected.getAttribute('aria-selected')).toBe('true')
  })

  test('applies orientation/variant classes and class overrides', () => {
    const screen = render(() => (
      <Tabs
        orientation="vertical"
        variant="link"
        items={ITEMS}
        classes={{
          root: 'root-override',
          trigger: 'trigger-override',
          content: 'content-override',
        }}
      />
    ))

    const root = screen.container.querySelector('[data-slot="root"]')
    const trigger = screen.container.querySelector('[data-slot="trigger"]')
    const content = screen.container.querySelector('[data-slot="content"]')

    expect(root?.className).toContain('flex-row')
    expect(root?.className).toContain('root-override')
    expect(trigger?.className).toContain('transition')
    expect(trigger?.className).toContain('focus-visible:effect-fv-border')
    expect(trigger?.className).toContain('trigger-override')
    expect(content?.className).toContain('content-override')
  })

  test('renders icon leading', () => {
    const screen = render(() => (
      <Tabs
        items={[
          {
            label: 'Inbox',
            value: 'inbox',
            icon: 'icon-inbox',
          },
        ]}
      />
    ))

    expect(screen.container.querySelector('[data-slot="leading"]')).not.toBeNull()
  })

  test('applies style overrides', () => {
    const screen = render(() => (
      <Tabs
        items={ITEMS}
        styles={
          {
            root: { width: '200px' },
            trigger: { width: '200px' },
            content: { width: '200px' },
          } as any
        }
      />
    ))

    const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement | null
    const trigger = screen.container.querySelector('[data-slot="trigger"]') as HTMLElement | null
    const content = screen.container.querySelector('[data-slot="content"]') as HTMLElement | null

    expect(root?.style.width).toBe('200px')
    expect(trigger?.style.width).toBe('200px')
    expect(content?.style.width).toBe('200px')
  })
})
