import { fireEvent, render } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { Tabs } from './tabs'

if (!(globalThis as Record<string, unknown>).ResizeObserver) {
  ;(globalThis as Record<string, unknown>).ResizeObserver = class {
    // oxlint-disable-next-line class-methods-use-this
    observe() {}
    // oxlint-disable-next-line class-methods-use-this
    unobserve() {}
    // oxlint-disable-next-line class-methods-use-this
    disconnect() {}
  }
}

describe('Tabs', () => {
  const ITEMS = [
    { label: 'Overview', value: 'overview', render: 'Overview content' },
    { label: 'Settings', value: 'settings', render: 'Settings content' },
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
          { label: 'One', value: 'one', render: 'Panel one' },
          { label: 'Two', value: 'two', render: 'Panel two' },
        ]}
      />
    ))

    await fireEvent.click(screen.getByRole('tab', { name: 'Two' }))

    expect(onChange).toHaveBeenCalledWith('two')

    const selected = screen.getByRole('tab', { name: 'One' })
    expect(selected.getAttribute('aria-selected')).toBe('true')
  })

  test('changes selection with horizontal arrow keys and wraps by default', async () => {
    const screen = render(() => (
      <Tabs
        items={[
          { label: 'One', value: 'one', render: 'Panel one' },
          { label: 'Two', value: 'two', render: 'Panel two' },
          { label: 'Three', value: 'three', render: 'Panel three' },
        ]}
        defaultValue="one"
      />
    ))

    const one = screen.getByRole('tab', { name: 'One' })
    const two = screen.getByRole('tab', { name: 'Two' })
    const three = screen.getByRole('tab', { name: 'Three' })

    one.focus()

    await fireEvent.keyDown(one, { key: 'ArrowRight' })
    expect(two.getAttribute('aria-selected')).toBe('true')

    await fireEvent.keyDown(two, { key: 'ArrowLeft' })
    expect(one.getAttribute('aria-selected')).toBe('true')

    await fireEvent.keyDown(one, { key: 'ArrowLeft' })
    expect(three.getAttribute('aria-selected')).toBe('true')
  })

  test('changes selection with vertical arrow keys', async () => {
    const screen = render(() => (
      <Tabs
        orientation="vertical"
        items={[
          { label: 'One', value: 'one', render: 'Panel one' },
          { label: 'Two', value: 'two', render: 'Panel two' },
          { label: 'Three', value: 'three', render: 'Panel three' },
        ]}
        defaultValue="one"
      />
    ))

    const one = screen.getByRole('tab', { name: 'One' })
    const two = screen.getByRole('tab', { name: 'Two' })

    one.focus()

    await fireEvent.keyDown(one, { key: 'ArrowRight' })
    expect(one.getAttribute('aria-selected')).toBe('true')

    await fireEvent.keyDown(one, { key: 'ArrowDown' })
    expect(two.getAttribute('aria-selected')).toBe('true')
  })

  test('supports Home and End keyboard navigation', async () => {
    const screen = render(() => (
      <Tabs
        items={[
          { label: 'One', value: 'one', render: 'Panel one' },
          { label: 'Two', value: 'two', render: 'Panel two' },
          { label: 'Three', value: 'three', render: 'Panel three' },
        ]}
        defaultValue="one"
      />
    ))

    const one = screen.getByRole('tab', { name: 'One' })
    const three = screen.getByRole('tab', { name: 'Three' })

    one.focus()

    await fireEvent.keyDown(one, { key: 'End' })
    expect(three.getAttribute('aria-selected')).toBe('true')

    await fireEvent.keyDown(three, { key: 'Home' })
    expect(one.getAttribute('aria-selected')).toBe('true')
  })

  test('supports manual activation mode via Enter and Space', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <Tabs
        activationMode="manual"
        defaultValue="one"
        onChange={onChange}
        items={[
          { label: 'One', value: 'one', render: 'Panel one' },
          { label: 'Two', value: 'two', render: 'Panel two' },
          { label: 'Three', value: 'three', render: 'Panel three' },
        ]}
      />
    ))

    const one = screen.getByRole('tab', { name: 'One' })
    const two = screen.getByRole('tab', { name: 'Two' })
    const three = screen.getByRole('tab', { name: 'Three' })

    one.focus()

    await fireEvent.keyDown(one, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(two)
    expect(two.getAttribute('aria-selected')).toBe('false')

    await fireEvent.keyDown(two, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(three)
    expect(three.getAttribute('aria-selected')).toBe('false')

    await fireEvent.keyDown(three, { key: 'Enter' })
    expect(three.getAttribute('aria-selected')).toBe('true')

    await fireEvent.keyDown(three, { key: ' ' })
    expect(onChange).toHaveBeenCalledWith('three')
  })

  test('respects keyboardLoop=false at boundaries', async () => {
    const screen = render(() => (
      <Tabs
        keyboardLoop={false}
        items={[
          { label: 'One', value: 'one', render: 'Panel one' },
          { label: 'Two', value: 'two', render: 'Panel two' },
          { label: 'Three', value: 'three', render: 'Panel three' },
        ]}
        defaultValue="three"
      />
    ))

    const one = screen.getByRole('tab', { name: 'One' })
    const three = screen.getByRole('tab', { name: 'Three' })

    three.focus()

    await fireEvent.keyDown(three, { key: 'ArrowRight' })
    expect(three.getAttribute('aria-selected')).toBe('true')

    one.focus()
    await fireEvent.keyDown(one, { key: 'ArrowLeft' })
    expect(one.getAttribute('aria-selected')).toBe('false')
    expect(screen.getByRole('tab', { name: 'Three' }).getAttribute('aria-selected')).toBe('true')
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

  test('applies vertical pill indicator inset class', () => {
    const screen = render(() => <Tabs orientation="vertical" items={ITEMS} />)

    const indicator = screen.container.querySelector('[data-slot="indicator"]')

    expect(indicator?.className).toContain('inset-x-1')
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
        styles={{
          root: { width: '200px' },
          trigger: { width: '200px' },
          content: { width: '200px' },
        }}
      />
    ))

    const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement | null
    const trigger = screen.container.querySelector('[data-slot="trigger"]') as HTMLElement | null
    const content = screen.container.querySelector('[data-slot="content"]') as HTMLElement | null

    expect(root?.style.width).toBe('200px')
    expect(trigger?.style.width).toBe('200px')
    expect(content?.style.width).toBe('200px')
  })

  test('supports RTL horizontal navigation', async () => {
    const screen = render(() => (
      <div dir="rtl">
        <Tabs
          items={[
            { label: 'One', value: 'one', render: 'Panel one' },
            { label: 'Two', value: 'two', render: 'Panel two' },
            { label: 'Three', value: 'three', render: 'Panel three' },
          ]}
          defaultValue="two"
        />
      </div>
    ))

    const two = screen.getByRole('tab', { name: 'Two' })
    const one = screen.getByRole('tab', { name: 'One' })
    const three = screen.getByRole('tab', { name: 'Three' })

    two.focus()

    // In RTL, ArrowLeft moves forward (to the next item)
    await fireEvent.keyDown(two, { key: 'ArrowLeft' })
    expect(three.getAttribute('aria-selected')).toBe('true')

    // In RTL, ArrowRight moves backward (to the previous item)
    await fireEvent.keyDown(three, { key: 'ArrowRight' })
    expect(two.getAttribute('aria-selected')).toBe('true')

    await fireEvent.keyDown(two, { key: 'ArrowRight' })
    expect(one.getAttribute('aria-selected')).toBe('true')
  })

  test('skips disabled tabs during keyboard navigation', async () => {
    const screen = render(() => (
      <Tabs
        items={[
          { label: 'One', value: 'one', render: 'Panel one' },
          { label: 'Two', value: 'two', render: 'Panel two', disabled: true },
          { label: 'Three', value: 'three', render: 'Panel three' },
        ]}
        defaultValue="one"
      />
    ))

    const one = screen.getByRole('tab', { name: 'One' })
    const two = screen.getByRole('tab', { name: 'Two' })
    const three = screen.getByRole('tab', { name: 'Three' })

    one.focus()

    await fireEvent.keyDown(one, { key: 'ArrowRight' })
    expect(three.getAttribute('aria-selected')).toBe('true')
    expect(two.getAttribute('aria-selected')).toBe('false')

    await fireEvent.keyDown(three, { key: 'ArrowLeft' })
    expect(one.getAttribute('aria-selected')).toBe('true')
  })

  test('roving tabindex follows highlighted tab in manual mode', async () => {
    const screen = render(() => (
      <Tabs
        activationMode="manual"
        defaultValue="one"
        items={[
          { label: 'One', value: 'one', render: 'Panel one' },
          { label: 'Two', value: 'two', render: 'Panel two' },
          { label: 'Three', value: 'three', render: 'Panel three' },
        ]}
      />
    ))

    const one = screen.getByRole('tab', { name: 'One' })
    const two = screen.getByRole('tab', { name: 'Two' })
    const three = screen.getByRole('tab', { name: 'Three' })

    expect(one.getAttribute('tabindex')).toBe('0')
    expect(two.getAttribute('tabindex')).toBe('-1')

    one.focus()

    await fireEvent.keyDown(one, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(two)
    expect(two.getAttribute('tabindex')).toBe('0')
    expect(one.getAttribute('tabindex')).toBe('-1')
    expect(two.getAttribute('data-highlighted')).toBe('')
    expect(one.getAttribute('aria-selected')).toBe('true')
    expect(two.getAttribute('aria-selected')).toBe('false')

    await fireEvent.keyDown(two, { key: 'Enter' })
    expect(two.getAttribute('aria-selected')).toBe('true')
    expect(two.getAttribute('tabindex')).toBe('0')
    expect(two.getAttribute('data-highlighted')).toBe(null)
    expect(three.getAttribute('tabindex')).toBe('-1')
  })
})
