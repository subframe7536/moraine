import { fireEvent, render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { createStore } from 'solid-js/store'
import { beforeAll, afterAll, describe, expect, test, vi } from 'vitest'

import { Resizable } from './resizable'

type ResizeObserverCallback = (entries: ResizeObserverEntry[], observer: ResizeObserver) => void

class MockResizeObserver {
  private static readonly instances = new Set<MockResizeObserver>()
  private readonly observedElements = new Set<Element>()
  private readonly callback: ResizeObserverCallback

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    MockResizeObserver.instances.add(this)
  }

  observe(target: Element): void {
    this.observedElements.add(target)
  }

  unobserve(target: Element): void {
    this.observedElements.delete(target)
  }

  disconnect(): void {
    this.observedElements.clear()
    MockResizeObserver.instances.delete(this)
  }

  static trigger(target: Element): void {
    const entry = {
      target,
      contentRect: target.getBoundingClientRect(),
    } as ResizeObserverEntry

    for (const observer of MockResizeObserver.instances) {
      if (!observer.observedElements.has(target)) {
        continue
      }

      observer.callback([entry], observer as unknown as ResizeObserver)
    }
  }
}

function createRect(input: { top: number; right: number; bottom: number; left: number }): DOMRect {
  const { top, right, bottom, left } = input

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
    top,
    right,
    bottom,
    left,
    toJSON: () => ({}),
  } as DOMRect
}

function setRect(element: Element, rect: DOMRect): void {
  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: () => rect,
  })
}

function panelGrowPercent(panel: HTMLDivElement | null | undefined): number {
  return Number.parseFloat(panel?.style.flexGrow ?? '0') * 100
}

function expectPanelGrow(panel: HTMLDivElement | null | undefined, percent: number): void {
  expect(panelGrowPercent(panel)).toBeCloseTo(percent, 3)
}

async function waitForLayoutInitialization(): Promise<void> {
  await new Promise<void>((resolve) => queueMicrotask(resolve))
}

function triggerResizeObserver(target: Element): void {
  MockResizeObserver.trigger(target)
}

const defaultRect = createRect({ top: 0, right: 1000, bottom: 600, left: 0 })
const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect
const originalResizeObserver = (globalThis as Record<string, unknown>).ResizeObserver

beforeAll(() => {
  ;(globalThis as Record<string, unknown>).ResizeObserver =
    MockResizeObserver as unknown as typeof ResizeObserver

  Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
    configurable: true,
    value() {
      return defaultRect
    },
  })
})

afterAll(() => {
  if (originalResizeObserver !== undefined) {
    ;(globalThis as Record<string, unknown>).ResizeObserver = originalResizeObserver
  } else {
    delete (globalThis as Record<string, unknown>).ResizeObserver
  }

  Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
    configurable: true,
    value: originalGetBoundingClientRect,
  })
})

describe('Resizable', () => {
  test('renders panels and auto inserts handles between panels', () => {
    const screen = render(() => (
      <Resizable panels={[{ content: 'Left' }, { content: 'Center' }, { content: 'Right' }]} />
    ))

    const panels = screen.container.querySelectorAll('[data-slot="panel"]')
    const handles = screen.container.querySelectorAll('[data-slot="divider"]')

    expect(panels).toHaveLength(3)
    expect(handles).toHaveLength(2)
    expect(handles[0]?.getAttribute('role')).toBe('separator')
  })

  test('supports vertical orientation classes', () => {
    const screen = render(() => (
      <Resizable orientation="vertical" panels={[{ content: 'Top' }, { content: 'Bottom' }]} />
    ))

    const root = screen.container.querySelector('[data-slot="root"]')
    const handle = screen.container.querySelector('[data-slot="divider"]')

    expect(root?.getAttribute('data-orientation')).toBe('vertical')
    expect(root?.className).toContain('flex-col')
    expect(handle?.className).toContain('cursor-ns-resize')
  })

  test('keeps dividers visible but disables all interactions from root config', async () => {
    const onResize = vi.fn()

    const screen = render(() => (
      <Resizable
        disable
        onResize={onResize}
        panels={[{ content: 'One' }, { content: 'Two' }, { content: 'Three' }]}
      />
    ))

    const handles = screen.container.querySelectorAll('[data-slot="divider"]')
    expect(handles).toHaveLength(2)
    expect(handles[0]?.getAttribute('aria-disabled')).toBe('true')
    expect(handles[0]?.getAttribute('tabindex')).toBe('-1')

    const handle = handles[0] as HTMLElement
    await fireEvent.mouseEnter(handle)
    expect(handle.getAttribute('data-active')).toBeNull()

    await fireEvent.keyDown(handle, { key: 'ArrowRight' })
    await fireEvent.pointerDown(handle, { pointerId: 1, clientX: 0, clientY: 0 })
    await fireEvent.pointerMove(window, { pointerId: 1, clientX: 100, clientY: 0 })
    await fireEvent.pointerUp(window, { pointerId: 1, clientX: 100, clientY: 0 })

    expect(onResize).not.toHaveBeenCalled()
    expect(handle.getAttribute('data-dragging')).toBeNull()
  })

  test('applies class overrides and supports root-level custom handle rendering', () => {
    const screen = render(() => (
      <Resizable
        renderHandle={<span data-slot="custom-handle-icon" class="i-lucide-grip-vertical" />}
        classes={{
          root: 'root-override',
          panel: 'panel-override',
          divider: 'divider-override',
          handle: 'handle-override',
        }}
        panels={[{ content: 'A', class: 'panel-a' }, { content: 'B' }, { content: 'C' }]}
      />
    ))

    const root = screen.container.querySelector('[data-slot="root"]')
    const panels = screen.container.querySelectorAll('[data-slot="panel"]')
    const handles = screen.container.querySelectorAll('[data-slot="divider"]')
    const handleInners = screen.container.querySelectorAll('[data-slot="handle"]')
    const customHandleIcons = screen.container.querySelectorAll('[data-slot="custom-handle-icon"]')

    expect(root?.className).toContain('root-override')
    expect(panels[0]?.className).toContain('panel-override')
    expect(panels[0]?.className).toContain('panel-a')
    expect(handles[0]?.className).toContain('divider-override')
    expect(handleInners[0]?.className).toContain('handle-override')
    expect(handles).toHaveLength(2)
    expect(handleInners).toHaveLength(2)
    expect(customHandleIcons).toHaveLength(2)
  })

  test('supports function renderHandle with state fields and interaction updates', async () => {
    const screen = render(() => (
      <Resizable
        handleAction="collapse"
        renderHandle={(state) => (
          <span
            data-slot="state-handle"
            data-action={state.action}
            data-disabled={state.disabled ? 'true' : 'false'}
            data-active={state.active ? 'true' : 'false'}
            data-dragging={state.dragging ? 'true' : 'false'}
            data-can-collapse={state.canCollapse ? 'true' : 'false'}
            data-collapsed={state.collapsed ? 'true' : 'false'}
          >
            state
          </span>
        )}
        panels={[
          {
            content: 'Sidebar',
            defaultSize: '30%',
            min: '20%',
            collapsible: true,
            collapsibleMin: '10%',
          },
          { content: 'Content', defaultSize: '70%', min: '20%' },
        ]}
      />
    ))

    const divider = screen.container.querySelector('[data-slot="divider"]') as HTMLElement
    const getStateHandle = () =>
      screen.container.querySelector('[data-slot="state-handle"]') as HTMLElement

    expect(getStateHandle().getAttribute('data-action')).toBe('collapse')
    expect(getStateHandle().getAttribute('data-disabled')).toBe('false')
    expect(getStateHandle().getAttribute('data-active')).toBe('false')
    expect(getStateHandle().getAttribute('data-dragging')).toBe('false')
    expect(getStateHandle().getAttribute('data-can-collapse')).toBe('true')
    expect(getStateHandle().getAttribute('data-collapsed')).toBe('false')

    await fireEvent.mouseEnter(divider)
    expect(getStateHandle().getAttribute('data-active')).toBe('true')

    await fireEvent.mouseLeave(divider)
    expect(getStateHandle().getAttribute('data-active')).toBe('false')

    await fireEvent.pointerDown(divider, { pointerId: 1, clientX: 0, clientY: 0 })
    expect(getStateHandle().getAttribute('data-dragging')).toBe('true')
    await fireEvent.pointerUp(window, { pointerId: 1, clientX: 0, clientY: 0 })
    expect(getStateHandle().getAttribute('data-dragging')).toBe('false')
  })

  test('updates function renderHandle output when collapse state changes', async () => {
    const screen = render(() => (
      <Resizable
        handleAction="collapse"
        renderHandle={(state) => (
          <span data-slot="state-collapsed-label">
            {state.collapsed ? 'collapsed' : 'expanded'}
          </span>
        )}
        panels={[
          {
            content: 'Sidebar',
            defaultSize: '30%',
            min: '20%',
            collapsible: true,
            collapsibleMin: '10%',
          },
          { content: 'Content', defaultSize: '70%', min: '20%' },
        ]}
      />
    ))

    const handle = screen.container.querySelector('[data-slot="handle"]') as HTMLElement
    const getCollapsedLabel = () =>
      screen.container.querySelector('[data-slot="state-collapsed-label"]') as HTMLElement

    expect(getCollapsedLabel().textContent).toBe('expanded')
    await fireEvent.click(handle)
    expect(getCollapsedLabel().textContent).toBe('collapsed')
    await fireEvent.click(handle)
    expect(getCollapsedLabel().textContent).toBe('expanded')
  })

  test('marks function renderHandle state as disabled when root is disabled', () => {
    const screen = render(() => (
      <Resizable
        disable
        handleAction="collapse"
        renderHandle={(state) => (
          <span data-slot="state-disabled-label">{state.disabled ? 'disabled' : 'enabled'}</span>
        )}
        panels={[
          {
            content: 'Sidebar',
            defaultSize: '30%',
            min: '20%',
            collapsible: true,
            collapsibleMin: '10%',
          },
          { content: 'Content', defaultSize: '70%', min: '20%' },
        ]}
      />
    ))

    const label = screen.container.querySelector('[data-slot="state-disabled-label"]')
    expect(label?.textContent).toBe('disabled')
  })

  test('applies styles overrides', () => {
    const screen = render(() => (
      <Resizable
        styles={
          {
            root: { width: '200px' },
            panel: { width: '200px' },
            divider: { width: '200px' },
            handle: { width: '200px' },
          } as any
        }
        panels={[{ content: 'A' }, { content: 'B' }, { content: 'C' }]}
      />
    ))

    const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement | null
    const panels = screen.container.querySelectorAll('[data-slot="panel"]')
    const handles = screen.container.querySelectorAll('[data-slot="divider"]')
    const handleInners = screen.container.querySelectorAll('[data-slot="handle"]')

    expect(root?.style.width).toBe('200px')
    expect((panels[0] as HTMLElement | null)?.style.width).toBe('200px')
    expect((handles[0] as HTMLElement | null)?.style.width).toBe('200px')
    expect((handleInners[0] as HTMLElement | null)?.style.width).toBe('200px')
  })

  test('emits keyboard resize lifecycle in controlled mode with px payloads', async () => {
    const events: Array<{ type: 'start' | 'resize' | 'end'; sizes: number[] }> = []

    const screen = render(() => {
      const [sizes, setSizes] = createSignal([500, 500])

      return (
        <Resizable
          onResizeStart={(nextSizes) => events.push({ type: 'start', sizes: nextSizes })}
          onResize={(nextSizes) => {
            events.push({ type: 'resize', sizes: nextSizes })
            setSizes(nextSizes)
          }}
          onResizeEnd={(nextSizes) => events.push({ type: 'end', sizes: nextSizes })}
          panels={[
            { content: 'Left', min: '20%', size: sizes()[0] },
            { content: 'Right', min: '20%', size: sizes()[1] },
          ]}
        />
      )
    })

    const handle = screen.container.querySelector('[data-slot="divider"]') as HTMLElement
    await fireEvent.keyDown(handle, { key: 'ArrowRight' })

    expect(events.map((event) => event.type)).toEqual(['start', 'resize', 'end'])
    expect(events[0]?.sizes).toEqual([500, 500])
    expect(events[1]?.sizes[0]).toBeCloseTo(600, 3)
    expect(events[1]?.sizes[1]).toBeCloseTo(400, 3)
    expect(events[2]?.sizes).toEqual(events[1]?.sizes)

    const panels = screen.container.querySelectorAll('[data-slot="panel"]')
    expectPanelGrow(panels[0] as HTMLDivElement, 60)
    expectPanelGrow(panels[1] as HTMLDivElement, 40)
  })

  test('does not emit resize lifecycle when a keyboard interaction cannot change sizes', async () => {
    const onResizeStart = vi.fn()
    const onResize = vi.fn()
    const onResizeEnd = vi.fn()

    const screen = render(() => (
      <Resizable
        keyboardDelta={0}
        onResizeStart={onResizeStart}
        onResize={onResize}
        onResizeEnd={onResizeEnd}
        panels={[
          { content: 'Left', min: '20%', size: 200 },
          { content: 'Right', min: '20%', size: 800 },
        ]}
      />
    ))

    const handle = screen.container.querySelector('[data-slot="divider"]') as HTMLElement
    await fireEvent.keyDown(handle, { key: 'ArrowLeft' })

    expect(onResizeStart).not.toHaveBeenCalled()
    expect(onResize).not.toHaveBeenCalled()
    expect(onResizeEnd).not.toHaveBeenCalled()
  })

  test('updates controlled panel sizes from pointer dragging with px payloads', async () => {
    const events: Array<{ type: 'start' | 'resize' | 'end'; sizes: number[] }> = []

    const screen = render(() => {
      const [sizes, setSizes] = createSignal([400, 600])

      return (
        <Resizable
          onResizeStart={(nextSizes) => events.push({ type: 'start', sizes: nextSizes })}
          onResize={(nextSizes) => {
            events.push({ type: 'resize', sizes: nextSizes })
            setSizes(nextSizes)
          }}
          onResizeEnd={(nextSizes) => events.push({ type: 'end', sizes: nextSizes })}
          panels={[
            { content: 'Left', min: '20%', size: sizes()[0] },
            { content: 'Right', min: '20%', size: sizes()[1] },
          ]}
        />
      )
    })

    const handle = screen.container.querySelector('[data-slot="divider"]') as HTMLElement
    await fireEvent.pointerDown(handle, { pointerId: 1, clientX: 0, clientY: 0 })
    await fireEvent.pointerMove(window, { pointerId: 1, clientX: 100, clientY: 0 })
    await fireEvent.pointerUp(window, { pointerId: 1, clientX: 100, clientY: 0 })

    expect(events.map((event) => event.type)).toEqual(['start', 'resize', 'end'])
    expect(events[0]?.sizes).toEqual([400, 600])
    expect(events[1]?.sizes[0]).toBeCloseTo(500, 3)
    expect(events[1]?.sizes[1]).toBeCloseTo(500, 3)
    expect(events[2]?.sizes[0]).toBeGreaterThan(0)
    expect(events[2]?.sizes[1]).toBeGreaterThan(0)
  })

  test('supports controlled dragging when onResize mutates an existing panel list', async () => {
    const onResize = vi.fn()

    const screen = render(() => {
      const [panels, setPanels] = createStore([
        { content: 'Left', min: '20%' as const, size: 400 },
        { content: 'Right', min: '20%' as const, size: 600 },
      ])

      return (
        <Resizable
          onResize={(nextSizes) => {
            onResize(nextSizes)
            nextSizes.forEach((nextSize, index) => setPanels(index, 'size', nextSize))
          }}
          panels={panels}
        />
      )
    })

    const handle = screen.container.querySelector('[data-slot="divider"]') as HTMLElement
    await fireEvent.pointerDown(handle, { pointerId: 1, clientX: 0, clientY: 0 })
    await fireEvent.pointerMove(window, { pointerId: 1, clientX: 100, clientY: 0 })
    await fireEvent.pointerUp(window, { pointerId: 1, clientX: 100, clientY: 0 })

    const nextSizes = onResize.mock.calls.at(-1)?.[0] as number[] | undefined
    expect(onResize).toHaveBeenCalled()
    expect(nextSizes?.[0]).toBeCloseTo(500, 3)
    expect(nextSizes?.[1]).toBeCloseTo(500, 3)
  })

  test('supports mixed controlled sizes with px numbers and percent strings', () => {
    const screen = render(() => (
      <Resizable
        panels={[{ content: 'A', size: 200 }, { content: 'B', size: '30%' }, { content: 'C' }]}
      />
    ))

    const panels = screen.container.querySelectorAll(
      '[data-slot="panel"]',
    ) as NodeListOf<HTMLDivElement>
    expectPanelGrow(panels[0], 20)
    expectPanelGrow(panels[1], 30)
    expectPanelGrow(panels[2], 50)
  })

  test('uses defaultSize for uncontrolled items in mixed controlled mode and honors min/max', () => {
    const screen = render(() => (
      <Resizable
        panels={[
          { content: 'A', size: 900, min: '10%', max: '50%' },
          { content: 'B', defaultSize: '40%', min: '30%', max: '45%' },
          { content: 'C', min: '20%', max: '35%' },
        ]}
      />
    ))

    const panels = screen.container.querySelectorAll(
      '[data-slot="panel"]',
    ) as NodeListOf<HTMLDivElement>

    expectPanelGrow(panels[0], 50)
    expectPanelGrow(panels[1], 30)
    expectPanelGrow(panels[2], 20)
  })

  test('does not render uncontrolled panels at 0% before defaults are applied', () => {
    const screen = render(() => (
      <Resizable
        panels={[
          { content: 'Left', defaultSize: '30%' },
          { content: 'Right', defaultSize: '70%' },
        ]}
      />
    ))

    const panels = screen.container.querySelectorAll(
      '[data-slot="panel"]',
    ) as NodeListOf<HTMLDivElement>
    expectPanelGrow(panels[0], 30)
    expectPanelGrow(panels[1], 70)
  })

  test('uses defaultSize on first measured layout when px min and max are provided', async () => {
    const screen = render(() => (
      <Resizable
        panels={[
          { content: 'Sidebar', defaultSize: '15%', min: 240, max: 400 },
          { content: 'Content' },
        ]}
      />
    ))

    await waitForLayoutInitialization()

    const panels = screen.container.querySelectorAll(
      '[data-slot="panel"]',
    ) as NodeListOf<HTMLDivElement>

    expectPanelGrow(panels[0], 24)
    expectPanelGrow(panels[1], 76)
  })

  test('recomputes uncontrolled default percentage on container resize with px min/max', async () => {
    const screen = render(() => (
      <Resizable
        panels={[
          { content: 'Sidebar', defaultSize: '15%', min: 240, max: 400 },
          { content: 'Content' },
        ]}
      />
    ))

    await waitForLayoutInitialization()

    const root = screen.container.querySelector('[data-slot="root"]') as HTMLDivElement
    const panels = screen.container.querySelectorAll(
      '[data-slot="panel"]',
    ) as NodeListOf<HTMLDivElement>

    expectPanelGrow(panels[0], 24)
    expectPanelGrow(panels[1], 76)

    setRect(root, createRect({ top: 0, right: 2000, bottom: 600, left: 0 }))
    triggerResizeObserver(root)
    await waitForLayoutInitialization()

    expectPanelGrow(panels[0], 15)
    expectPanelGrow(panels[1], 85)
  })

  test('keeps uncontrolled dragged sizes as percentages after container resize', async () => {
    const screen = render(() => (
      <Resizable
        panels={[
          { content: 'Left', defaultSize: '30%' },
          { content: 'Right', defaultSize: '70%' },
        ]}
      />
    ))

    await waitForLayoutInitialization()

    const root = screen.container.querySelector('[data-slot="root"]') as HTMLDivElement
    const handle = screen.container.querySelector('[data-slot="divider"]') as HTMLElement
    const panels = screen.container.querySelectorAll(
      '[data-slot="panel"]',
    ) as NodeListOf<HTMLDivElement>

    await fireEvent.pointerDown(handle, { pointerId: 1, clientX: 0, clientY: 0 })
    await fireEvent.pointerMove(window, { pointerId: 1, clientX: 100, clientY: 0 })
    await fireEvent.pointerUp(window, { pointerId: 1, clientX: 100, clientY: 0 })

    expectPanelGrow(panels[0], 40)
    expectPanelGrow(panels[1], 60)

    setRect(root, createRect({ top: 0, right: 2000, bottom: 600, left: 0 }))
    triggerResizeObserver(root)
    await waitForLayoutInitialization()

    expectPanelGrow(panels[0], 40)
    expectPanelGrow(panels[1], 60)
  })

  test('renders panel sizing with flex grow/shrink/basis', () => {
    const screen = render(() => (
      <Resizable
        panels={[
          { content: 'Left', defaultSize: '30%' },
          { content: 'Right', defaultSize: '70%' },
        ]}
      />
    ))

    const panels = screen.container.querySelectorAll(
      '[data-slot="panel"]',
    ) as NodeListOf<HTMLDivElement>

    expectPanelGrow(panels[0], 30)
    expect(panels[0]?.style.flexShrink).toBe('1')
    expect(panels[0]?.style.flexBasis).toBe('0px')
    expectPanelGrow(panels[1], 70)
    expect(panels[1]?.style.flexShrink).toBe('1')
    expect(panels[1]?.style.flexBasis).toBe('0px')
  })

  test('does not toggle collapsible panels with Enter by default', async () => {
    const onResize = vi.fn()

    const screen = render(() => (
      <Resizable
        onResize={onResize}
        panels={[
          {
            content: 'Sidebar',
            defaultSize: '30%',
            min: '20%',
            collapsible: true,
          },
          { content: 'Content', defaultSize: '70%', min: '20%' },
        ]}
      />
    ))

    const handle = screen.container.querySelector('[data-slot="divider"]') as HTMLElement
    const panels = screen.container.querySelectorAll(
      '[data-slot="panel"]',
    ) as NodeListOf<HTMLDivElement>

    await fireEvent.keyDown(handle, { key: 'Enter' })

    expect(onResize).not.toHaveBeenCalled()
    expectPanelGrow(panels[0], 30)
    expect(panels[0]?.getAttribute('data-collapsed')).toBeNull()
  })

  test('does not toggle collapsible panels when clicking handle by default', async () => {
    const onResize = vi.fn()

    const screen = render(() => (
      <Resizable
        onResize={onResize}
        panels={[
          {
            content: 'Sidebar',
            defaultSize: '30%',
            min: '20%',
            collapsible: true,
            collapsibleMin: '10%',
          },
          { content: 'Content', defaultSize: '70%', min: '20%' },
        ]}
      />
    ))

    const handle = screen.container.querySelector('[data-slot="handle"]') as HTMLElement
    const panels = screen.container.querySelectorAll(
      '[data-slot="panel"]',
    ) as NodeListOf<HTMLDivElement>

    await fireEvent.click(handle)

    expect(onResize).not.toHaveBeenCalled()
    expectPanelGrow(panels[0], 30)
    expect(panels[0]?.getAttribute('data-collapsed')).toBeNull()
  })

  test('toggles nearest collapsible panel when clicking handle in collapse mode', async () => {
    const screen = render(() => (
      <Resizable
        handleAction="collapse"
        panels={[
          {
            content: 'Sidebar',
            defaultSize: '30%',
            min: '20%',
            collapsible: true,
            collapsibleMin: '10%',
          },
          { content: 'Content', defaultSize: '70%', min: '20%' },
        ]}
      />
    ))

    const handle = screen.container.querySelector('[data-slot="handle"]') as HTMLElement
    const panels = screen.container.querySelectorAll(
      '[data-slot="panel"]',
    ) as NodeListOf<HTMLDivElement>

    expectPanelGrow(panels[0], 30)
    expect(panels[0]?.getAttribute('data-transitioning')).toBeNull()

    await fireEvent.click(handle)
    expectPanelGrow(panels[0], 10)
    expect(panels[0]?.getAttribute('data-collapsed')).toBe('')
    expect(panels[0]?.getAttribute('data-transitioning')).toBe('')

    await fireEvent.click(handle)
    expectPanelGrow(panels[0], 30)
    expect(panels[0]?.getAttribute('data-collapsed')).toBeNull()
    expect(panels[0]?.getAttribute('data-transitioning')).toBe('')
  })

  test('clears transitioning marker on flex-grow transition end', async () => {
    const screen = render(() => (
      <Resizable
        handleAction="collapse"
        panels={[
          {
            content: 'Sidebar',
            defaultSize: '30%',
            min: '20%',
            collapsible: true,
            collapsibleMin: '10%',
          },
          { content: 'Content', defaultSize: '70%', min: '20%' },
        ]}
      />
    ))

    const handle = screen.container.querySelector('[data-slot="handle"]') as HTMLElement
    const panel = screen.container.querySelectorAll('[data-slot="panel"]')[0] as HTMLDivElement

    await fireEvent.click(handle)
    expect(panel.getAttribute('data-transitioning')).toBe('')

    await fireEvent.transitionEnd(panel, { propertyName: 'flex-grow' })
    expect(panel.getAttribute('data-transitioning')).toBeNull()
  })

  test('keeps handle drag non-resize in collapse mode while divider drag still resizes', async () => {
    const screen = render(() => (
      <Resizable
        handleAction="collapse"
        renderHandle
        panels={[
          {
            content: 'Sidebar',
            defaultSize: '30%',
            min: '20%',
            collapsible: true,
            collapsibleMin: '10%',
          },
          { content: 'Content', defaultSize: '70%', min: '20%' },
        ]}
      />
    ))

    const handle = screen.container.querySelector('[data-slot="handle"]') as HTMLElement
    const divider = screen.container.querySelector('[data-slot="divider"]') as HTMLElement
    const panels = screen.container.querySelectorAll(
      '[data-slot="panel"]',
    ) as NodeListOf<HTMLDivElement>

    await fireEvent.pointerDown(handle, { pointerId: 1, clientX: 0, clientY: 0 })
    await fireEvent.pointerMove(window, { pointerId: 1, clientX: 100, clientY: 0 })
    await fireEvent.pointerUp(window, { pointerId: 1, clientX: 100, clientY: 0 })
    expectPanelGrow(panels[0], 30)
    expectPanelGrow(panels[1], 70)

    await fireEvent.pointerDown(divider, { pointerId: 1, clientX: 0, clientY: 0 })
    await fireEvent.pointerMove(window, { pointerId: 1, clientX: 100, clientY: 0 })
    await fireEvent.pointerUp(window, { pointerId: 1, clientX: 100, clientY: 0 })
    expectPanelGrow(panels[0], 40)
    expectPanelGrow(panels[1], 60)
  })

  test('uses pointer cursor for handle in collapse mode and keeps divider resize cursor', () => {
    const screen = render(() => (
      <Resizable
        handleAction="collapse"
        panels={[
          { content: 'Sidebar', defaultSize: '30%', collapsible: true, collapsibleMin: '10%' },
          { content: 'Content', defaultSize: '70%' },
        ]}
      />
    ))

    const divider = screen.container.querySelector('[data-slot="divider"]') as HTMLElement
    const handle = screen.container.querySelector('[data-slot="handle"]') as HTMLElement

    expect(divider.className).toContain('cursor-ew-resize')
    expect(handle.className).toContain('cursor-pointer')
  })

  test('toggles collapse when collapsible signal changes', async () => {
    const screen = render(() => {
      const [collapsed, setCollapsed] = createSignal(false)
      const [sizes, setSizes] = createSignal<[number, number]>([320, 680])

      function handleResize(nextSizes: number[]): void {
        const leftSize = nextSizes[0]!
        const rightSize = nextSizes[1]!
        if (!Number.isFinite(leftSize) || !Number.isFinite(rightSize)) {
          return
        }

        setSizes([leftSize, rightSize])
      }

      return (
        <div>
          <button
            type="button"
            data-slot="toggle-collapsible"
            onClick={() => setCollapsed((prev) => !prev)}
          >
            Toggle
          </button>

          <Resizable
            onResize={handleResize}
            panels={[
              {
                content: 'Sidebar',
                size: sizes()[0],
                min: '16%',
                collapsible: collapsed(),
                collapsibleMin: '10%',
              },
              { content: 'Content', size: sizes()[1], min: '24%' },
            ]}
          />
        </div>
      )
    })

    const toggle = screen.container.querySelector('[data-slot="toggle-collapsible"]') as HTMLElement
    const panels = screen.container.querySelectorAll(
      '[data-slot="panel"]',
    ) as NodeListOf<HTMLDivElement>

    expectPanelGrow(panels[0], 32)

    await fireEvent.click(toggle)
    expectPanelGrow(panels[0], 10)
    expect(panels[0]?.getAttribute('data-collapsed')).toBe('')
    expect(panels[0]?.getAttribute('data-transitioning')).toBe('')

    await fireEvent.click(toggle)
    expectPanelGrow(panels[0], 32)
    expect(panels[0]?.getAttribute('data-transitioning')).toBe('')
  })

  test('calls onHandleKeyDown with handle context and keeps keyboard resize behavior', async () => {
    const onHandleKeyDown = vi.fn()

    const screen = render(() => (
      <Resizable
        onHandleKeyDown={onHandleKeyDown}
        panels={[
          { content: 'Left', min: '20%', defaultSize: '50%' },
          { content: 'Right', min: '20%', defaultSize: '50%' },
        ]}
      />
    ))

    const handle = screen.container.querySelector('[data-slot="divider"]') as HTMLElement
    const panels = screen.container.querySelectorAll(
      '[data-slot="panel"]',
    ) as NodeListOf<HTMLDivElement>

    await fireEvent.keyDown(handle, { key: 'ArrowRight' })

    expect(onHandleKeyDown).toHaveBeenCalledTimes(1)
    const context = onHandleKeyDown.mock.calls[0]?.[0] as {
      event: KeyboardEvent
      handleIndex: number
      sizes: number[]
    }
    expect(context.handleIndex).toBe(0)
    expect(context.sizes[0]).toBeCloseTo(500, 3)
    expect(context.sizes[1]).toBeCloseTo(500, 3)
    expect(context.event.key).toBe('ArrowRight')
    expectPanelGrow(panels[0], 60)
    expectPanelGrow(panels[1], 40)
  })

  test('skips internal keyboard resize when onHandleKeyDown prevents default', async () => {
    const screen = render(() => (
      <Resizable
        onHandleKeyDown={({ event }) => {
          if (event.key === 'ArrowRight') {
            event.preventDefault()
          }
        }}
        panels={[
          { content: 'Left', min: '20%', size: 500 },
          { content: 'Right', min: '20%', size: 500 },
        ]}
      />
    ))

    const handle = screen.container.querySelector('[data-slot="divider"]') as HTMLElement
    const panels = screen.container.querySelectorAll(
      '[data-slot="panel"]',
    ) as NodeListOf<HTMLDivElement>

    await fireEvent.keyDown(handle, { key: 'ArrowRight' })

    expectPanelGrow(panels[0], 50)
    expectPanelGrow(panels[1], 50)
  })

  test('supports dragging when pointer down starts on handle visual area', async () => {
    const screen = render(() => (
      <Resizable renderHandle panels={[{ content: 'Left' }, { content: 'Right' }]} />
    ))

    const handleVisual = screen.container.querySelector('[data-slot="handle"]') as HTMLElement
    const panels = screen.container.querySelectorAll(
      '[data-slot="panel"]',
    ) as NodeListOf<HTMLDivElement>

    await fireEvent.pointerDown(handleVisual, { pointerId: 1, clientX: 0, clientY: 0 })
    await fireEvent.pointerMove(window, { pointerId: 1, clientX: 100, clientY: 0 })
    await fireEvent.pointerUp(window, { pointerId: 1, clientX: 100, clientY: 0 })

    expectPanelGrow(panels[0], 60)
    expectPanelGrow(panels[1], 40)
  })

  test('snaps expanded size to min when releasing a drag from collapsibleMin state', async () => {
    const screen = render(() => {
      const [sizes, setSizes] = createSignal([100, 900])

      return (
        <Resizable
          onResize={(nextSizes) => setSizes(nextSizes)}
          panels={[
            {
              content: 'Left',
              size: sizes()[0],
              min: '20%',
              collapsible: true,
              collapsibleMin: '10%',
            },
            { content: 'Right', size: sizes()[1], min: '20%' },
          ]}
        />
      )
    })

    const handle = screen.container.querySelector('[data-slot="divider"]') as HTMLElement
    const panels = screen.container.querySelectorAll(
      '[data-slot="panel"]',
    ) as NodeListOf<HTMLDivElement>

    expectPanelGrow(panels[0], 10)
    expect(panels[0]?.getAttribute('data-collapsed')).toBe('')

    await fireEvent.pointerDown(handle, { pointerId: 1, clientX: 0, clientY: 0 })
    await fireEvent.pointerMove(window, { pointerId: 1, clientX: 50, clientY: 0 })
    expectPanelGrow(panels[0], 15)

    await fireEvent.pointerUp(window, { pointerId: 1, clientX: 50, clientY: 0 })
    expectPanelGrow(panels[0], 20)
  })

  test('marks panel as collapsed when its size equals collapsibleMin', () => {
    const screen = render(() => (
      <Resizable
        panels={[
          { content: 'Left', size: 100, min: '20%', collapsible: true, collapsibleMin: '10%' },
          { content: 'Right', size: 900, min: '20%' },
        ]}
      />
    ))

    const panels = screen.container.querySelectorAll(
      '[data-slot="panel"]',
    ) as NodeListOf<HTMLDivElement>

    expect(panels[0]?.getAttribute('data-collapsed')).toBe('')
    expect(panels[0]?.getAttribute('data-expanded')).toBeNull()
  })

  test('does not render built-in collapsible buttons', () => {
    const screen = render(() => (
      <Resizable
        panels={[
          { content: 'Left', collapsible: true },
          { content: 'Center', collapsible: true },
          { content: 'Right' },
        ]}
      />
    ))

    expect(screen.container.querySelectorAll('[data-slot="collapsible"]')).toHaveLength(0)
  })

  test('enables transition when collapse or expand is triggered', async () => {
    const screen = render(() => (
      <Resizable
        handleAction="collapse"
        panels={[
          {
            content: 'Sidebar',
            defaultSize: '30%',
            min: '20%',
            collapsible: true,
            collapsibleMin: '10%',
          },
          { content: 'Content', defaultSize: '70%', min: '20%' },
        ]}
      />
    ))

    const handle = screen.container.querySelector('[data-slot="handle"]') as HTMLElement
    const panel = screen.container.querySelectorAll('[data-slot="panel"]')[0] as HTMLDivElement

    expect(panel.className).toContain('data-transitioning:(transition-flex-grow duration-200)')
    expect(panel.getAttribute('data-transitioning')).toBeNull()

    await fireEvent.click(handle)
    expect(panel.getAttribute('data-transitioning')).toBe('')

    await fireEvent.transitionEnd(panel, { propertyName: 'flex-grow' })
    expect(panel.getAttribute('data-transitioning')).toBeNull()

    await fireEvent.click(handle)
    expect(panel.getAttribute('data-transitioning')).toBe('')
  })

  test('does not mark transition during controlled size updates', async () => {
    const screen = render(() => {
      const [sizes, setSizes] = createSignal<[number, number]>([350, 650])

      function resizeSidebar(): void {
        setSizes([300, 700])
      }

      return (
        <div>
          <button type="button" data-slot="resize" onClick={resizeSidebar}>
            Resize
          </button>
          <Resizable
            panels={[
              { content: 'Left', size: sizes()[0], collapsible: true },
              { content: 'Right', size: sizes()[1] },
            ]}
          />
        </div>
      )
    })

    const resizeButton = screen.container.querySelector('[data-slot="resize"]') as HTMLButtonElement
    const getSidebar = () =>
      screen.container.querySelectorAll('[data-slot="panel"]')[0] as HTMLDivElement

    await waitForLayoutInitialization()

    expect(getSidebar().getAttribute('data-transitioning')).toBeNull()

    await fireEvent.click(resizeButton)
    expectPanelGrow(getSidebar(), 30)
    expect(getSidebar().getAttribute('data-transitioning')).toBeNull()
  })

  test('supports nested resizable panels and root-level intersection config', async () => {
    const screen = render(() => (
      <Resizable
        renderHandle
        intersection
        panels={[
          { content: 'Outer Left' },
          {
            content: (
              <Resizable
                orientation="vertical"
                renderHandle
                intersection
                panels={[{ content: 'Inner Top' }, { content: 'Inner Bottom' }]}
              />
            ),
          },
        ]}
      />
    ))

    const handles = screen.container.querySelectorAll('[data-slot="divider"]')
    const [outerHandle, innerHandle] = Array.from(handles) as [HTMLDivElement, HTMLDivElement]

    setRect(outerHandle, createRect({ top: 0, right: 101, bottom: 200, left: 100 }))
    setRect(innerHandle, createRect({ top: 80, right: 220, bottom: 81, left: 101 }))

    const { refreshResizableHandleIntersections } = await import('./hook/manager')
    refreshResizableHandleIntersections()
    await Promise.resolve()

    const crossTargets = screen.container.querySelectorAll('[data-slot="cross-target"]')
    expect(crossTargets.length).toBeGreaterThan(0)
    const hasEdgeTarget = Array.from(crossTargets).some(
      (target) =>
        target.hasAttribute('data-resizable-handle-start-target') ||
        target.hasAttribute('data-resizable-handle-end-target'),
    )
    expect(hasEdgeTarget).toBe(true)
  })

  test('does not show cross targets when the root handle system is disabled', async () => {
    const screen = render(() => (
      <Resizable
        disable
        renderHandle
        intersection
        panels={[
          { content: 'Outer Left' },
          {
            content: (
              <Resizable
                orientation="vertical"
                renderHandle
                intersection
                panels={[{ content: 'Inner Top' }, { content: 'Inner Bottom' }]}
              />
            ),
          },
        ]}
      />
    ))

    const handles = screen.container.querySelectorAll('[data-slot="divider"]')
    const [outerHandle, innerHandle] = Array.from(handles) as [HTMLDivElement, HTMLDivElement]

    setRect(outerHandle, createRect({ top: 0, right: 101, bottom: 200, left: 100 }))
    setRect(innerHandle, createRect({ top: 80, right: 220, bottom: 81, left: 101 }))

    const { refreshResizableHandleIntersections } = await import('./hook/manager')
    refreshResizableHandleIntersections()
    await Promise.resolve()

    expect(screen.container.querySelectorAll('[data-slot="cross-target"]')).toHaveLength(0)
  })

  test('marks all affected handles as active when hovering a cross-target', async () => {
    const screen = render(() => (
      <Resizable
        renderHandle
        intersection
        panels={[
          { content: 'Outer Left' },
          {
            content: (
              <Resizable
                orientation="vertical"
                renderHandle
                intersection
                panels={[{ content: 'Inner Top' }, { content: 'Inner Bottom' }]}
              />
            ),
          },
        ]}
      />
    ))

    const handles = screen.container.querySelectorAll('[data-slot="divider"]')
    const [outerHandle, innerHandle] = Array.from(handles) as [HTMLDivElement, HTMLDivElement]

    setRect(outerHandle, createRect({ top: 0, right: 101, bottom: 200, left: 100 }))
    setRect(innerHandle, createRect({ top: 80, right: 220, bottom: 81, left: 101 }))

    const { refreshResizableHandleIntersections } = await import('./hook/manager')
    refreshResizableHandleIntersections()
    await Promise.resolve()

    const crossTarget = innerHandle.querySelector('[data-slot="cross-target"]') as HTMLElement
    expect(crossTarget).toBeTruthy()
    expect(outerHandle.getAttribute('data-active')).toBeNull()
    expect(innerHandle.getAttribute('data-active')).toBeNull()

    await fireEvent.mouseEnter(crossTarget)
    expect(outerHandle.getAttribute('data-active')).toBe('')
    expect(innerHandle.getAttribute('data-active')).toBe('')

    await fireEvent.mouseLeave(crossTarget)
    expect(outerHandle.getAttribute('data-active')).toBeNull()
    expect(innerHandle.getAttribute('data-active')).toBeNull()
  })

  test('keeps handle index reactive after the panels list changes', async () => {
    const onResize = vi.fn()

    const screen = render(() => {
      const [panelMetas, setPanelMetas] = createSignal([
        { content: 'One', min: '20%' as const },
        { content: 'Two', min: '20%' as const },
        { content: 'Three', min: '20%' as const },
      ])
      const [sizes, setSizes] = createSignal([340, 330, 330])
      const panels = () =>
        panelMetas().map((panel, index) =>
          Object.assign({}, panel, {
            size: sizes()[index],
          }),
        )

      return (
        <div>
          <button
            type="button"
            data-slot="shrink"
            onClick={() => {
              setPanelMetas((previous) => previous.slice(1))
              setSizes([500, 500])
            }}
          >
            Shrink
          </button>
          <Resizable
            onResize={(nextSizes) => {
              onResize(nextSizes)
              setSizes(nextSizes)
            }}
            panels={panels()}
          />
        </div>
      )
    })

    const shrinkButton = screen.container.querySelector('[data-slot="shrink"]') as HTMLButtonElement
    await fireEvent.click(shrinkButton)

    const handles = screen.container.querySelectorAll('[data-slot="divider"]')
    expect(handles).toHaveLength(1)

    const handle = handles[0] as HTMLElement
    await fireEvent.keyDown(handle, { key: 'ArrowRight' })

    const nextSizes = onResize.mock.calls.at(-1)?.[0] as number[] | undefined
    expect(Array.isArray(nextSizes)).toBe(true)
    expect(nextSizes).toHaveLength(2)
    expect(nextSizes?.[0]).toBeCloseTo(600, 3)
    expect(nextSizes?.[1]).toBeCloseTo(400, 3)
  })

  test('updates data-active and data-dragging through hover and drag states', async () => {
    const screen = render(() => <Resizable panels={[{ content: 'Left' }, { content: 'Right' }]} />)

    const handle = screen.container.querySelector('[data-slot="divider"]') as HTMLElement
    const panel = screen.container.querySelector('[data-slot="panel"]') as HTMLDivElement

    expect(handle.getAttribute('data-active')).toBeNull()
    expect(handle.getAttribute('data-dragging')).toBeNull()
    expect(panel.getAttribute('data-resizing')).toBeNull()
    expect(panel.getAttribute('data-transitioning')).toBeNull()

    await fireEvent.mouseEnter(handle)
    expect(handle.getAttribute('data-active')).toBe('')

    await fireEvent.mouseLeave(handle)
    expect(handle.getAttribute('data-active')).toBeNull()

    await fireEvent.pointerDown(handle, { pointerId: 1, clientX: 0, clientY: 0 })
    expect(handle.getAttribute('data-active')).toBe('')
    expect(handle.getAttribute('data-dragging')).toBe('')
    await fireEvent.pointerMove(window, { pointerId: 1, clientX: 100, clientY: 0 })
    expect(panel.getAttribute('data-resizing')).toBe('')
    expect(panel.getAttribute('data-transitioning')).toBeNull()

    await fireEvent.pointerUp(window, { pointerId: 1, clientX: 0, clientY: 0 })
    expect(handle.getAttribute('data-dragging')).toBeNull()
    expect(panel.getAttribute('data-resizing')).toBeNull()
    expect(panel.getAttribute('data-transitioning')).toBeNull()
  })

  test('locks document text selection while dragging from cross target and restores afterwards', async () => {
    const screen = render(() => (
      <Resizable
        renderHandle
        intersection
        panels={[
          { content: 'Outer Left' },
          {
            content: (
              <Resizable
                orientation="vertical"
                renderHandle
                intersection
                panels={[{ content: 'Inner Top' }, { content: 'Inner Bottom' }]}
              />
            ),
          },
        ]}
      />
    ))

    const handles = screen.container.querySelectorAll('[data-slot="divider"]')
    const [outerHandle, innerHandle] = Array.from(handles) as [HTMLDivElement, HTMLDivElement]
    setRect(outerHandle, createRect({ top: 0, right: 101, bottom: 200, left: 100 }))
    setRect(innerHandle, createRect({ top: 80, right: 220, bottom: 81, left: 101 }))

    const { refreshResizableHandleIntersections } = await import('./hook/manager')
    refreshResizableHandleIntersections()
    await Promise.resolve()

    document.body.style.userSelect = 'text'
    const crossTarget = innerHandle.querySelector('[data-slot="cross-target"]') as HTMLElement
    await fireEvent.pointerDown(crossTarget, { pointerId: 1, clientX: 102, clientY: 80 })
    expect(document.body.style.userSelect).toBe('none')

    await fireEvent.pointerMove(window, { pointerId: 1, clientX: 132, clientY: 110 })
    await fireEvent.pointerUp(window, { pointerId: 1, clientX: 132, clientY: 110 })
    expect(document.body.style.userSelect).toBe('text')
  })

  test('keeps divider in cross-hovered state through press and release on cross target', async () => {
    const screen = render(() => (
      <Resizable
        renderHandle
        intersection
        panels={[
          { content: 'Outer Left' },
          {
            content: (
              <Resizable
                orientation="vertical"
                renderHandle
                intersection
                panels={[{ content: 'Inner Top' }, { content: 'Inner Bottom' }]}
              />
            ),
          },
        ]}
      />
    ))

    const handles = screen.container.querySelectorAll('[data-slot="divider"]')
    const [outerHandle, innerHandle] = Array.from(handles) as [HTMLDivElement, HTMLDivElement]
    setRect(outerHandle, createRect({ top: 0, right: 101, bottom: 200, left: 100 }))
    setRect(innerHandle, createRect({ top: 80, right: 220, bottom: 81, left: 101 }))

    const { refreshResizableHandleIntersections } = await import('./hook/manager')
    refreshResizableHandleIntersections()
    await Promise.resolve()

    const crossTarget = innerHandle.querySelector('[data-slot="cross-target"]') as HTMLElement

    await fireEvent.mouseEnter(crossTarget)
    expect(innerHandle.getAttribute('data-cross')).toBe('')
    expect(outerHandle.getAttribute('data-cross')).toBe('')

    await fireEvent.pointerDown(crossTarget, { pointerId: 1, clientX: 102, clientY: 80 })
    expect(innerHandle.getAttribute('data-cross')).toBe('')
    expect(outerHandle.getAttribute('data-cross')).toBe('')

    await fireEvent.pointerUp(window, { pointerId: 1, clientX: 102, clientY: 80 })
    expect(innerHandle.getAttribute('data-cross')).toBe('')
    expect(outerHandle.getAttribute('data-cross')).toBe('')

    await fireEvent.mouseLeave(crossTarget)
    expect(innerHandle.getAttribute('data-cross')).toBeNull()
    expect(outerHandle.getAttribute('data-cross')).toBeNull()
  })
})
