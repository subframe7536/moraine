import { beforeEach, describe, expect, test, vi } from 'vitest'

import type { ResizableHandleRegistration, ResizableOrientation } from './manager'

interface RectInput {
  top: number
  right: number
  bottom: number
  left: number
}

interface DragCall {
  deltaPx: number
  altKey: boolean
}

interface TestHandle {
  registration: ResizableHandleRegistration
  element: HTMLButtonElement
  rectSpy: ReturnType<typeof vi.fn>
  draggingEvents: boolean[]
  dragCalls: DragCall[]
  getDragEndCount: () => number
  getStartIntersection: () => ResizableHandleRegistration | null
  getEndIntersection: () => ResizableHandleRegistration | null
}

function createRect(input: RectInput): DOMRect {
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

function createTestHandle(input: {
  orientation: ResizableOrientation
  rootElement: HTMLDivElement
  rect: RectInput
  altKeyMode?: boolean | 'only'
}): TestHandle {
  const element = document.createElement('button')
  input.rootElement.appendChild(element)

  const rectSpy = vi.fn(() => createRect(input.rect))
  Object.defineProperty(element, 'getBoundingClientRect', {
    value: rectSpy,
    configurable: true,
  })

  let startIntersection: ResizableHandleRegistration | null = null
  let endIntersection: ResizableHandleRegistration | null = null
  const draggingEvents: boolean[] = []
  const dragCalls: DragCall[] = []
  let dragEndCount = 0

  const registration: ResizableHandleRegistration = {
    id: Symbol('resizable-handle-test'),
    getElement: () => element,
    getRootElement: () => input.rootElement,
    getOrientation: () => input.orientation,
    getAltKeyMode: () => input.altKeyMode ?? true,
    getStartIntersectionEnabled: () => true,
    getEndIntersectionEnabled: () => true,
    getStartIntersection: () => startIntersection,
    getEndIntersection: () => endIntersection,
    setStartIntersection: (handle) => {
      startIntersection = handle
    },
    setEndIntersection: (handle) => {
      endIntersection = handle
    },
    setDragging: (dragging) => {
      draggingEvents.push(dragging)
    },
    setCrossHovered: () => {},
    onDrag: (deltaPx, altKey) => {
      dragCalls.push({ deltaPx, altKey })
    },
    onDragEnd: () => {
      dragEndCount += 1
    },
  }

  return {
    registration,
    element,
    rectSpy,
    draggingEvents,
    dragCalls,
    getDragEndCount: () => dragEndCount,
    getStartIntersection: () => startIntersection,
    getEndIntersection: () => endIntersection,
  }
}

function createPointerEvent(type: string, init: MouseEventInit): PointerEvent {
  const EventCtor = (globalThis.PointerEvent ?? MouseEvent) as typeof PointerEvent
  return new EventCtor(type, init) as PointerEvent
}

function createRootElement(): HTMLDivElement {
  const element = document.createElement('div')
  element.setAttribute('data-slot', 'root')
  element.setAttribute('data-resizable-root', '')
  return element
}

describe('handle-manager', () => {
  beforeEach(() => {
    vi.resetModules()
    document.body.innerHTML = ''
    document.head.innerHTML = ''
  })

  test('does not assign intersections across different resizable roots', async () => {
    const { refreshResizableHandleIntersections, registerResizableHandle } =
      await import('./manager')

    const rootA = createRootElement()
    const rootB = createRootElement()
    document.body.append(rootA, rootB)

    const horizontal = createTestHandle({
      orientation: 'horizontal',
      rootElement: rootA,
      rect: { top: 10, right: 120, bottom: 11, left: 0 },
    })
    const vertical = createTestHandle({
      orientation: 'vertical',
      rootElement: rootB,
      rect: { top: 0, right: 61, bottom: 120, left: 60 },
    })

    const unregisterHorizontal = registerResizableHandle(horizontal.registration)
    const unregisterVertical = registerResizableHandle(vertical.registration)

    refreshResizableHandleIntersections()

    expect(horizontal.getStartIntersection()).toBeNull()
    expect(horizontal.getEndIntersection()).toBeNull()
    expect(vertical.getStartIntersection()).toBeNull()
    expect(vertical.getEndIntersection()).toBeNull()

    unregisterHorizontal()
    unregisterVertical()
  })

  test('dedupes scheduled refresh calls within the same tick', async () => {
    const { registerResizableHandle, scheduleResizableHandleIntersectionsRefresh } =
      await import('./manager')

    const root = createRootElement()
    document.body.append(root)

    const horizontal = createTestHandle({
      orientation: 'horizontal',
      rootElement: root,
      rect: { top: 10, right: 120, bottom: 11, left: 0 },
    })
    const vertical = createTestHandle({
      orientation: 'vertical',
      rootElement: root,
      rect: { top: 0, right: 61, bottom: 120, left: 60 },
    })

    const unregisterHorizontal = registerResizableHandle(horizontal.registration)
    const unregisterVertical = registerResizableHandle(vertical.registration)

    await Promise.resolve()
    horizontal.rectSpy.mockClear()
    vertical.rectSpy.mockClear()

    scheduleResizableHandleIntersectionsRefresh()
    scheduleResizableHandleIntersectionsRefresh()
    scheduleResizableHandleIntersectionsRefresh()

    await Promise.resolve()

    expect(horizontal.rectSpy).toHaveBeenCalledTimes(1)
    expect(vertical.rectSpy).toHaveBeenCalledTimes(1)

    unregisterHorizontal()
    unregisterVertical()
  })

  test('keeps intersection results stable with many handles in one root', async () => {
    const { refreshResizableHandleIntersections, registerResizableHandle } =
      await import('./manager')

    const root = createRootElement()
    const isolatedRoot = createRootElement()
    document.body.append(root, isolatedRoot)

    const horizontals: TestHandle[] = []
    const verticals: TestHandle[] = []
    const unregisterList: Array<() => void> = []
    const pairCount = 12

    for (let index = 0; index < pairCount; index += 1) {
      const left = index * 100
      const right = left + 40
      const top = index * 100 + 100

      const horizontal = createTestHandle({
        orientation: 'horizontal',
        rootElement: root,
        rect: { top, right, bottom: top + 1, left },
      })
      const vertical = createTestHandle({
        orientation: 'vertical',
        rootElement: root,
        rect: { top: top - 40, right: right + 1, bottom: top, left: right },
      })

      horizontals.push(horizontal)
      verticals.push(vertical)
      unregisterList.push(registerResizableHandle(horizontal.registration))
      unregisterList.push(registerResizableHandle(vertical.registration))
    }

    const isolated = createTestHandle({
      orientation: 'vertical',
      rootElement: isolatedRoot,
      rect: { top: 60, right: 141, bottom: 100, left: 140 },
    })
    unregisterList.push(registerResizableHandle(isolated.registration))

    refreshResizableHandleIntersections()

    for (let index = 0; index < pairCount; index += 1) {
      const horizontal = horizontals[index]
      const vertical = verticals[index]

      expect(horizontal?.getStartIntersection()).toBe(vertical?.registration)
      expect(horizontal?.getEndIntersection()).toBeNull()
      expect(vertical?.getStartIntersection()).toBe(horizontal?.registration)
      expect(vertical?.getEndIntersection()).toBeNull()
    }

    expect(isolated.getStartIntersection()).toBeNull()
    expect(isolated.getEndIntersection()).toBeNull()

    for (const unregister of unregisterList) {
      unregister()
    }
  })

  test('allows intersections across parent-child roots while keeping unrelated roots isolated', async () => {
    const { refreshResizableHandleIntersections, registerResizableHandle } =
      await import('./manager')

    const parentRoot = createRootElement()
    const childRoot = createRootElement()
    const isolatedRoot = createRootElement()
    parentRoot.appendChild(childRoot)
    document.body.append(parentRoot, isolatedRoot)

    const outerHorizontal = createTestHandle({
      orientation: 'horizontal',
      rootElement: parentRoot,
      rect: { top: 0, right: 101, bottom: 200, left: 100 },
    })
    const innerVertical = createTestHandle({
      orientation: 'vertical',
      rootElement: childRoot,
      rect: { top: 80, right: 220, bottom: 81, left: 101 },
    })
    const isolatedVertical = createTestHandle({
      orientation: 'vertical',
      rootElement: isolatedRoot,
      rect: { top: 80, right: 220, bottom: 81, left: 101 },
    })

    const unregisterOuter = registerResizableHandle(outerHorizontal.registration)
    const unregisterInner = registerResizableHandle(innerVertical.registration)
    const unregisterIsolated = registerResizableHandle(isolatedVertical.registration)

    refreshResizableHandleIntersections()

    expect(innerVertical.getStartIntersection()).toBe(outerHorizontal.registration)
    expect(innerVertical.getEndIntersection()).toBeNull()
    expect(isolatedVertical.getStartIntersection()).toBeNull()
    expect(isolatedVertical.getEndIntersection()).toBeNull()

    unregisterOuter()
    unregisterInner()
    unregisterIsolated()
  })

  test('drags both crossed handles with independent altKey rules without forcing global cross cursor', async () => {
    const {
      RESIZABLE_HANDLE_TARGET_START,
      refreshResizableHandleIntersections,
      registerResizableHandle,
      startResizableHandleDrag,
    } = await import('./manager')

    const parentRoot = createRootElement()
    const childRoot = createRootElement()
    parentRoot.appendChild(childRoot)
    document.body.append(parentRoot)

    const outerHorizontal = createTestHandle({
      orientation: 'horizontal',
      rootElement: parentRoot,
      rect: { top: 0, right: 101, bottom: 200, left: 100 },
      altKeyMode: 'only',
    })
    const innerVertical = createTestHandle({
      orientation: 'vertical',
      rootElement: childRoot,
      rect: { top: 80, right: 220, bottom: 81, left: 101 },
      altKeyMode: false,
    })

    const unregisterOuter = registerResizableHandle(outerHorizontal.registration)
    const unregisterInner = registerResizableHandle(innerVertical.registration)

    refreshResizableHandleIntersections()

    expect(innerVertical.getStartIntersection()).toBe(outerHorizontal.registration)

    startResizableHandleDrag(
      innerVertical.registration,
      createPointerEvent('pointerdown', { clientX: 10, clientY: 20 }),
      RESIZABLE_HANDLE_TARGET_START,
    )

    window.dispatchEvent(
      createPointerEvent('pointermove', { clientX: 40, clientY: 70, altKey: false }),
    )

    expect(innerVertical.dragCalls.at(-1)).toEqual({ deltaPx: 50, altKey: false })
    expect(outerHorizontal.dragCalls.at(-1)).toEqual({ deltaPx: 30, altKey: true })

    window.dispatchEvent(createPointerEvent('pointerup', { clientX: 40, clientY: 70 }))

    expect(innerVertical.draggingEvents.slice(0, 2)).toEqual([true, false])
    expect(outerHorizontal.draggingEvents.slice(0, 2)).toEqual([true, false])
    expect(innerVertical.getDragEndCount()).toBe(1)
    expect(outerHorizontal.getDragEndCount()).toBe(1)

    unregisterOuter()
    unregisterInner()
  })

  test('falls back to dual-axis when pressing handle body near crossed edge', async () => {
    const {
      RESIZABLE_HANDLE_TARGET_HANDLE,
      refreshResizableHandleIntersections,
      registerResizableHandle,
      startResizableHandleDrag,
    } = await import('./manager')

    const parentRoot = createRootElement()
    const childRoot = createRootElement()
    parentRoot.appendChild(childRoot)
    document.body.append(parentRoot)

    const outerHorizontal = createTestHandle({
      orientation: 'horizontal',
      rootElement: parentRoot,
      rect: { top: 0, right: 101, bottom: 200, left: 100 },
    })
    const innerVertical = createTestHandle({
      orientation: 'vertical',
      rootElement: childRoot,
      rect: { top: 80, right: 220, bottom: 81, left: 101 },
    })

    const unregisterOuter = registerResizableHandle(outerHorizontal.registration)
    const unregisterInner = registerResizableHandle(innerVertical.registration)

    refreshResizableHandleIntersections()

    startResizableHandleDrag(
      innerVertical.registration,
      createPointerEvent('pointerdown', { clientX: 102, clientY: 80 }),
      RESIZABLE_HANDLE_TARGET_HANDLE,
    )

    window.dispatchEvent(createPointerEvent('pointermove', { clientX: 132, clientY: 110 }))

    expect(innerVertical.dragCalls.at(-1)?.deltaPx).toBe(30)
    expect(outerHorizontal.dragCalls.at(-1)?.deltaPx).toBe(30)

    window.dispatchEvent(createPointerEvent('pointerup', { clientX: 132, clientY: 110 }))

    unregisterOuter()
    unregisterInner()
  })

  test('keeps drag target resolution consistent for handle/start/end intersections', async () => {
    const {
      RESIZABLE_HANDLE_TARGET_END,
      RESIZABLE_HANDLE_TARGET_HANDLE,
      RESIZABLE_HANDLE_TARGET_START,
      refreshResizableHandleIntersections,
      registerResizableHandle,
      startResizableHandleDrag,
    } = await import('./manager')

    const root = createRootElement()
    document.body.append(root)

    const baseVertical = createTestHandle({
      orientation: 'vertical',
      rootElement: root,
      rect: { top: 20, right: 120, bottom: 220, left: 100 },
    })
    const startHorizontal = createTestHandle({
      orientation: 'horizontal',
      rootElement: root,
      rect: { top: 80, right: 100, bottom: 81, left: 60 },
    })
    const endHorizontal = createTestHandle({
      orientation: 'horizontal',
      rootElement: root,
      rect: { top: 160, right: 160, bottom: 161, left: 120 },
    })

    const unregisterBase = registerResizableHandle(baseVertical.registration)
    const unregisterStart = registerResizableHandle(startHorizontal.registration)
    const unregisterEnd = registerResizableHandle(endHorizontal.registration)

    refreshResizableHandleIntersections()

    expect(baseVertical.getStartIntersection()).toBe(startHorizontal.registration)
    expect(baseVertical.getEndIntersection()).toBe(endHorizontal.registration)

    const runDrag = (target: 0 | 1 | 2, pointerDownX: number) => {
      baseVertical.dragCalls.length = 0
      startHorizontal.dragCalls.length = 0
      endHorizontal.dragCalls.length = 0

      startResizableHandleDrag(
        baseVertical.registration,
        createPointerEvent('pointerdown', { clientX: pointerDownX, clientY: 90 }),
        target,
      )

      window.dispatchEvent(
        createPointerEvent('pointermove', { clientX: pointerDownX + 30, clientY: 130 }),
      )
      window.dispatchEvent(
        createPointerEvent('pointerup', { clientX: pointerDownX + 30, clientY: 130 }),
      )

      return {
        base: baseVertical.dragCalls.at(-1),
        start: startHorizontal.dragCalls.at(-1),
        end: endHorizontal.dragCalls.at(-1),
      }
    }

    const explicitStart = runDrag(RESIZABLE_HANDLE_TARGET_START, 110)
    const inferredStart = runDrag(RESIZABLE_HANDLE_TARGET_HANDLE, 101)
    const explicitEnd = runDrag(RESIZABLE_HANDLE_TARGET_END, 110)
    const inferredEnd = runDrag(RESIZABLE_HANDLE_TARGET_HANDLE, 119)

    expect(explicitStart).toEqual({
      base: { deltaPx: 40, altKey: false },
      start: { deltaPx: 30, altKey: false },
      end: undefined,
    })
    expect(inferredStart).toEqual(explicitStart)
    expect(explicitEnd).toEqual({
      base: { deltaPx: 40, altKey: false },
      start: undefined,
      end: { deltaPx: 30, altKey: false },
    })
    expect(inferredEnd).toEqual(explicitEnd)

    unregisterBase()
    unregisterStart()
    unregisterEnd()
  })
})
