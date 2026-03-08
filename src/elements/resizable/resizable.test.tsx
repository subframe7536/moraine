import { fireEvent, render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { createStore } from 'solid-js/store'
import { describe, expect, test, vi } from 'vitest'

import { Resizable } from './resizable'

if (!(globalThis as Record<string, unknown>).ResizeObserver) {
  ;(globalThis as Record<string, unknown>).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
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
    expect(handle?.className).toContain('cursor-row-resize')
  })

  test('allows disabling an auto handle via panel config', () => {
    const screen = render(() => (
      <Resizable
        panels={[{ content: 'One', disableHandle: true }, { content: 'Two' }, { content: 'Three' }]}
      />
    ))

    const handles = screen.container.querySelectorAll('[data-slot="divider"]')
    expect(handles).toHaveLength(1)
  })

  test('applies class overrides and supports per-panel handle options', () => {
    const screen = render(() => (
      <Resizable
        renderHandle={<span data-slot="custom-handle-icon" class="i-lucide-grip-vertical" />}
        classes={{
          root: 'root-override',
          panel: 'panel-override',
          divider: 'divider-override',
          handle: 'handle-override',
        }}
        panels={[
          { content: 'A', class: 'panel-a' },
          {
            content: 'B',
            disableHandle: true,
          },
          { content: 'C' },
        ]}
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
    expect(handles).toHaveLength(1)
    expect(handleInners).toHaveLength(1)
    expect(handleInners[0]?.className).toContain('handle-override')
    expect(customHandleIcons).toHaveLength(1)
  })

  test('emits onSizesChange from keyboard resizing in controlled mode', async () => {
    const onSizesChange = vi.fn()

    const screen = render(() => (
      <Resizable
        onSizesChange={onSizesChange}
        panels={[
          { content: 'Left', minSize: 0.2, size: 0.5 },
          { content: 'Right', minSize: 0.2, size: 0.5 },
        ]}
      />
    ))

    const handle = screen.container.querySelector('[data-slot="divider"]') as HTMLElement
    await fireEvent.keyDown(handle, { key: 'ArrowRight' })

    expect(onSizesChange).toHaveBeenCalled()

    const nextSizes = onSizesChange.mock.calls.at(-1)?.[0] as number[] | undefined
    expect(Array.isArray(nextSizes)).toBe(true)
    expect((nextSizes?.[0] ?? 0) > 0.5).toBe(true)
    expect((nextSizes?.[1] ?? 1) < 0.5).toBe(true)
  })

  test('updates controlled panel sizes from pointer dragging', async () => {
    const onSizesChange = vi.fn()

    const screen = render(() => {
      const [sizes, setSizes] = createSignal([0.4, 0.6])
      const handleSizesChange = (nextSizes: number[]) => {
        onSizesChange(nextSizes)
        setSizes(nextSizes)
      }

      return (
        <Resizable
          onSizesChange={handleSizesChange}
          panels={[
            { content: 'Logs', minSize: 0.2, size: sizes()[0] },
            { content: 'Preview', minSize: 0.25, size: sizes()[1] },
          ]}
        />
      )
    })

    const panel = screen.container.querySelector('[data-slot="panel"]') as HTMLElement
    const handle = screen.container.querySelector('[data-slot="divider"]') as HTMLElement
    const before = Number.parseFloat(panel.style.flexBasis)

    await fireEvent.pointerDown(handle, { pointerId: 1, clientX: 0, clientY: 0 })
    await fireEvent.pointerMove(window, { pointerId: 1, clientX: 40, clientY: 0 })
    await fireEvent.pointerUp(window, { pointerId: 1, clientX: 40, clientY: 0 })
    await Promise.resolve()
    await Promise.resolve()

    const nextSizes = onSizesChange.mock.calls.at(-1)?.[0] as number[] | undefined
    const nextPanel = screen.container.querySelector('[data-slot="panel"]') as HTMLElement
    const after = Number.parseFloat(nextPanel.style.flexBasis)
    expect(onSizesChange).toHaveBeenCalled()
    expect(Array.isArray(nextSizes)).toBe(true)
    expect((nextSizes?.[0] ?? 0) > 0.4).toBe(true)
    expect(Number.isFinite(before)).toBe(true)
    expect(Number.isFinite(after)).toBe(true)
    expect(after).not.toBe(before)
  })

  test('supports controlled dragging when onSizesChange mutates existing panel list', async () => {
    const onSizesChange = vi.fn()

    const screen = render(() => {
      const [panels, setPanels] = createStore([
        { content: 'Logs', minSize: 0.2, size: 0.35 },
        { content: 'Preview', minSize: 0.25, size: 0.65 },
      ])

      return (
        <Resizable
          onSizesChange={(nextSizes) => {
            onSizesChange(nextSizes)
            nextSizes.forEach((nextSize, index) => {
              if (typeof nextSize === 'number' && Number.isFinite(nextSize)) {
                setPanels(index, 'size', nextSize)
              }
            })
          }}
          panels={panels}
        />
      )
    })

    const handle = screen.container.querySelector('[data-slot="divider"]') as HTMLElement
    await fireEvent.pointerDown(handle, { pointerId: 1, clientX: 0, clientY: 0 })
    await fireEvent.pointerMove(window, { pointerId: 1, clientX: 20, clientY: 0 })
    await fireEvent.pointerMove(window, { pointerId: 1, clientX: 40, clientY: 0 })
    await fireEvent.pointerUp(window, { pointerId: 1, clientX: 40, clientY: 0 })

    expect(onSizesChange.mock.calls.length).toBeGreaterThanOrEqual(2)
  })

  test('supports mixed controlled panel sizes', () => {
    const screen = render(() => (
      <Resizable
        panels={[{ content: 'Left', size: 0.2 }, { content: 'Center' }, { content: 'Right' }]}
      />
    ))

    const panels = Array.from(
      screen.container.querySelectorAll('[data-slot="panel"]'),
    ) as HTMLElement[]
    expect(panels).toHaveLength(3)
    expect(panels[0]?.style.flexBasis).toBe('20%')
    expect(panels[1]?.style.flexBasis).toBe('40%')
    expect(panels[2]?.style.flexBasis).toBe('40%')
  })

  test('preserves resize behavior when toggling between controlled and uncontrolled mode', async () => {
    const onSizesChange = vi.fn()

    const TestHarness = () => {
      const [controlled, setControlled] = createSignal(true)
      const [sizes, setSizes] = createSignal([0.7, 0.3])
      const panels = () => [
        { content: 'Left', minSize: 0.2, size: controlled() ? sizes()[0] : undefined },
        { content: 'Right', minSize: 0.2, size: controlled() ? sizes()[1] : undefined },
      ]

      return (
        <div>
          <button
            type="button"
            data-slot="toggle-control"
            onClick={() => setControlled((prev) => !prev)}
          >
            Toggle Control
          </button>
          <Resizable
            onSizesChange={(nextSizes) => {
              onSizesChange(nextSizes)
              setSizes(nextSizes)
            }}
            panels={panels()}
          />
        </div>
      )
    }

    const screen = render(() => <TestHarness />)

    const toggleButton = screen.container.querySelector(
      '[data-slot="toggle-control"]',
    ) as HTMLButtonElement
    const handle = screen.container.querySelector('[data-slot="divider"]') as HTMLElement
    const panel = screen.container.querySelector('[data-slot="panel"]') as HTMLElement

    expect(panel.style.flexBasis).toBe('70%')

    await fireEvent.keyDown(handle, { key: 'ArrowRight' })
    const controlledNextSizes = onSizesChange.mock.calls.at(-1)?.[0] as number[] | undefined
    expect(Array.isArray(controlledNextSizes)).toBe(true)
    expect((controlledNextSizes?.[0] ?? 0) > 0.7).toBe(true)

    await fireEvent.click(toggleButton)
    const basisAfterToggle = Number.parseFloat(panel.style.flexBasis)
    expect(Number.isFinite(basisAfterToggle)).toBe(true)
    expect(basisAfterToggle > 0 && basisAfterToggle < 100).toBe(true)

    await fireEvent.keyDown(handle, { key: 'ArrowLeft' })
    const uncontrolledNextSizes = onSizesChange.mock.calls.at(-1)?.[0] as number[] | undefined
    expect(Array.isArray(uncontrolledNextSizes)).toBe(true)
    expect(uncontrolledNextSizes).toHaveLength(2)
    expect(((uncontrolledNextSizes?.[0] ?? 0) + (uncontrolledNextSizes?.[1] ?? 0)).toFixed(6)).toBe(
      '1.000000',
    )

    await fireEvent.click(toggleButton)
    const controlledPanel = screen.container.querySelector('[data-slot="panel"]') as HTMLElement
    expect(Number.parseFloat(controlledPanel.style.flexBasis)).toBeCloseTo(
      (uncontrolledNextSizes?.[0] ?? 0) * 100,
      4,
    )
  })

  test('toggles nearest collapsible panel by Enter key', async () => {
    const onCollapse = vi.fn()
    const onExpand = vi.fn()

    const screen = render(() => (
      <Resizable
        panels={[
          {
            content: 'Left',
            collapsible: true,
            minSize: 0.2,
            collapsedSize: 0,
            onCollapse,
            onExpand,
          },
          { content: 'Right', minSize: 0.2 },
        ]}
      />
    ))

    const handle = screen.container.querySelector('[data-slot="divider"]') as HTMLElement
    const panel = screen.container.querySelector('[data-slot="panel"]')

    await fireEvent.keyDown(handle, { key: 'Enter' })

    expect(panel?.getAttribute('data-collapsed')).toBe('')
    expect(onCollapse).toHaveBeenCalled()

    await fireEvent.keyDown(handle, { key: 'Enter' })

    expect(panel?.getAttribute('data-collapsed')).toBeNull()
    expect(onExpand).toHaveBeenCalled()
  })

  test('fires handle drag callbacks', async () => {
    const onHandleDrag = vi.fn()
    const onHandleDragEnd = vi.fn()

    const screen = render(() => (
      <Resizable
        onHandleDrag={onHandleDrag}
        onHandleDragEnd={onHandleDragEnd}
        panels={[{ content: 'Left' }, { content: 'Right' }]}
      />
    ))

    const handle = screen.container.querySelector('[data-slot="divider"]') as HTMLElement

    await fireEvent.pointerDown(handle, { pointerId: 1, clientX: 0, clientY: 0 })
    await fireEvent.pointerMove(window, { pointerId: 1, clientX: 40, clientY: 0, altKey: true })
    await fireEvent.pointerUp(window, { pointerId: 1, clientX: 40, clientY: 0 })

    expect(onHandleDrag).toHaveBeenCalled()
    expect(onHandleDragEnd).toHaveBeenCalled()
  })

  test('supports nested resizable panels', async () => {
    const screen = render(() => (
      <Resizable
        panels={[
          { content: 'Outer Left' },
          {
            content: (
              <Resizable
                orientation="vertical"
                panels={[{ content: 'Inner Top' }, { content: 'Inner Bottom' }]}
              />
            ),
          },
        ]}
      />
    ))

    const roots = screen.container.querySelectorAll('[data-slot="root"]')
    const handles = screen.container.querySelectorAll('[data-slot="divider"]')

    expect(roots).toHaveLength(2)
    expect(handles).toHaveLength(2)
    const [outerHandle, innerHandle] = Array.from(handles) as HTMLButtonElement[]

    Object.defineProperty(outerHandle, 'getBoundingClientRect', {
      value: () => createRect({ top: 0, right: 101, bottom: 200, left: 100 }),
      configurable: true,
    })
    Object.defineProperty(innerHandle, 'getBoundingClientRect', {
      value: () => createRect({ top: 80, right: 220, bottom: 81, left: 101 }),
      configurable: true,
    })

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

  test('marks all affected handles as active when hovering cross-target', async () => {
    const screen = render(() => (
      <Resizable
        panels={[
          { content: 'Outer Left' },
          {
            content: (
              <Resizable
                orientation="vertical"
                panels={[{ content: 'Inner Top' }, { content: 'Inner Bottom' }]}
              />
            ),
          },
        ]}
      />
    ))

    const handles = screen.container.querySelectorAll('[data-slot="divider"]')
    const [outerHandle, innerHandle] = Array.from(handles) as HTMLButtonElement[]

    Object.defineProperty(outerHandle, 'getBoundingClientRect', {
      value: () => createRect({ top: 0, right: 101, bottom: 200, left: 100 }),
      configurable: true,
    })
    Object.defineProperty(innerHandle, 'getBoundingClientRect', {
      value: () => createRect({ top: 80, right: 220, bottom: 81, left: 101 }),
      configurable: true,
    })

    const { refreshResizableHandleIntersections } = await import('./hook/manager')
    refreshResizableHandleIntersections()
    await Promise.resolve()

    const crossTarget = innerHandle.querySelector('[data-slot="cross-target"]') as HTMLElement
    expect(crossTarget).toBeTruthy()
    expect(
      crossTarget.hasAttribute('data-resizable-handle-start-target') ||
        crossTarget.hasAttribute('data-resizable-handle-end-target'),
    ).toBe(true)
    expect(outerHandle.getAttribute('data-active')).toBeNull()
    expect(innerHandle.getAttribute('data-active')).toBeNull()

    await fireEvent.mouseEnter(crossTarget)
    expect(outerHandle.getAttribute('data-active')).toBe('')
    expect(innerHandle.getAttribute('data-active')).toBe('')

    await fireEvent.mouseLeave(crossTarget)
    expect(outerHandle.getAttribute('data-active')).toBeNull()
    expect(innerHandle.getAttribute('data-active')).toBeNull()
  })

  test('keeps handle index reactive after panels list changes', async () => {
    const onSizesChange = vi.fn()

    const screen = render(() => {
      const [panelMetas, setPanelMetas] = createSignal([
        { content: 'One', minSize: 0.2 },
        { content: 'Two', minSize: 0.2 },
        { content: 'Three', minSize: 0.2 },
      ])
      const [sizes, setSizes] = createSignal([0.34, 0.33, 0.33])
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
              setSizes([0.5, 0.5])
            }}
          >
            Shrink
          </button>
          <Resizable
            onSizesChange={(nextSizes) => {
              onSizesChange(nextSizes)
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

    const nextSizes = onSizesChange.mock.calls.at(-1)?.[0] as number[] | undefined
    expect(Array.isArray(nextSizes)).toBe(true)
    expect(nextSizes).toHaveLength(2)
    expect((nextSizes?.[0] ?? 0) > 0.5).toBe(true)
    expect((nextSizes?.[1] ?? 1) < 0.5).toBe(true)
  })

  test('updates data-active and data-dragging through hover and drag states', async () => {
    const screen = render(() => <Resizable panels={[{ content: 'Left' }, { content: 'Right' }]} />)

    const handle = screen.container.querySelector('[data-slot="divider"]') as HTMLElement

    expect(handle.getAttribute('data-active')).toBeNull()
    expect(handle.getAttribute('data-dragging')).toBeNull()

    await fireEvent.mouseEnter(handle)
    expect(handle.getAttribute('data-active')).toBe('')

    await fireEvent.mouseLeave(handle)
    expect(handle.getAttribute('data-active')).toBeNull()

    await fireEvent.pointerDown(handle, { pointerId: 1, clientX: 0, clientY: 0 })
    expect(handle.getAttribute('data-active')).toBe('')
    expect(handle.getAttribute('data-dragging')).toBe('')

    await fireEvent.pointerUp(window, { pointerId: 1, clientX: 0, clientY: 0 })
    expect(handle.getAttribute('data-dragging')).toBeNull()
  })
})
