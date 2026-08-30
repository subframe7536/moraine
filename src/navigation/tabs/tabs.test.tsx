import { fireEvent, render } from '@solidjs/testing-library'
import { createComponent, createSignal } from 'solid-js'
import { hydrate } from 'solid-js/web'
import { describe, expect, test, vi } from 'vitest'

import { installHydrationState, renderSsrFixture } from '../../test-utils/ssr-test.ts'

import { Tabs } from './tabs.tsx'

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

    fireEvent.click(screen.getByRole('tab', { name: 'Two' }))

    expect(onChange).toHaveBeenCalledWith('two')

    const selected = screen.getByRole('tab', { name: 'One' })
    expect(selected.getAttribute('aria-selected')).toBe('true')
  })

  test('selects and measures an empty-string tab value', () => {
    const screen = render(() => (
      <Tabs
        id="empty-value-tabs"
        defaultValue=""
        items={[
          { label: 'Empty', value: '', content: 'Empty panel' },
          { label: 'Other', value: 'other', content: 'Other panel' },
        ]}
      />
    ))
    const empty = screen.getByRole('tab', { name: 'Empty' })

    expect(empty.getAttribute('aria-selected')).toBe('true')
    expect(empty.getAttribute('aria-controls')).toBe('empty-value-tabs--0-content')
    expect(screen.getByRole('tabpanel').textContent).toBe('Empty panel')
    expect(
      screen.container.querySelector('[data-slot="indicator"]')?.getAttribute('style'),
    ).toContain('width:')
  })

  test('gives duplicate values unique ARIA identity and selects the first enabled occurrence', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <Tabs
        id="duplicate-tabs"
        defaultValue="duplicate"
        onChange={onChange}
        items={[
          { label: 'First duplicate', value: 'duplicate', content: 'First panel' },
          { label: 'Second duplicate', value: 'duplicate', content: 'Second panel' },
          { label: 'Other', value: 'other', content: 'Other panel' },
        ]}
      />
    ))
    const first = screen.getByRole('tab', { name: 'First duplicate' })
    const second = screen.getByRole('tab', { name: 'Second duplicate' })

    expect(first.id).not.toBe(second.id)
    expect(first.getAttribute('aria-controls')).not.toBe(second.getAttribute('aria-controls'))
    expect(screen.container.querySelectorAll('[role="tab"][aria-selected="true"]')).toHaveLength(1)
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1)
    expect(screen.getByRole('tabpanel').textContent).toBe('First panel')

    fireEvent.click(second)
    expect(first.getAttribute('aria-selected')).toBe('true')
    expect(second.getAttribute('aria-selected')).toBe('false')
    expect(onChange).not.toHaveBeenCalled()
  })

  test('changes selection with horizontal arrow keys and wraps by default', async () => {
    const screen = render(() => (
      <Tabs
        items={[
          { label: 'One', value: 'one', content: 'Panel one' },
          { label: 'Two', value: 'two', content: 'Panel two' },
          { label: 'Three', value: 'three', content: 'Panel three' },
        ]}
        defaultValue="one"
      />
    ))

    const one = screen.getByRole('tab', { name: 'One' })
    const two = screen.getByRole('tab', { name: 'Two' })
    const three = screen.getByRole('tab', { name: 'Three' })

    one.focus()

    fireEvent.keyDown(one, { key: 'ArrowRight' })
    expect(two.getAttribute('aria-selected')).toBe('true')

    fireEvent.keyDown(two, { key: 'ArrowLeft' })
    expect(one.getAttribute('aria-selected')).toBe('true')

    fireEvent.keyDown(one, { key: 'ArrowLeft' })
    expect(three.getAttribute('aria-selected')).toBe('true')
  })

  test('changes selection with vertical arrow keys', async () => {
    const screen = render(() => (
      <Tabs
        orientation="vertical"
        items={[
          { label: 'One', value: 'one', content: 'Panel one' },
          { label: 'Two', value: 'two', content: 'Panel two' },
          { label: 'Three', value: 'three', content: 'Panel three' },
        ]}
        defaultValue="one"
      />
    ))

    const one = screen.getByRole('tab', { name: 'One' })
    const two = screen.getByRole('tab', { name: 'Two' })

    one.focus()

    fireEvent.keyDown(one, { key: 'ArrowRight' })
    expect(one.getAttribute('aria-selected')).toBe('true')

    fireEvent.keyDown(one, { key: 'ArrowDown' })
    expect(two.getAttribute('aria-selected')).toBe('true')
  })

  test('supports Home and End keyboard navigation', async () => {
    const screen = render(() => (
      <Tabs
        items={[
          { label: 'One', value: 'one', content: 'Panel one' },
          { label: 'Two', value: 'two', content: 'Panel two' },
          { label: 'Three', value: 'three', content: 'Panel three' },
        ]}
        defaultValue="one"
      />
    ))

    const one = screen.getByRole('tab', { name: 'One' })
    const three = screen.getByRole('tab', { name: 'Three' })

    one.focus()

    fireEvent.keyDown(one, { key: 'End' })
    expect(three.getAttribute('aria-selected')).toBe('true')

    fireEvent.keyDown(three, { key: 'Home' })
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
          { label: 'One', value: 'one', content: 'Panel one' },
          { label: 'Two', value: 'two', content: 'Panel two' },
          { label: 'Three', value: 'three', content: 'Panel three' },
        ]}
      />
    ))

    const one = screen.getByRole('tab', { name: 'One' })
    const two = screen.getByRole('tab', { name: 'Two' })
    const three = screen.getByRole('tab', { name: 'Three' })

    one.focus()

    fireEvent.keyDown(one, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(two)
    expect(two.getAttribute('aria-selected')).toBe('false')

    fireEvent.keyDown(two, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(three)
    expect(three.getAttribute('aria-selected')).toBe('false')

    fireEvent.keyDown(three, { key: 'Enter' })
    expect(three.getAttribute('aria-selected')).toBe('true')

    fireEvent.keyDown(three, { key: ' ' })
    expect(onChange).toHaveBeenCalledWith('three')
  })

  test('respects keyboardLoop=false at boundaries', async () => {
    const screen = render(() => (
      <Tabs
        keyboardLoop={false}
        items={[
          { label: 'One', value: 'one', content: 'Panel one' },
          { label: 'Two', value: 'two', content: 'Panel two' },
          { label: 'Three', value: 'three', content: 'Panel three' },
        ]}
        defaultValue="three"
      />
    ))

    const one = screen.getByRole('tab', { name: 'One' })
    const three = screen.getByRole('tab', { name: 'Three' })

    three.focus()

    fireEvent.keyDown(three, { key: 'ArrowRight' })
    expect(three.getAttribute('aria-selected')).toBe('true')

    one.focus()
    fireEvent.keyDown(one, { key: 'ArrowLeft' })
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

    const leading = screen.container.querySelector('[data-slot="leading"]')
    const icon = leading?.querySelector('[data-slot="icon"]')

    expect(leading).not.toBeNull()
    expect(icon?.className).not.toMatch(/(?:^|\s)size-/)
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

    const root = screen.container.querySelector<HTMLElement>('[data-slot="root"]')
    const trigger = screen.container.querySelector<HTMLElement>('[data-slot="trigger"]')
    const content = screen.container.querySelector<HTMLElement>('[data-slot="content"]')

    expect(root?.style.width).toBe('200px')
    expect(trigger?.style.width).toBe('200px')
    expect(content?.style.width).toBe('200px')
  })

  test('supports RTL horizontal navigation', async () => {
    const screen = render(() => (
      <div dir="rtl">
        <Tabs
          items={[
            { label: 'One', value: 'one', content: 'Panel one' },
            { label: 'Two', value: 'two', content: 'Panel two' },
            { label: 'Three', value: 'three', content: 'Panel three' },
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
    fireEvent.keyDown(two, { key: 'ArrowLeft' })
    expect(three.getAttribute('aria-selected')).toBe('true')

    // In RTL, ArrowRight moves backward (to the previous item)
    fireEvent.keyDown(three, { key: 'ArrowRight' })
    expect(two.getAttribute('aria-selected')).toBe('true')

    fireEvent.keyDown(two, { key: 'ArrowRight' })
    expect(one.getAttribute('aria-selected')).toBe('true')
  })

  test('skips disabled tabs during keyboard navigation', async () => {
    const screen = render(() => (
      <Tabs
        items={[
          { label: 'One', value: 'one', content: 'Panel one' },
          { label: 'Two', value: 'two', content: 'Panel two', disabled: true },
          { label: 'Three', value: 'three', content: 'Panel three' },
        ]}
        defaultValue="one"
      />
    ))

    const one = screen.getByRole('tab', { name: 'One' })
    const two = screen.getByRole('tab', { name: 'Two' })
    const three = screen.getByRole('tab', { name: 'Three' })

    one.focus()

    fireEvent.keyDown(one, { key: 'ArrowRight' })
    expect(three.getAttribute('aria-selected')).toBe('true')
    expect(two.getAttribute('aria-selected')).toBe('false')

    fireEvent.keyDown(three, { key: 'ArrowLeft' })
    expect(one.getAttribute('aria-selected')).toBe('true')
  })

  test('roving tabindex follows highlighted tab in manual mode', async () => {
    const screen = render(() => (
      <Tabs
        activationMode="manual"
        defaultValue="one"
        items={[
          { label: 'One', value: 'one', content: 'Panel one' },
          { label: 'Two', value: 'two', content: 'Panel two' },
          { label: 'Three', value: 'three', content: 'Panel three' },
        ]}
      />
    ))

    const one = screen.getByRole('tab', { name: 'One' })
    const two = screen.getByRole('tab', { name: 'Two' })
    const three = screen.getByRole('tab', { name: 'Three' })

    expect(one.getAttribute('tabindex')).toBe('0')
    expect(two.getAttribute('tabindex')).toBe('-1')

    one.focus()

    fireEvent.keyDown(one, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(two)
    expect(two.getAttribute('tabindex')).toBe('0')
    expect(one.getAttribute('tabindex')).toBe('-1')
    expect(two.getAttribute('data-highlighted')).toBe('')
    expect(one.getAttribute('aria-selected')).toBe('true')
    expect(two.getAttribute('aria-selected')).toBe('false')

    fireEvent.keyDown(two, { key: 'Enter' })
    expect(two.getAttribute('aria-selected')).toBe('true')
    expect(two.getAttribute('tabindex')).toBe('0')
    expect(two.getAttribute('data-highlighted')).toBe(null)
    expect(three.getAttribute('tabindex')).toBe('-1')
  })

  test('recovers selection and focus when the focused selected tab is removed', async () => {
    const [items, setItems] = createSignal([
      { label: 'One', value: 'one', content: 'Panel one' },
      { label: 'Two', value: 'two', content: 'Panel two' },
      { label: 'Three', value: 'three', content: 'Panel three' },
    ])
    const screen = render(() => <Tabs defaultValue="two" items={items()} />)
    const two = screen.getByRole('tab', { name: 'Two' })

    two.focus()
    setItems((current) => current.filter((item) => item.value !== 'two'))
    await Promise.resolve()

    const one = screen.getByRole('tab', { name: 'One' })
    expect(one.getAttribute('aria-selected')).toBe('true')
    expect(one.getAttribute('tabindex')).toBe('0')
    expect(document.activeElement).toBe(one)
    expect(screen.getByRole('tabpanel').textContent).toBe('Panel one')
  })

  test('renders and selects tabs when ResizeObserver is unavailable', async () => {
    const originalResizeObserver = globalThis.ResizeObserver
    // oxlint-disable-next-line no-dynamic-delete
    delete (globalThis as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver

    try {
      const screen = render(() => <Tabs items={ITEMS} defaultValue="overview" />)
      const settings = screen.getByRole('tab', { name: 'Settings' })

      fireEvent.click(settings)
      expect(settings.getAttribute('aria-selected')).toBe('true')
      expect(screen.getByRole('tabpanel').textContent).toBe('Settings content')
      screen.unmount()
    } finally {
      globalThis.ResizeObserver = originalResizeObserver
    }
  })

  test('disconnects and rebinds ResizeObserver when selection changes', async () => {
    const originalResizeObserver = globalThis.ResizeObserver
    const instances: Array<{ disconnect: ReturnType<typeof vi.fn>; observed: Element[] }> = []

    class MockResizeObserver {
      disconnect = vi.fn()
      observed: Element[] = []

      constructor() {
        instances.push(this)
      }

      observe(element: Element) {
        this.observed.push(element)
      }

      // oxlint-disable-next-line class-methods-use-this
      unobserve() {}
    }

    globalThis.ResizeObserver = MockResizeObserver

    try {
      const screen = render(() => <Tabs items={ITEMS} defaultValue="overview" />)
      await Promise.resolve()

      const firstObserver = instances.at(-1)!
      expect(firstObserver.observed).toContain(screen.getByRole('tab', { name: 'Overview' }))
      expect(firstObserver.observed).toContain(screen.getByRole('tablist'))

      fireEvent.click(screen.getByRole('tab', { name: 'Settings' }))
      await Promise.resolve()

      expect(firstObserver.disconnect).toHaveBeenCalledTimes(1)
      const currentObserver = instances.at(-1)!
      expect(currentObserver).not.toBe(firstObserver)
      expect(currentObserver.observed).toContain(screen.getByRole('tab', { name: 'Settings' }))
      screen.unmount()
      expect(currentObserver.disconnect).toHaveBeenCalledTimes(1)
    } finally {
      globalThis.ResizeObserver = originalResizeObserver
    }
  })

  test('derives a fallback when the selected tab is disabled and restores the request later', async () => {
    const [disabled, setDisabled] = createSignal(false)
    const onChange = vi.fn()
    const screen = render(() => (
      <Tabs
        defaultValue="two"
        onChange={onChange}
        items={[
          { label: 'One', value: 'one', content: 'Panel one' },
          { label: 'Two', value: 'two', content: 'Panel two', disabled: disabled() },
        ]}
      />
    ))
    const two = screen.getByRole('tab', { name: 'Two' })

    two.focus()
    setDisabled(true)
    await Promise.resolve()
    const one = screen.getByRole('tab', { name: 'One' })
    expect(one.getAttribute('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(one)

    setDisabled(false)
    await Promise.resolve()
    expect(screen.getByRole('tab', { name: 'Two' }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('tabpanel').textContent).toBe('Panel two')
    expect(onChange).not.toHaveBeenCalled()
  })

  test('keeps manual focus on the same tab across reordering', async () => {
    const initialItems = [
      { label: 'One', value: 'one', content: 'Panel one' },
      { label: 'Two', value: 'two', content: 'Panel two' },
      { label: 'Three', value: 'three', content: 'Panel three' },
    ]
    const [items, setItems] = createSignal(initialItems)
    const onChange = vi.fn()
    const screen = render(() => (
      <Tabs activationMode="manual" defaultValue="one" items={items()} onChange={onChange} />
    ))
    const one = screen.getByRole('tab', { name: 'One' })

    one.focus()
    fireEvent.keyDown(one, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Two' }))

    setItems([initialItems[2]!, initialItems[1]!, initialItems[0]!])
    await Promise.resolve()

    const reorderedTwo = screen.getByRole('tab', { name: 'Two' })
    expect(document.activeElement).toBe(reorderedTwo)
    expect(reorderedTwo.getAttribute('tabindex')).toBe('0')
    expect(screen.getByRole('tab', { name: 'One' }).getAttribute('aria-selected')).toBe('true')
    expect(onChange).not.toHaveBeenCalled()
  })

  test('applies controlled updates without moving focus or emitting changes', () => {
    const [value, setValue] = createSignal('one')
    const onChange = vi.fn()
    const screen = render(() => (
      <>
        <button type="button">Outside</button>
        <Tabs
          value={value()}
          onChange={onChange}
          items={[
            { label: 'One', value: 'one', content: 'Panel one' },
            { label: 'Two', value: 'two', content: 'Panel two' },
          ]}
        />
      </>
    ))
    const one = screen.getByRole('tab', { name: 'One' })
    const outside = screen.getByRole('button', { name: 'Outside' })

    one.focus()
    setValue('two')
    expect(document.activeElement).toBe(one)
    expect(screen.getByRole('tab', { name: 'Two' }).getAttribute('aria-selected')).toBe('true')

    outside.focus()
    setValue('one')
    expect(document.activeElement).toBe(outside)
    expect(one.getAttribute('aria-selected')).toBe('true')
    expect(onChange).not.toHaveBeenCalled()
  })

  test('reads the item collection and JSX-capable item fields once', () => {
    const reads = { content: 0, icon: 0, items: 0, label: 0, value: 0 }
    const item = {
      get value() {
        reads.value += 1
        return 'zero'
      },
      get label() {
        reads.label += 1
        return 0
      },
      get icon() {
        reads.icon += 1
        return undefined
      },
      get content() {
        reads.content += 1
        return <span>Zero panel</span>
      },
    }
    const screen = render(() =>
      createComponent(Tabs, {
        defaultValue: 'zero',
        get items() {
          reads.items += 1
          return [item]
        },
      }),
    )

    expect(screen.getByRole('tab', { name: '0' })).not.toBeNull()
    expect(screen.getByRole('tabpanel').textContent).toBe('Zero panel')
    expect(reads).toEqual({ content: 1, icon: 1, items: 1, label: 1, value: 1 })
  })

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

  test('hydrates empty-value JSX without replacing nodes and handles first keyboard activation', async () => {
    const markup = renderSsrFixture(
      '/src/navigation/tabs/tabs.ssr.fixture.tsx',
      'renderTabsFixture',
    )
    const container = document.createElement('div')
    container.innerHTML = markup
    document.body.append(container)
    const serverRoot = container.querySelector('[data-slot="root"]')
    const serverList = container.querySelector('[data-slot="list"]')
    const serverFirstTrigger = container.querySelector('[role="tab"]')
    const serverPanel = container.querySelector('[role="tabpanel"]')
    const [value, setValue] = createSignal('')
    const restoreHydrationState = installHydrationState()
    const items = [
      { label: 0, value: '', content: <span data-testid="empty-panel">Empty panel</span> },
      {
        label: 'Other',
        value: 'other',
        content: <span data-testid="other-panel">Other panel</span>,
      },
    ]

    const dispose = hydrate(
      () => <Tabs id="ssr-tabs" value={value()} onChange={setValue} items={items} />,
      container,
    )

    expect(container.querySelector('[data-slot="root"]')).toBe(serverRoot)
    expect(container.querySelector('[data-slot="list"]')).toBe(serverList)
    expect(container.querySelector('[role="tab"]')).toBe(serverFirstTrigger)
    expect(container.querySelector('[role="tabpanel"]')).toBe(serverPanel)

    ;(serverFirstTrigger as HTMLElement).focus()
    fireEvent.keyDown(serverFirstTrigger!, { key: 'ArrowRight' })
    expect(container.querySelector('[role="tab"][aria-selected="true"]')?.textContent).toContain(
      'Other',
    )
    expect(container.querySelector('[data-testid="other-panel"]')?.textContent).toBe('Other panel')

    dispose()
    container.remove()
    restoreHydrationState()
  }, 15_000)

  test('keeps empty and all-disabled collections out of the tab order', () => {
    const empty = render(() => <Tabs items={[]} />)
    expect(empty.queryAllByRole('tab')).toHaveLength(0)
    expect(empty.queryAllByRole('tabpanel')).toHaveLength(0)

    const disabled = render(() => (
      <Tabs
        defaultValue="missing"
        items={[
          { label: 'One', value: 'one', content: 'Panel one', disabled: true },
          { label: 'Two', value: 'two', content: 'Panel two', disabled: true },
        ]}
      />
    ))

    expect(disabled.queryAllByRole('tab')).toHaveLength(2)
    expect(disabled.container.querySelectorAll('[role="tab"][tabindex="0"]')).toHaveLength(0)
    expect(disabled.queryAllByRole('tabpanel')).toHaveLength(0)
  })
})
