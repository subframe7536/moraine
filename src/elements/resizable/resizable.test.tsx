import { fireEvent, render } from '@solidjs/testing-library'
import { For, Show, createSignal, splitProps } from 'solid-js'
import type { JSX } from 'solid-js'
import { createStore } from 'solid-js/store'
import { beforeAll, afterAll, describe, expect, test, vi } from 'vitest'

import { MoraineProvider } from '../../shared/provider/index.ts'

import type { ResizablePanelItem } from './hook/index.ts'
import { Resizable } from './resizable.tsx'
import type { ResizableProps, ResizableT } from './resizable.types.ts'

interface ResizableFixtureProps extends Omit<ResizableProps, 'children'> {
  items: ResizablePanelItem[]
  handle?: boolean
  handleChildren?: ResizableT.HandleBase['children']
  action?: ResizableT.HandleBase['action']
  intersection?: boolean
}

function ResizableFixture(props: ResizableFixtureProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'items',
    'handle',
    'handleChildren',
    'action',
    'intersection',
  ])

  return (
    <Resizable {...rest}>
      <For each={local.items}>
        {(panel, index) => (
          <>
            <Resizable.Panel
              id={panel.panelId}
              size={panel.size}
              defaultSize={panel.defaultSize}
              min={panel.min}
              max={panel.max}
              resizable={panel.resizable}
              collapsible={panel.collapsible}
              collapsibleMin={panel.collapsibleMin}
              onResize={panel.onResize}
              onCollapse={panel.onCollapse}
              onExpand={panel.onExpand}
              class={panel.class}
              style={panel.style}
            >
              {panel.content}
            </Resizable.Panel>
            <Show when={index() < local.items.length - 1}>
              <Resizable.Handle
                action={local.action}
                intersection={local.intersection}
                children={local.handle === false ? false : local.handleChildren}
              />
            </Show>
          </>
        )}
      </For>
    </Resizable>
  )
}

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

      observer.callback([entry], observer)
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
  }
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
  ;(globalThis as Record<string, unknown>).ResizeObserver = MockResizeObserver

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
  test('renders unstyled when provider is absent', () => {
    const screen = render(() => (
      <ResizableFixture items={[{ content: 'Left' }, { content: 'Right' }]} />
    ))
    const root = screen.container.querySelector('[data-slot="root"]')
    const divider = screen.container.querySelector('[data-slot="divider"]')
    const handle = screen.container.querySelector('[data-slot="handle"]')
    const panel = screen.container.querySelector('[data-slot="panel"]')

    expect(root?.className).toBe('')
    expect(divider?.className).toBe('')
    expect(handle?.className).toBe('')
    expect(panel?.className).toBe('')
  })

  test('composes the root ref with internal layout measurement', async () => {
    let root: HTMLDivElement | undefined
    const screen = render(() => (
      <ResizableFixture
        ref={(element) => {
          root = element
        }}
        items={[{ content: 'Left' }, { content: 'Right' }]}
      />
    ))

    await waitForLayoutInitialization()

    const panels = screen.container.querySelectorAll('[data-slot="panel"]')
    expect(root).toBe(screen.container.querySelector('[data-slot="root"]'))
    expectPanelGrow(panels[0] as HTMLDivElement, 50)
    expectPanelGrow(panels[1] as HTMLDivElement, 50)
  })

  test('accepts static JSX for handleChildren', () => {
    const screen = render(() => (
      <ResizableFixture
        handle
        handleChildren={<span data-testid="handle-content">Resize</span>}
        items={[{ content: 'Left' }, { content: 'Right' }]}
      />
    ))

    expect(screen.getByTestId('handle-content').textContent).toBe('Resize')
  })

  test('renders panels and auto inserts handles between panels', () => {
    const screen = render(() => (
      <ResizableFixture
        items={[{ content: 'Left' }, { content: 'Center' }, { content: 'Right' }]}
      />
    ))

    const panels = screen.container.querySelectorAll('[data-slot="panel"]')
    const handles = screen.container.querySelectorAll('[data-slot="divider"]')

    expect(panels).toHaveLength(3)
    expect(handles).toHaveLength(2)
    expect(handles[0]?.getAttribute('role')).toBe('separator')
  })

  test('keeps built-in handle content and hidden handle behavior stable', () => {
    const builtIn = render(() => (
      <ResizableFixture handle items={[{ content: 'Left' }, { content: 'Right' }]} />
    ))

    expect(builtIn.container.querySelectorAll('[data-slot="divider"]')).toHaveLength(1)
    expect(builtIn.container.querySelectorAll('[data-slot="handle"]')).toHaveLength(1)
    expect(builtIn.container.querySelector('[data-slot="handle"]')?.textContent).toBe('')
    builtIn.unmount()

    const hidden = render(() => (
      <ResizableFixture handle={false} items={[{ content: 'Left' }, { content: 'Right' }]} />
    ))

    expect(hidden.container.querySelectorAll('[data-slot="divider"]')).toHaveLength(1)
    expect(hidden.container.querySelector('[data-slot="handle"]')).toBeNull()
  })

  test('supports vertical orientation classes', () => {
    const screen = render(() => (
      <MoraineProvider>
        <ResizableFixture
          orientation="vertical"
          items={[{ content: 'Top' }, { content: 'Bottom' }]}
        />
      </MoraineProvider>
    ))

    const root = screen.container.querySelector('[data-slot="root"]')
    const handle = screen.container.querySelector('[data-slot="divider"]')

    expect(root?.hasAttribute('data-orientation')).toBe(false)
    expect(root?.className).toContain('flex-col')
    expect(handle?.className).toContain('cursor-ns-resize')
  })

  test('allows callers to override the generated orientation attribute', () => {
    const screen = render(() => (
      <ResizableFixture
        data-orientation="caller-defined"
        items={[{ content: 'Left' }, { content: 'Right' }]}
      />
    ))

    const root = screen.container.querySelector('[data-slot="root"]')
    expect(root?.getAttribute('data-orientation')).toBe('caller-defined')
  })

  test('keeps dividers visible but disables all interactions from root config', async () => {
    const onResize = vi.fn()

    const screen = render(() => (
      <ResizableFixture
        disable
        onResize={onResize}
        items={[{ content: 'One' }, { content: 'Two' }, { content: 'Three' }]}
      />
    ))

    const handles = screen.container.querySelectorAll('[data-slot="divider"]')
    expect(handles).toHaveLength(2)
    expect(handles[0]?.getAttribute('aria-disabled')).toBe('true')
    expect(handles[0]?.getAttribute('tabindex')).toBe('-1')

    const handle = handles[0] as HTMLElement
    fireEvent.mouseEnter(handle)
    expect(handle.getAttribute('data-active')).toBeNull()

    fireEvent.keyDown(handle, { key: 'ArrowRight' })
    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 100, clientY: 0 })
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 100, clientY: 0 })

    expect(onResize).not.toHaveBeenCalled()
    expect(handle.getAttribute('data-dragging')).toBeNull()
  })

  test('applies class overrides and supports root-level custom handle rendering', () => {
    const screen = render(() => (
      <ResizableFixture
        handleChildren={() => (
          <span data-slot="custom-handle-icon" class="i-lucide-grip-vertical" />
        )}
        classes={{
          root: 'root-override',
          panel: 'panel-override',
          divider: 'divider-override',
          handle: 'handle-override',
        }}
        items={[{ content: 'A', class: 'panel-a' }, { content: 'B' }, { content: 'C' }]}
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

  test('supports function handle with state fields and interaction updates', async () => {
    const screen = render(() => (
      <ResizableFixture
        action="collapse"
        handleChildren={(state) => (
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
        items={[
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

    fireEvent.mouseEnter(divider)
    expect(getStateHandle().getAttribute('data-active')).toBe('true')

    fireEvent.mouseLeave(divider)
    expect(getStateHandle().getAttribute('data-active')).toBe('false')

    fireEvent.pointerDown(divider, { pointerId: 1, clientX: 0, clientY: 0 })
    expect(getStateHandle().getAttribute('data-dragging')).toBe('true')
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 0, clientY: 0 })
    expect(getStateHandle().getAttribute('data-dragging')).toBe('false')
  })

  test('updates function handle output when collapse state changes', async () => {
    const screen = render(() => (
      <ResizableFixture
        action="collapse"
        handleChildren={(state) => (
          <span data-slot="state-collapsed-label">
            {state.collapsed ? 'collapsed' : 'expanded'}
          </span>
        )}
        items={[
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
    fireEvent.click(handle)
    expect(getCollapsedLabel().textContent).toBe('collapsed')
    fireEvent.click(handle)
    expect(getCollapsedLabel().textContent).toBe('expanded')
  })

  test('marks function handle state as disabled when root is disabled', () => {
    const screen = render(() => (
      <ResizableFixture
        disable
        action="collapse"
        handleChildren={(state) => (
          <span data-slot="state-disabled-label">{state.disabled ? 'disabled' : 'enabled'}</span>
        )}
        items={[
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
      <ResizableFixture
        styles={{
          root: { width: '200px' },
          panel: { width: '200px' },
          divider: { width: '200px' },
          handle: { width: '200px' },
        }}
        items={[{ content: 'A' }, { content: 'B' }, { content: 'C' }]}
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
        <ResizableFixture
          onResizeStart={(nextSizes) => events.push({ type: 'start', sizes: nextSizes })}
          onResize={(nextSizes) => {
            events.push({ type: 'resize', sizes: nextSizes })
            setSizes(nextSizes)
          }}
          onResizeEnd={(nextSizes) => events.push({ type: 'end', sizes: nextSizes })}
          items={[
            { content: 'Left', min: '20%', size: sizes()[0] },
            { content: 'Right', min: '20%', size: sizes()[1] },
          ]}
        />
      )
    })

    const handle = screen.container.querySelector('[data-slot="divider"]') as HTMLElement
    fireEvent.keyDown(handle, { key: 'ArrowRight' })

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
      <ResizableFixture
        keyboardDelta={0}
        onResizeStart={onResizeStart}
        onResize={onResize}
        onResizeEnd={onResizeEnd}
        items={[
          { content: 'Left', min: '20%', size: 200 },
          { content: 'Right', min: '20%', size: 800 },
        ]}
      />
    ))

    const handle = screen.container.querySelector('[data-slot="divider"]') as HTMLElement
    fireEvent.keyDown(handle, { key: 'ArrowLeft' })

    expect(onResizeStart).not.toHaveBeenCalled()
    expect(onResize).not.toHaveBeenCalled()
    expect(onResizeEnd).not.toHaveBeenCalled()
  })

  test('updates controlled panel sizes from pointer dragging with px payloads', async () => {
    const events: Array<{ type: 'start' | 'resize' | 'end'; sizes: number[] }> = []

    const screen = render(() => {
      const [sizes, setSizes] = createSignal([400, 600])

      return (
        <ResizableFixture
          onResizeStart={(nextSizes) => events.push({ type: 'start', sizes: nextSizes })}
          onResize={(nextSizes) => {
            events.push({ type: 'resize', sizes: nextSizes })
            setSizes(nextSizes)
          }}
          onResizeEnd={(nextSizes) => events.push({ type: 'end', sizes: nextSizes })}
          items={[
            { content: 'Left', min: '20%', size: sizes()[0] },
            { content: 'Right', min: '20%', size: sizes()[1] },
          ]}
        />
      )
    })

    const handle = screen.container.querySelector('[data-slot="divider"]') as HTMLElement
    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 100, clientY: 0 })
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 100, clientY: 0 })

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
        <ResizableFixture
          onResize={(nextSizes) => {
            onResize(nextSizes)
            nextSizes.forEach((nextSize, index) => setPanels(index, 'size', nextSize))
          }}
          items={panels}
        />
      )
    })

    const handle = screen.container.querySelector('[data-slot="divider"]') as HTMLElement
    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 100, clientY: 0 })
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 100, clientY: 0 })

    const nextSizes = onResize.mock.calls.at(-1)?.[0] as number[] | undefined
    expect(onResize).toHaveBeenCalled()
    expect(nextSizes?.[0]).toBeCloseTo(500, 3)
    expect(nextSizes?.[1]).toBeCloseTo(500, 3)
  })

  test('supports mixed controlled sizes with px numbers and percent strings', () => {
    const screen = render(() => (
      <ResizableFixture
        items={[{ content: 'A', size: 200 }, { content: 'B', size: '30%' }, { content: 'C' }]}
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
      <ResizableFixture
        items={[
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
      <ResizableFixture
        items={[
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
      <ResizableFixture
        items={[
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
      <ResizableFixture
        items={[
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
      <ResizableFixture
        items={[
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

    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 100, clientY: 0 })
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 100, clientY: 0 })

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
      <ResizableFixture
        items={[
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
      <ResizableFixture
        onResize={onResize}
        items={[
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

    fireEvent.keyDown(handle, { key: 'Enter' })

    expect(onResize).not.toHaveBeenCalled()
    expectPanelGrow(panels[0], 30)
    expect(panels[0]?.getAttribute('data-collapsed')).toBeNull()
  })

  test('does not toggle collapsible panels when clicking handle by default', async () => {
    const onResize = vi.fn()

    const screen = render(() => (
      <ResizableFixture
        onResize={onResize}
        items={[
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

    fireEvent.click(handle)

    expect(onResize).not.toHaveBeenCalled()
    expectPanelGrow(panels[0], 30)
    expect(panels[0]?.getAttribute('data-collapsed')).toBeNull()
  })

  test('toggles nearest collapsible panel when clicking handle in collapse mode', async () => {
    const screen = render(() => (
      <ResizableFixture
        action="collapse"
        items={[
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

    fireEvent.click(handle)
    expectPanelGrow(panels[0], 10)
    expect(panels[0]?.getAttribute('data-collapsed')).toBe('')
    expect(panels[0]?.getAttribute('data-transitioning')).toBe('')

    fireEvent.click(handle)
    expectPanelGrow(panels[0], 30)
    expect(panels[0]?.getAttribute('data-collapsed')).toBeNull()
    expect(panels[0]?.getAttribute('data-transitioning')).toBe('')
  })

  test('clears transitioning marker on flex-grow transition end', async () => {
    const screen = render(() => (
      <ResizableFixture
        action="collapse"
        items={[
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

    fireEvent.click(handle)
    expect(panel.getAttribute('data-transitioning')).toBe('')

    fireEvent.transitionEnd(panel, { propertyName: 'flex-grow' })
    expect(panel.getAttribute('data-transitioning')).toBeNull()
  })

  test('keeps handle drag non-resize in collapse mode while divider drag still resizes', async () => {
    const screen = render(() => (
      <ResizableFixture
        action="collapse"
        handle
        items={[
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

    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 100, clientY: 0 })
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 100, clientY: 0 })
    expectPanelGrow(panels[0], 30)
    expectPanelGrow(panels[1], 70)

    fireEvent.pointerDown(divider, { pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 100, clientY: 0 })
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 100, clientY: 0 })
    expectPanelGrow(panels[0], 40)
    expectPanelGrow(panels[1], 60)
  })

  test('uses pointer cursor for handle in collapse mode and keeps divider resize cursor', () => {
    const screen = render(() => (
      <MoraineProvider>
        <ResizableFixture
          action="collapse"
          items={[
            { content: 'Sidebar', defaultSize: '30%', collapsible: true, collapsibleMin: '10%' },
            { content: 'Content', defaultSize: '70%' },
          ]}
        />
      </MoraineProvider>
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

          <ResizableFixture
            onResize={handleResize}
            items={[
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

    fireEvent.click(toggle)
    expectPanelGrow(panels[0], 10)
    expect(panels[0]?.getAttribute('data-collapsed')).toBe('')
    expect(panels[0]?.getAttribute('data-transitioning')).toBe('')

    fireEvent.click(toggle)
    expectPanelGrow(panels[0], 32)
    expect(panels[0]?.getAttribute('data-transitioning')).toBe('')
  })

  test('calls onHandleKeyDown with handle context and keeps keyboard resize behavior', async () => {
    const onHandleKeyDown = vi.fn()

    const screen = render(() => (
      <ResizableFixture
        onHandleKeyDown={onHandleKeyDown}
        items={[
          { content: 'Left', min: '20%', defaultSize: '50%' },
          { content: 'Right', min: '20%', defaultSize: '50%' },
        ]}
      />
    ))

    const handle = screen.container.querySelector('[data-slot="divider"]') as HTMLElement
    const panels = screen.container.querySelectorAll(
      '[data-slot="panel"]',
    ) as NodeListOf<HTMLDivElement>

    fireEvent.keyDown(handle, { key: 'ArrowRight' })

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
      <ResizableFixture
        onHandleKeyDown={({ event }) => {
          if (event.key === 'ArrowRight') {
            event.preventDefault()
          }
        }}
        items={[
          { content: 'Left', min: '20%', size: 500 },
          { content: 'Right', min: '20%', size: 500 },
        ]}
      />
    ))

    const handle = screen.container.querySelector('[data-slot="divider"]') as HTMLElement
    const panels = screen.container.querySelectorAll(
      '[data-slot="panel"]',
    ) as NodeListOf<HTMLDivElement>

    fireEvent.keyDown(handle, { key: 'ArrowRight' })

    expectPanelGrow(panels[0], 50)
    expectPanelGrow(panels[1], 50)
  })

  test('supports dragging when pointer down starts on handle visual area', async () => {
    const screen = render(() => (
      <ResizableFixture handle items={[{ content: 'Left' }, { content: 'Right' }]} />
    ))

    const handleVisual = screen.container.querySelector('[data-slot="handle"]') as HTMLElement
    const panels = screen.container.querySelectorAll(
      '[data-slot="panel"]',
    ) as NodeListOf<HTMLDivElement>

    fireEvent.pointerDown(handleVisual, { pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 100, clientY: 0 })
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 100, clientY: 0 })

    expectPanelGrow(panels[0], 60)
    expectPanelGrow(panels[1], 40)
  })

  test('snaps expanded size to min when releasing a drag from collapsibleMin state', async () => {
    const screen = render(() => {
      const [sizes, setSizes] = createSignal([100, 900])

      return (
        <ResizableFixture
          onResize={(nextSizes) => setSizes(nextSizes)}
          items={[
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

    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 50, clientY: 0 })
    expectPanelGrow(panels[0], 15)

    fireEvent.pointerUp(window, { pointerId: 1, clientX: 50, clientY: 0 })
    expectPanelGrow(panels[0], 20)
  })

  test('marks panel as collapsed when its size equals collapsibleMin', () => {
    const screen = render(() => (
      <ResizableFixture
        items={[
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
      <ResizableFixture
        items={[
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
      <MoraineProvider>
        <ResizableFixture
          action="collapse"
          items={[
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
      </MoraineProvider>
    ))

    const handle = screen.container.querySelector('[data-slot="handle"]') as HTMLElement
    const panel = screen.container.querySelectorAll('[data-slot="panel"]')[0] as HTMLDivElement

    expect(panel.className).toContain('data-transitioning:transition-flex-grow')
    expect(panel.getAttribute('data-transitioning')).toBeNull()

    fireEvent.click(handle)
    expect(panel.getAttribute('data-transitioning')).toBe('')

    fireEvent.transitionEnd(panel, { propertyName: 'flex-grow' })
    expect(panel.getAttribute('data-transitioning')).toBeNull()

    fireEvent.click(handle)
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
          <ResizableFixture
            items={[
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

    fireEvent.click(resizeButton)
    expectPanelGrow(getSidebar(), 30)
    expect(getSidebar().getAttribute('data-transitioning')).toBeNull()
  })

  test('supports nested resizable panels and root-level intersection config', async () => {
    const screen = render(() => (
      <ResizableFixture
        handle
        intersection
        items={[
          { content: 'Outer Left' },
          {
            content: (
              <ResizableFixture
                orientation="vertical"
                handle
                intersection
                items={[{ content: 'Inner Top' }, { content: 'Inner Bottom' }]}
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

    const crossTargets = screen.container.querySelectorAll('[data-slot="crossTarget"]')
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
      <ResizableFixture
        disable
        handle
        intersection
        items={[
          { content: 'Outer Left' },
          {
            content: (
              <ResizableFixture
                orientation="vertical"
                handle
                intersection
                items={[{ content: 'Inner Top' }, { content: 'Inner Bottom' }]}
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

    expect(screen.container.querySelectorAll('[data-slot="crossTarget"]')).toHaveLength(0)
  })

  test('marks all affected handles as active when hovering a cross-target', async () => {
    const screen = render(() => (
      <ResizableFixture
        handle
        intersection
        items={[
          { content: 'Outer Left' },
          {
            content: (
              <ResizableFixture
                orientation="vertical"
                handle
                intersection
                items={[{ content: 'Inner Top' }, { content: 'Inner Bottom' }]}
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

    const crossTarget = innerHandle.querySelector('[data-slot="crossTarget"]') as HTMLElement
    expect(crossTarget).not.toBeNull()
    expect(outerHandle.getAttribute('data-active')).toBeNull()
    expect(innerHandle.getAttribute('data-active')).toBeNull()

    fireEvent.mouseEnter(crossTarget)
    expect(outerHandle.getAttribute('data-active')).toBe('')
    expect(innerHandle.getAttribute('data-active')).toBe('')

    fireEvent.mouseLeave(crossTarget)
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
          <ResizableFixture
            onResize={(nextSizes) => {
              onResize(nextSizes)
              setSizes(nextSizes)
            }}
            items={panels()}
          />
        </div>
      )
    })

    const shrinkButton = screen.container.querySelector('[data-slot="shrink"]') as HTMLButtonElement
    fireEvent.click(shrinkButton)

    const handles = screen.container.querySelectorAll('[data-slot="divider"]')
    expect(handles).toHaveLength(1)

    const handle = handles[0] as HTMLElement
    fireEvent.keyDown(handle, { key: 'ArrowRight' })

    const nextSizes = onResize.mock.calls.at(-1)?.[0] as number[] | undefined
    expect(Array.isArray(nextSizes)).toBe(true)
    expect(nextSizes).toHaveLength(2)
    expect(nextSizes?.[0]).toBeCloseTo(600, 3)
    expect(nextSizes?.[1]).toBeCloseTo(400, 3)
  })

  test('updates data-active and data-dragging through hover and drag states', async () => {
    const screen = render(() => (
      <ResizableFixture items={[{ content: 'Left' }, { content: 'Right' }]} />
    ))

    const handle = screen.container.querySelector('[data-slot="divider"]') as HTMLElement
    const panel = screen.container.querySelector('[data-slot="panel"]') as HTMLDivElement

    expect(handle.getAttribute('data-active')).toBeNull()
    expect(handle.getAttribute('data-dragging')).toBeNull()
    expect(panel.getAttribute('data-resizing')).toBeNull()
    expect(panel.getAttribute('data-transitioning')).toBeNull()

    fireEvent.mouseEnter(handle)
    expect(handle.getAttribute('data-active')).toBe('')

    fireEvent.mouseLeave(handle)
    expect(handle.getAttribute('data-active')).toBeNull()

    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 0, clientY: 0 })
    expect(handle.getAttribute('data-active')).toBe('')
    expect(handle.getAttribute('data-dragging')).toBe('')
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 100, clientY: 0 })
    expect(panel.getAttribute('data-resizing')).toBe('')
    expect(panel.getAttribute('data-transitioning')).toBeNull()

    fireEvent.pointerUp(window, { pointerId: 1, clientX: 0, clientY: 0 })
    expect(handle.getAttribute('data-dragging')).toBeNull()
    expect(panel.getAttribute('data-resizing')).toBeNull()
    expect(panel.getAttribute('data-transitioning')).toBeNull()
  })

  test('locks document text selection while dragging from cross target and restores afterwards', async () => {
    const screen = render(() => (
      <ResizableFixture
        handle
        intersection
        items={[
          { content: 'Outer Left' },
          {
            content: (
              <ResizableFixture
                orientation="vertical"
                handle
                intersection
                items={[{ content: 'Inner Top' }, { content: 'Inner Bottom' }]}
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
    const crossTarget = innerHandle.querySelector('[data-slot="crossTarget"]') as HTMLElement
    fireEvent.pointerDown(crossTarget, { pointerId: 1, clientX: 102, clientY: 80 })
    expect(document.body.style.userSelect).toBe('none')

    fireEvent.pointerMove(window, { pointerId: 1, clientX: 132, clientY: 110 })
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 132, clientY: 110 })
    expect(document.body.style.userSelect).toBe('text')
  })

  test('keeps divider in cross-hovered state through press and release on cross target', async () => {
    const screen = render(() => (
      <ResizableFixture
        handle
        intersection
        items={[
          { content: 'Outer Left' },
          {
            content: (
              <ResizableFixture
                orientation="vertical"
                handle
                intersection
                items={[{ content: 'Inner Top' }, { content: 'Inner Bottom' }]}
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

    const crossTarget = innerHandle.querySelector('[data-slot="crossTarget"]') as HTMLElement

    fireEvent.mouseEnter(crossTarget)
    expect(innerHandle.getAttribute('data-cross')).toBe('')
    expect(outerHandle.getAttribute('data-cross')).toBe('')

    fireEvent.pointerDown(crossTarget, { pointerId: 1, clientX: 102, clientY: 80 })
    expect(innerHandle.getAttribute('data-cross')).toBe('')
    expect(outerHandle.getAttribute('data-cross')).toBe('')

    fireEvent.pointerUp(window, { pointerId: 1, clientX: 102, clientY: 80 })
    expect(innerHandle.getAttribute('data-cross')).toBe('')
    expect(outerHandle.getAttribute('data-cross')).toBe('')

    fireEvent.mouseLeave(crossTarget)
    expect(innerHandle.getAttribute('data-cross')).toBeNull()
    expect(outerHandle.getAttribute('data-cross')).toBeNull()
  })
  describe('mobile robustness', () => {
    test('pointercancel stops drag immediately and emits correct final sizes', async () => {
      const onResize = vi.fn()
      const onResizeEnd = vi.fn()

      const screen = render(() => (
        <ResizableFixture
          onResize={onResize}
          onResizeEnd={onResizeEnd}
          items={[{ content: 'Left' }, { content: 'Right' }]}
        />
      ))

      await waitForLayoutInitialization()

      const handle = screen.container.querySelector('[data-slot="divider"]') as HTMLElement

      // Begin drag and move 100px right
      fireEvent.pointerDown(handle, { pointerId: 1, clientX: 0, clientY: 0 })
      fireEvent.pointerMove(window, { pointerId: 1, clientX: 100, clientY: 0 })

      // Mid-drag size should be ~60% for left panel (moved 100px of 1000px root)
      const sizesDuringDrag = onResize.mock.calls.at(-1)?.[0] as number[] | undefined
      expect(sizesDuringDrag?.[0]).toBeCloseTo(600, 3)

      // Mobile browser cancels the pointer (e.g. scroll gesture takes over)
      fireEvent.pointerCancel(window, { pointerId: 1, clientX: 100, clientY: 0 })

      // onResizeEnd should have been called
      expect(onResizeEnd).toHaveBeenCalledTimes(1)

      // No further resize events after cancel
      const callsBefore = onResize.mock.calls.length

      // Additional pointer moves after cancel should be no-ops
      fireEvent.pointerMove(window, { pointerId: 1, clientX: 300, clientY: 0 })
      expect(onResize.mock.calls.length).toBe(callsBefore)

      // data-dragging should be cleared
      expect(handle.getAttribute('data-dragging')).toBeNull()
    })

    test('incremental moves accumulate correctly across multiple pointermove events', async () => {
      const onResize = vi.fn()

      const screen = render(() => (
        <ResizableFixture onResize={onResize} items={[{ content: 'Left' }, { content: 'Right' }]} />
      ))

      await waitForLayoutInitialization()

      const handle = screen.container.querySelector('[data-slot="divider"]') as HTMLElement

      // Drag in three incremental steps of 50px each (total 150px of 1000px root = 15%)
      fireEvent.pointerDown(handle, { pointerId: 1, clientX: 0, clientY: 0 })
      fireEvent.pointerMove(window, { pointerId: 1, clientX: 50, clientY: 0 })
      fireEvent.pointerMove(window, { pointerId: 1, clientX: 100, clientY: 0 })
      fireEvent.pointerMove(window, { pointerId: 1, clientX: 150, clientY: 0 })
      fireEvent.pointerUp(window, { pointerId: 1, clientX: 150, clientY: 0 })

      // Final size should be 50% + 15% = 65% for the left panel
      const finalSizes = onResize.mock.calls.at(-1)?.[0] as number[] | undefined
      expect(finalSizes?.[0]).toBeCloseTo(650, 3)
      expect(finalSizes?.[1]).toBeCloseTo(350, 3)
    })

    test('absorbs overshoot when moving beyond panel constraints and moving back', async () => {
      const onResize = vi.fn()
      const screen = render(() => (
        <ResizableFixture
          onResize={onResize}
          items={[
            { content: 'Left', size: 300, min: 200 },
            { content: 'Right', size: 700 },
          ]}
        />
      ))

      await waitForLayoutInitialization()

      const handle = screen.container.querySelector('[data-slot="divider"]') as HTMLElement
      fireEvent.pointerDown(handle, { pointerId: 1, clientX: 0, clientY: 0 })

      // Move left by 100px (to x = -100), reaching the min 200px limit
      fireEvent.pointerMove(window, { pointerId: 1, clientX: -100, clientY: 0 })
      let sizes = onResize.mock.calls.at(-1)?.[0] as number[]
      expect(sizes[0]).toBeCloseTo(200, 3)

      // Move further left by 100px (to x = -200, beyond the min limit)
      fireEvent.pointerMove(window, { pointerId: 1, clientX: -200, clientY: 0 })
      sizes = onResize.mock.calls.at(-1)?.[0] as number[]
      expect(sizes[0]).toBeCloseTo(200, 3)

      // Move back right by 50px (to x = -150, still in overshoot region)
      fireEvent.pointerMove(window, { pointerId: 1, clientX: -150, clientY: 0 })
      sizes = onResize.mock.calls.at(-1)?.[0] as number[]
      expect(sizes[0]).toBeCloseTo(200, 3)

      // Move back past boundary to x = -50 (size becomes 250)
      fireEvent.pointerMove(window, { pointerId: 1, clientX: -50, clientY: 0 })
      sizes = onResize.mock.calls.at(-1)?.[0] as number[]
      expect(sizes[0]).toBeCloseTo(250, 3)

      fireEvent.pointerUp(window, { pointerId: 1, clientX: -50, clientY: 0 })
    })
  })

  describe('compound API', () => {
    test('renders explicit panels and independently configured handles', () => {
      const screen = render(() => (
        <Resizable>
          <Resizable.Panel id="first" data-testid="first" class="first-panel">
            First
          </Resizable.Panel>
          <Resizable.Handle children={false} data-testid="plain-divider" />
          <Resizable.Panel>Second</Resizable.Panel>
          <Resizable.Handle action="collapse" data-testid="collapse-divider">
            {(state) => <span data-disabled={state.disabled ? '' : undefined}>Collapse</span>}
          </Resizable.Handle>
          <Resizable.Panel collapsible>Third</Resizable.Panel>
        </Resizable>
      ))

      expect(screen.container.querySelectorAll('[data-slot="panel"]')).toHaveLength(3)
      expect(screen.container.querySelectorAll('[data-slot="divider"]')).toHaveLength(2)
      expect(screen.container.querySelectorAll('[data-slot="handle"]')).toHaveLength(1)
      expect(screen.getByTestId('first').id).toBe('first')
      expect(screen.getByTestId('first').className).toContain('first-panel')
      expect(screen.getByTestId('collapse-divider').getAttribute('data-testid')).toBe(
        'collapse-divider',
      )
      expect(screen.getByText('Collapse')).toBeTruthy()
    })

    test('allows adjacent panels without a handle', () => {
      const screen = render(() => (
        <Resizable>
          <Resizable.Panel>First</Resizable.Panel>
          <Resizable.Panel>Second</Resizable.Panel>
        </Resizable>
      ))

      expect(screen.container.querySelectorAll('[data-slot="panel"]')).toHaveLength(2)
      expect(screen.container.querySelector('[data-slot="divider"]')).toBeNull()
    })

    test('rejects handles that are not between two panels', () => {
      expect(() =>
        render(() => (
          <Resizable>
            <Resizable.Handle />
            <Resizable.Panel>Only panel</Resizable.Panel>
          </Resizable>
        )),
      ).toThrow('Resizable.Handle must be placed between two Resizable.Panel children')
    })

    test('rejects unknown children', () => {
      expect(() =>
        render(() => (
          <Resizable>
            <div>Unknown</div>
          </Resizable>
        )),
      ).toThrow('Resizable only accepts Resizable.Panel and Resizable.Handle children')
    })
  })
})
