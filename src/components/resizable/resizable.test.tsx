import { fireEvent, render } from '@solidjs/testing-library'
import { Show, createSignal } from 'solid-js'
import type { JSX } from 'solid-js'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'

import { Resizable } from './resizable'
import type { ResizableT } from './resizable.types'

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

const defaultRect = createRect({ top: 0, right: 1000, bottom: 600, left: 0 })
const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
    configurable: true,
    value() {
      return defaultRect
    },
  })
})

afterAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
    configurable: true,
    value: originalGetBoundingClientRect,
  })
})

function panelsOf(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('[data-slot="resizable-panel"]'))
}

function handlesOf(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('[data-slot="resizable-handle"]'))
}

function panelBasis(panel: HTMLElement | null | undefined): number {
  return Number.parseFloat(panel?.style.flexBasis ?? '0')
}

function expectPanelBasis(panel: HTMLElement | null | undefined, percent: number): void {
  expect(panelBasis(panel)).toBeCloseTo(percent, 3)
}

async function waitForLayout(): Promise<void> {
  await new Promise<void>((resolve) => queueMicrotask(resolve))
}

interface TwoPanelProps {
  value?: ResizableT.Layout
  defaultValue?: ResizableT.Layout
  onValueChange?: (layout: ResizableT.Layout) => void
  onValueCommit?: (layout: ResizableT.Layout) => void
  keyboardDelta?: number
  disabled?: boolean
  orientation?: 'horizontal' | 'vertical'
  a?: Partial<ResizableT.PanelBase>
  b?: Partial<ResizableT.PanelBase>
  handle?: Partial<ResizableT.HandleBase>
}

function TwoPanels(props: TwoPanelProps): JSX.Element {
  return (
    <Resizable
      value={props.value}
      defaultValue={props.defaultValue}
      onValueChange={props.onValueChange}
      onValueCommit={props.onValueCommit}
      keyboardDelta={props.keyboardDelta}
      disabled={props.disabled}
      orientation={props.orientation}
    >
      <Resizable.Panel id="a" {...props.a}>
        A
      </Resizable.Panel>
      <Resizable.Handle {...props.handle} />
      <Resizable.Panel id="b" {...props.b}>
        B
      </Resizable.Panel>
    </Resizable>
  )
}

/** Each panel reports `size` pixels on the main axis so drag math is deterministic. */
function setPanelSizes(container: HTMLElement, sizePx: number): void {
  const rect = createRect({ top: 0, right: sizePx, bottom: sizePx, left: 0 })
  for (const panel of panelsOf(container)) {
    setRect(panel, rect)
  }
}

function dragHandle(
  handle: HTMLElement,
  from: { x: number; y: number },
  to: { x: number; y: number },
  options: { altKey?: boolean; pointerId?: number } = {},
): void {
  const pointerId = options.pointerId ?? 1
  fireEvent.pointerDown(handle, {
    pointerId,
    button: 0,
    clientX: from.x,
    clientY: from.y,
    altKey: options.altKey ?? false,
  })
  fireEvent.pointerMove(handle, {
    pointerId,
    clientX: to.x,
    clientY: to.y,
    altKey: options.altKey ?? false,
  })
  fireEvent.pointerUp(handle, { pointerId, clientX: to.x, clientY: to.y })
}

function innerHandleOf(container: HTMLElement): HTMLElement {
  return handlesOf(container)[1]!
}

/** Two nested groups whose outer vertical bar and inner horizontal bar cross at (100, 80). */
async function renderNestedGroups() {
  const screen = render(() => (
    <Resizable>
      <Resizable.Panel id="outer-a">Outer Left</Resizable.Panel>
      <Resizable.Handle intersection />
      <Resizable.Panel id="outer-b">
        <Resizable orientation="vertical">
          <Resizable.Panel id="inner-a">Inner Top</Resizable.Panel>
          <Resizable.Handle intersection />
          <Resizable.Panel id="inner-b">Inner Bottom</Resizable.Panel>
        </Resizable>
      </Resizable.Panel>
    </Resizable>
  ))
  const [outerHandle, innerHandle] = handlesOf(screen.container)
  setRect(outerHandle!, createRect({ top: 0, right: 101, bottom: 200, left: 100 }))
  setRect(innerHandle!, createRect({ top: 80, right: 220, bottom: 81, left: 101 }))
  setRect(
    screen.container.querySelector<HTMLElement>('#outer-a')!,
    createRect({ top: 0, right: 100, bottom: 600, left: 0 }),
  )
  setRect(
    screen.container.querySelector<HTMLElement>('#inner-a')!,
    createRect({ top: 0, right: 900, bottom: 80, left: 100 }),
  )
  setRect(
    screen.container.querySelector<HTMLElement>('#outer-b')!,
    createRect({ top: 0, right: 1000, bottom: 600, left: 101 }),
  )
  setRect(
    screen.container.querySelector<HTMLElement>('#inner-b')!,
    createRect({ top: 81, right: 900, bottom: 600, left: 100 }),
  )

  const { refreshSplitterIntersections } = await import('../shared/splitter/manager')
  refreshSplitterIntersections()
  await Promise.resolve()
  return screen
}

describe('Resizable', () => {
  test('renders panels sized by defaultValue record and fills missing entries', () => {
    const screen = render(() => (
      <Resizable defaultValue={{ a: 30 }}>
        <Resizable.Panel id="a">A</Resizable.Panel>
        <Resizable.Handle />
        <Resizable.Panel id="b">B</Resizable.Panel>
        <Resizable.Handle />
        <Resizable.Panel id="c">C</Resizable.Panel>
      </Resizable>
    ))

    const [a, b, c] = panelsOf(screen.container)
    expectPanelBasis(a, 30)
    // Missing entries share the remaining 70% equally.
    expectPanelBasis(b, 35)
    expectPanelBasis(c, 35)
    expect(handlesOf(screen.container)).toHaveLength(2)
  })

  test('panels keep sizes keyed by id when a middle panel is inserted', async () => {
    const [showB, setShowB] = createSignal(false)
    const screen = render(() => (
      <Resizable defaultValue={{ a: 50, c: 50 }}>
        <Resizable.Panel id="a">A</Resizable.Panel>
        <Resizable.Handle />
        <Show when={showB()}>
          <Resizable.Panel id="b">B</Resizable.Panel>
        </Show>
        <Resizable.Handle />
        <Resizable.Panel id="c">C</Resizable.Panel>
      </Resizable>
    ))

    setShowB(true)
    await waitForLayout()

    const panels = panelsOf(screen.container)
    expect(panels.map((panel) => panel.id)).toEqual(['a', 'b', 'c'])
    // 'b' has no entry and there is no remainder left, so it starts at
    // 100 / panelCount and the whole record normalizes back to sum 100.
    expectPanelBasis(panels[0], 37.5)
    expectPanelBasis(panels[1], 25)
    expectPanelBasis(panels[2], 37.5)
  })

  test('does not fire collapse callbacks when a same-id panel remounts', async () => {
    const onCollapse = vi.fn()
    const onExpand = vi.fn()
    const [showB, setShowB] = createSignal(true)
    const [layout, setLayout] = createSignal({ a: 100, b: 0 })
    render(() => (
      <Resizable value={layout()}>
        <Resizable.Panel id="a">A</Resizable.Panel>
        <Resizable.Handle />
        <Show when={showB()}>
          <Resizable.Panel id="b" min={20} collapsible onCollapse={onCollapse} onExpand={onExpand}>
            B
          </Resizable.Panel>
        </Show>
      </Resizable>
    ))
    await waitForLayout()
    expect(onCollapse).not.toHaveBeenCalled()
    expect(onExpand).not.toHaveBeenCalled()

    setShowB(false)
    setLayout({ a: 50, b: 50 })
    await waitForLayout()

    setShowB(true)
    await waitForLayout()

    // The remounted panel reports its fresh collapsed state, not a transition
    // from the stale entry left by the previous registration.
    expect(onCollapse).not.toHaveBeenCalled()
    expect(onExpand).not.toHaveBeenCalled()
  })

  test('drag updates layout live, emits change per move and one commit on release', () => {
    const onValueChange = vi.fn()
    const onValueCommit = vi.fn()
    const screen = render(() => (
      <TwoPanels
        defaultValue={{ a: 50, b: 50 }}
        onValueChange={onValueChange}
        onValueCommit={onValueCommit}
      />
    ))
    setPanelSizes(screen.container, 500)

    const [handle] = handlesOf(screen.container)
    const [a, b] = panelsOf(screen.container)

    // panel space = 2 * 500px => 100px drag = 10%
    dragHandle(handle!, { x: 500, y: 0 }, { x: 400, y: 0 })

    expectPanelBasis(a, 40)
    expectPanelBasis(b, 60)
    expect(onValueChange).toHaveBeenLastCalledWith({ a: 40, b: 60 })
    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueCommit).toHaveBeenCalledTimes(1)
    expect(onValueCommit).toHaveBeenLastCalledWith({ a: 40, b: 60 })
  })

  test('does not emit commit when a drag ends without changing the layout', () => {
    const onValueChange = vi.fn()
    const onValueCommit = vi.fn()
    const screen = render(() => (
      <TwoPanels
        defaultValue={{ a: 50, b: 50 }}
        onValueChange={onValueChange}
        onValueCommit={onValueCommit}
      />
    ))
    setPanelSizes(screen.container, 500)

    const [handle] = handlesOf(screen.container)
    fireEvent.pointerDown(handle!, { pointerId: 1, button: 0, clientX: 500, clientY: 0 })
    fireEvent.pointerUp(handle!, { pointerId: 1, clientX: 500, clientY: 0 })

    expect(onValueChange).not.toHaveBeenCalled()
    expect(onValueCommit).not.toHaveBeenCalled()
  })

  test('controlled value emits but layout follows the prop', () => {
    const onValueChange = vi.fn()
    const screen = render(() => (
      <TwoPanels value={{ a: 50, b: 50 }} onValueChange={onValueChange} />
    ))
    setPanelSizes(screen.container, 500)

    const [handle] = handlesOf(screen.container)
    const [a, b] = panelsOf(screen.container)
    dragHandle(handle!, { x: 500, y: 0 }, { x: 400, y: 0 })

    expect(onValueChange).toHaveBeenCalledWith({ a: 40, b: 60 })
    // Layout still driven by the controlled record.
    expectPanelBasis(a, 50)
    expectPanelBasis(b, 50)
  })

  test('collapses a panel live once the drag passes the midpoint and expands past it again', () => {
    const onCollapse = vi.fn()
    const onExpand = vi.fn()
    const screen = render(() => (
      <TwoPanels
        defaultValue={{ a: 50, b: 50 }}
        a={{ min: 20, collapsible: true, onCollapse, onExpand }}
      />
    ))
    setPanelSizes(screen.container, 500)

    const [handle] = handlesOf(screen.container)
    const [a, b] = panelsOf(screen.container)

    // midpoint between min 20 and collapsedSize 0 is 10
    fireEvent.pointerDown(handle!, { pointerId: 1, button: 0, clientX: 500, clientY: 0 })

    // -300px of 1000px space => candidate a=20 -> at min, not collapsed
    fireEvent.pointerMove(handle!, { pointerId: 1, clientX: 200, clientY: 0 })
    expectPanelBasis(a, 20)
    expect(a!.hasAttribute('data-collapsed')).toBe(false)
    expect(onCollapse).not.toHaveBeenCalled()

    // -430px => candidate a=7 < 10 -> collapses to 0
    fireEvent.pointerMove(handle!, { pointerId: 1, clientX: 70, clientY: 0 })
    expectPanelBasis(a, 0)
    expectPanelBasis(b, 100)
    expect(a!.hasAttribute('data-collapsed')).toBe(true)
    expect(onCollapse).toHaveBeenCalledTimes(1)

    // back to -380px => candidate a=12 > 10 -> expands to min
    fireEvent.pointerMove(handle!, { pointerId: 1, clientX: 120, clientY: 0 })
    expectPanelBasis(a, 20)
    expect(onExpand).toHaveBeenCalledTimes(1)

    fireEvent.pointerUp(handle!, { pointerId: 1, clientX: 120, clientY: 0 })
  })

  test('Resizable.usePanel collapses, expands, and resizes with change + commit emissions', () => {
    const onValueChange = vi.fn()
    const onValueCommit = vi.fn()
    let api: ResizableT.PanelContext | undefined

    function PanelContent(): JSX.Element {
      api = Resizable.usePanel()
      return <div>content</div>
    }

    const screen = render(() => (
      <Resizable
        defaultValue={{ a: 50, b: 50 }}
        onValueChange={onValueChange}
        onValueCommit={onValueCommit}
      >
        <Resizable.Panel id="a" collapsible collapsedSize={10} min={20}>
          <PanelContent />
        </Resizable.Panel>
        <Resizable.Handle />
        <Resizable.Panel id="b">B</Resizable.Panel>
      </Resizable>
    ))

    const [a, b] = panelsOf(screen.container)

    api!.collapse()
    expectPanelBasis(a, 10)
    expect(api!.collapsed()).toBe(true)
    expect(onValueChange).toHaveBeenLastCalledWith({ a: 10, b: 90 })
    expect(onValueCommit).toHaveBeenLastCalledWith({ a: 10, b: 90 })
    expect(a!.hasAttribute('data-transitioning')).toBe(true)

    api!.expand()
    // expand() restores the last expanded size (50), recorded before the collapse
    expectPanelBasis(a, 50)
    expect(api!.collapsed()).toBe(false)
    expect(onValueCommit).toHaveBeenLastCalledWith({ a: 50, b: 50 })

    api!.resize(45)
    expectPanelBasis(a, 45)
    expectPanelBasis(b, 55)
    expect(onValueChange).toHaveBeenLastCalledWith({ a: 45, b: 55 })
    expect(onValueCommit).toHaveBeenLastCalledWith({ a: 45, b: 55 })
    expect(api!.id).toBe('a')
    expect(api!.size()).toBeCloseTo(45, 3)
  })

  test('Resizable.usePanel throws outside a panel', () => {
    function Outside(): JSX.Element {
      Resizable.usePanel()
      return null
    }

    expect(() => render(() => <Outside />)).toThrow()
  })

  test('rtl reverses arrow keys and drag direction', () => {
    const screen = render(() => (
      <div dir="rtl">
        <TwoPanels defaultValue={{ a: 50, b: 50 }} />
      </div>
    ))
    setPanelSizes(screen.container, 500)
    const [handle] = handlesOf(screen.container)
    const [a, b] = panelsOf(screen.container)

    fireEvent.keyDown(handle!, { key: 'ArrowRight' })
    expectPanelBasis(a, 40)
    expectPanelBasis(b, 60)

    fireEvent.keyDown(handle!, { key: 'ArrowLeft' })
    expectPanelBasis(a, 50)

    // The preceding panel is on the right, so dragging left grows it.
    dragHandle(handle!, { x: 500, y: 0 }, { x: 400, y: 0 })
    expectPanelBasis(a, 60)
    expectPanelBasis(b, 40)
  })

  test('arrow keys step the split, Shift+arrow jumps further, Home and End reach the limits', () => {
    const onValueCommit = vi.fn()
    const screen = render(() => (
      <TwoPanels defaultValue={{ a: 50, b: 50 }} onValueCommit={onValueCommit} />
    ))
    const [handle] = handlesOf(screen.container)
    const [a, b] = panelsOf(screen.container)

    fireEvent.keyDown(handle!, { key: 'ArrowLeft' })
    expectPanelBasis(a, 40)
    expectPanelBasis(b, 60)

    fireEvent.keyDown(handle!, { key: 'ArrowRight' })
    expectPanelBasis(a, 50)

    fireEvent.keyDown(handle!, { key: 'ArrowRight', shiftKey: true })
    expectPanelBasis(a, 100)
    expectPanelBasis(b, 0)

    fireEvent.keyDown(handle!, { key: 'Home' })
    expectPanelBasis(a, 0)
    expectPanelBasis(b, 100)

    fireEvent.keyDown(handle!, { key: 'End' })
    expectPanelBasis(a, 100)
    expectPanelBasis(b, 0)

    expect(onValueCommit).toHaveBeenCalledTimes(5)
  })

  test('Enter toggles the nearest collapsible neighbor and Space does not', () => {
    const onCollapse = vi.fn()
    const onExpand = vi.fn()
    const screen = render(() => (
      <TwoPanels
        defaultValue={{ a: 50, b: 50 }}
        a={{ collapsible: true, min: 20, collapsedSize: 10, onCollapse, onExpand }}
      />
    ))
    const [handle] = handlesOf(screen.container)
    const [a, b] = panelsOf(screen.container)

    fireEvent.keyDown(handle!, { key: ' ' })
    expectPanelBasis(a, 50)
    expect(onCollapse).not.toHaveBeenCalled()

    fireEvent.keyDown(handle!, { key: 'Enter' })
    expectPanelBasis(a, 10)
    expectPanelBasis(b, 90)
    expect(onCollapse).toHaveBeenCalledTimes(1)
    expect(a!.hasAttribute('data-collapsed')).toBe(true)
    expect(a!.hasAttribute('data-transitioning')).toBe(true)

    fireEvent.transitionEnd(a!, { propertyName: 'flex-basis' })
    expect(a!.hasAttribute('data-transitioning')).toBe(false)

    fireEvent.keyDown(handle!, { key: 'Enter' })
    // toggling back restores the last expanded size
    expectPanelBasis(a, 50)
    expect(onExpand).toHaveBeenCalledTimes(1)
  })

  test('handle ARIA reflects the preceding panel as a 0-100 value', () => {
    const screen = render(() => (
      <TwoPanels
        defaultValue={{ a: 50, b: 50 }}
        a={{ min: 20, max: 80, collapsible: true, collapsedSize: 10 }}
      />
    ))
    const [handle] = handlesOf(screen.container)

    expect(handle!.getAttribute('role')).toBe('separator')
    expect(handle!.getAttribute('aria-controls')).toBe('a')
    expect(handle!.getAttribute('aria-valuenow')).toBe('50')
    expect(handle!.getAttribute('aria-valuemin')).toBe('10')
    expect(handle!.getAttribute('aria-valuemax')).toBe('80')
    expect(handle!.getAttribute('aria-orientation')).toBe('vertical')
  })

  test('nested roots still intersect and a cross drag moves both handles', async () => {
    const screen = await renderNestedGroups()
    const crossTarget = innerHandleOf(screen.container).querySelector<HTMLElement>(
      '[data-slot="resizable-intersection"]',
    )!

    // Drag from the cross target on the inner handle: both axes resize.
    fireEvent.pointerDown(crossTarget, { pointerId: 1, button: 0, clientX: 101, clientY: 81 })
    // pointerdown captures on the handle element; moves dispatch on window.
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 81, clientY: 101 })
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 81, clientY: 101 })

    // outer-a shrank from 50% (20px of ~999px outer space), inner-a grew
    expect(panelBasis(screen.container.querySelector<HTMLElement>('#outer-a'))).toBeLessThan(50)
    expect(panelBasis(screen.container.querySelector<HTMLElement>('#inner-a'))).toBeGreaterThan(50)
  })

  test('pressing the handle body near a crossed edge drags both axes', async () => {
    const screen = await renderNestedGroups()

    fireEvent.pointerDown(innerHandleOf(screen.container), {
      pointerId: 1,
      button: 0,
      clientX: 102,
      clientY: 80,
    })
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 132, clientY: 110 })
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 132, clientY: 110 })

    expect(panelBasis(screen.container.querySelector<HTMLElement>('#outer-a'))).toBeGreaterThan(50)
    expect(panelBasis(screen.container.querySelector<HTMLElement>('#inner-a'))).toBeGreaterThan(50)
  })

  test('handles of unrelated sibling groups do not link where they cross', async () => {
    const screen = render(() => (
      <>
        <Resizable>
          <Resizable.Panel id="left-a">Left A</Resizable.Panel>
          <Resizable.Handle intersection />
          <Resizable.Panel id="left-b">Left B</Resizable.Panel>
        </Resizable>
        <Resizable orientation="vertical">
          <Resizable.Panel id="right-a">Right A</Resizable.Panel>
          <Resizable.Handle intersection />
          <Resizable.Panel id="right-b">Right B</Resizable.Panel>
        </Resizable>
      </>
    ))
    setPanelSizes(screen.container, 500)
    const [leftHandle, rightHandle] = handlesOf(screen.container)
    // The vertical group's horizontal bar crosses the horizontal group's vertical bar.
    setRect(leftHandle!, createRect({ top: 0, right: 101, bottom: 200, left: 100 }))
    setRect(rightHandle!, createRect({ top: 80, right: 220, bottom: 81, left: 101 }))

    const { refreshSplitterIntersections } = await import('../shared/splitter/manager')
    refreshSplitterIntersections()
    await Promise.resolve()

    expect(screen.container.querySelectorAll('[data-slot="resizable-intersection"]')).toHaveLength(
      0,
    )

    fireEvent.pointerDown(rightHandle!, { pointerId: 1, button: 0, clientX: 150, clientY: 81 })
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 150, clientY: 101 })
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 150, clientY: 101 })

    expectPanelBasis(screen.container.querySelector<HTMLElement>('#left-a'), 50)
    expectPanelBasis(screen.container.querySelector<HTMLElement>('#left-b'), 50)
    expect(panelBasis(screen.container.querySelector<HTMLElement>('#right-a'))).toBeGreaterThan(50)
  })

  test('toggling Alt mid-drag still commits the final layout once', () => {
    const onValueCommit = vi.fn()
    const screen = render(() => (
      <Resizable defaultValue={{ a: 50, b: 50 }} onValueCommit={onValueCommit}>
        <Resizable.Panel id="a">A</Resizable.Panel>
        <Resizable.Handle />
        <Resizable.Panel id="b">B</Resizable.Panel>
      </Resizable>
    ))
    setPanelSizes(screen.container, 500)

    const [handle] = handlesOf(screen.container)
    const [a] = panelsOf(screen.container)

    fireEvent.pointerDown(handle!, { pointerId: 1, button: 0, clientX: 500, clientY: 0 })
    fireEvent.pointerMove(handle!, { pointerId: 1, clientX: 450, clientY: 0 })
    fireEvent.pointerMove(handle!, {
      pointerId: 1,
      clientX: 400,
      clientY: 0,
      altKey: true,
    })
    fireEvent.pointerUp(handle!, { pointerId: 1, clientX: 400, clientY: 0, altKey: true })

    expect(onValueCommit).toHaveBeenCalledTimes(1)
    const committed = onValueCommit.mock.calls[0]![0] as Record<string, number>
    expect(committed.a).toBeCloseTo(Number.parseFloat(a!.style.flexBasis), 4)
  })

  test('alt+drag distributes the delta symmetrically', () => {
    const screen = render(() => (
      <Resizable defaultValue={{ a: 30, b: 40, c: 30 }}>
        <Resizable.Panel id="a">A</Resizable.Panel>
        <Resizable.Handle />
        <Resizable.Panel id="b">B</Resizable.Panel>
        <Resizable.Handle />
        <Resizable.Panel id="c">C</Resizable.Panel>
      </Resizable>
    ))
    setPanelSizes(screen.container, 400)

    const [first] = handlesOf(screen.container)
    const [a, b, c] = panelsOf(screen.container)

    // handle between a and b; alt-drag -120px of 1200px space = -10%
    dragHandle(first!, { x: 400, y: 0 }, { x: 280, y: 0 }, { altKey: true })

    // symmetric: the 10% delta is taken equally from the outer panels and
    // redistributed to the center panel
    expectPanelBasis(a, 20)
    expectPanelBasis(b, 60)
    expectPanelBasis(c, 20)
  })

  test('a handle without a panel on either side renders disabled', () => {
    const screen = render(() => (
      <Resizable>
        <Resizable.Panel id="a">A</Resizable.Panel>
        <Resizable.Handle />
      </Resizable>
    ))

    const [handle] = handlesOf(screen.container)
    expect(handle!.getAttribute('aria-disabled')).toBe('true')
    expect(handle!.getAttribute('tabIndex')).toBe('-1')
  })

  test('root disabled locks all handles', () => {
    const onValueChange = vi.fn()
    const screen = render(() => (
      <TwoPanels disabled defaultValue={{ a: 50, b: 50 }} onValueChange={onValueChange} />
    ))
    const [handle] = handlesOf(screen.container)

    expect(handle!.getAttribute('aria-disabled')).toBe('true')
    fireEvent.keyDown(handle!, { key: 'ArrowLeft' })
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('marks the handle active on hover and dragging during a drag', () => {
    const screen = render(() => <TwoPanels defaultValue={{ a: 50, b: 50 }} />)
    setPanelSizes(screen.container, 500)
    const [handle] = handlesOf(screen.container)

    fireEvent.mouseEnter(handle!)
    expect(handle!.hasAttribute('data-active')).toBe(true)
    fireEvent.mouseLeave(handle!)
    expect(handle!.hasAttribute('data-active')).toBe(false)

    fireEvent.pointerDown(handle!, { pointerId: 1, button: 0, clientX: 500, clientY: 0 })
    fireEvent.pointerMove(handle!, { pointerId: 1, clientX: 400, clientY: 0 })
    expect(handle!.hasAttribute('data-dragging')).toBe(true)
    expect(handle!.hasAttribute('data-active')).toBe(true)
    fireEvent.pointerUp(handle!, { pointerId: 1, clientX: 400, clientY: 0 })
    expect(handle!.hasAttribute('data-dragging')).toBe(false)
  })

  test('pointercancel stops a drag and keeps the last emitted layout', () => {
    const onValueChange = vi.fn()
    const onValueCommit = vi.fn()
    const screen = render(() => (
      <TwoPanels
        defaultValue={{ a: 50, b: 50 }}
        onValueChange={onValueChange}
        onValueCommit={onValueCommit}
      />
    ))
    setPanelSizes(screen.container, 500)

    const [handle] = handlesOf(screen.container)
    fireEvent.pointerDown(handle!, { pointerId: 1, button: 0, clientX: 500, clientY: 0 })
    fireEvent.pointerMove(handle!, { pointerId: 1, clientX: 400, clientY: 0 })
    fireEvent.pointerCancel(handle!, { pointerId: 1, clientX: 400, clientY: 0 })
    fireEvent.pointerMove(handle!, { pointerId: 1, clientX: 300, clientY: 0 })

    const [a] = panelsOf(screen.container)
    expectPanelBasis(a, 40)
    expect(onValueChange).toHaveBeenLastCalledWith({ a: 40, b: 60 })
    expect(onValueCommit).toHaveBeenCalledTimes(1)
  })

  test('passes drag state to a render-prop handle and hides the grip with children={false}', () => {
    const screen = render(() => (
      <Resizable>
        <Resizable.Panel id="a">A</Resizable.Panel>
        <Resizable.Handle>
          {(state) => <span data-testid="grip-label">{state.dragging ? 'drag' : 'idle'}</span>}
        </Resizable.Handle>
        <Resizable.Panel id="b">B</Resizable.Panel>
        <Resizable.Handle children={false} />
        <Resizable.Panel id="c">C</Resizable.Panel>
      </Resizable>
    ))

    expect(screen.getByTestId('grip-label').textContent).toBe('idle')
    const grips = screen.container.querySelectorAll('[data-slot="resizable-grip"]')
    expect(grips).toHaveLength(1)
  })

  test('non-resizable neighbors disable the handle', () => {
    const screen = render(() => (
      <TwoPanels defaultValue={{ a: 50, b: 50 }} b={{ resizable: false }} />
    ))
    const [handle] = handlesOf(screen.container)
    expect(handle!.getAttribute('aria-disabled')).toBe('true')
    expect(handle!.getAttribute('tabIndex')).toBe('-1')
  })
})
