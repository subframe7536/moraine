import { beforeEach, describe, expect, test, vi } from 'vitest'

import type {
  SplitterHandleRegistration,
  SplitterIntersectionTarget,
  SplitterOrientation,
} from './manager'

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
  registration: SplitterHandleRegistration
  element: HTMLButtonElement
  draggingEvents: boolean[]
  dragCalls: DragCall[]
  getDragEndCount: () => number
  getStartIntersection: () => SplitterHandleRegistration | null
  getEndIntersection: () => SplitterHandleRegistration | null
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
  }
}

function createTestHandle(input: {
  orientation: SplitterOrientation
  rootElement: HTMLDivElement
  rect: RectInput
}): TestHandle {
  const element = input.rootElement.ownerDocument.createElement('button')
  input.rootElement.appendChild(element)

  Object.defineProperty(element, 'getBoundingClientRect', {
    value: () => createRect(input.rect),
    configurable: true,
  })

  let startIntersection: SplitterHandleRegistration | null = null
  let endIntersection: SplitterHandleRegistration | null = null
  const draggingEvents: boolean[] = []
  const dragCalls: DragCall[] = []
  let dragEndCount = 0

  const registration: SplitterHandleRegistration = {
    id: Symbol('splitter-handle-test'),
    getElement: () => element,
    getRootElement: () => input.rootElement,
    getOrientation: () => input.orientation,
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
    draggingEvents,
    dragCalls,
    getDragEndCount: () => dragEndCount,
    getStartIntersection: () => startIntersection,
    getEndIntersection: () => endIntersection,
  }
}

function createPointerEvent(type: string, init: MouseEventInit): PointerEvent {
  const EventCtor = globalThis.PointerEvent ?? MouseEvent
  return new EventCtor(type, init)
}

function createRootElement(ownerDocument = document): HTMLDivElement {
  const element = ownerDocument.createElement('div')
  element.setAttribute('data-slot', 'root')
  element.setAttribute('data-splitter-root', '')
  return element
}

describe('splitter-manager', () => {
  beforeEach(() => {
    vi.resetModules()
    document.body.innerHTML = ''
    document.head.innerHTML = ''
  })

  test('keeps intersection results stable with many handles in one root', async () => {
    const { refreshSplitterIntersections, registerSplitterHandle } = await import('./manager')

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
      unregisterList.push(registerSplitterHandle(horizontal.registration))
      unregisterList.push(registerSplitterHandle(vertical.registration))
    }

    const isolated = createTestHandle({
      orientation: 'vertical',
      rootElement: isolatedRoot,
      rect: { top: 60, right: 141, bottom: 100, left: 140 },
    })
    unregisterList.push(registerSplitterHandle(isolated.registration))

    refreshSplitterIntersections()

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

  test('drags both crossed handles and passes the event altKey to each', async () => {
    const { refreshSplitterIntersections, registerSplitterHandle, startSplitterDrag } =
      await import('./manager')

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

    const unregisterOuter = registerSplitterHandle(outerHorizontal.registration)
    const unregisterInner = registerSplitterHandle(innerVertical.registration)

    refreshSplitterIntersections()

    expect(innerVertical.getStartIntersection()).toBe(outerHorizontal.registration)

    startSplitterDrag(
      innerVertical.registration,
      createPointerEvent('pointerdown', { clientX: 10, clientY: 20 }),
      'start',
    )

    window.dispatchEvent(
      createPointerEvent('pointermove', { clientX: 40, clientY: 70, altKey: false }),
    )

    expect(innerVertical.dragCalls.at(-1)).toEqual({ deltaPx: 50, altKey: false })
    expect(outerHorizontal.dragCalls.at(-1)).toEqual({ deltaPx: 30, altKey: false })

    window.dispatchEvent(
      createPointerEvent('pointermove', { clientX: 60, clientY: 90, altKey: true }),
    )

    expect(innerVertical.dragCalls.at(-1)).toEqual({ deltaPx: 20, altKey: true })
    expect(outerHorizontal.dragCalls.at(-1)).toEqual({ deltaPx: 20, altKey: true })

    window.dispatchEvent(createPointerEvent('pointerup', { clientX: 60, clientY: 90 }))

    expect(innerVertical.draggingEvents.slice(0, 2)).toEqual([true, false])
    expect(outerHorizontal.draggingEvents.slice(0, 2)).toEqual([true, false])
    expect(innerVertical.getDragEndCount()).toBe(1)
    expect(outerHorizontal.getDragEndCount()).toBe(1)

    unregisterOuter()
    unregisterInner()
  })

  test('keeps drag target resolution consistent for handle/start/end intersections', async () => {
    const { refreshSplitterIntersections, registerSplitterHandle, startSplitterDrag } =
      await import('./manager')

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

    const unregisterBase = registerSplitterHandle(baseVertical.registration)
    const unregisterStart = registerSplitterHandle(startHorizontal.registration)
    const unregisterEnd = registerSplitterHandle(endHorizontal.registration)

    refreshSplitterIntersections()

    expect(baseVertical.getStartIntersection()).toBe(startHorizontal.registration)
    expect(baseVertical.getEndIntersection()).toBe(endHorizontal.registration)

    const runDrag = (target: SplitterIntersectionTarget, pointerDownX: number) => {
      baseVertical.dragCalls.length = 0
      startHorizontal.dragCalls.length = 0
      endHorizontal.dragCalls.length = 0

      startSplitterDrag(
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

    const explicitStart = runDrag('start', 110)
    const inferredStart = runDrag('handle', 101)
    const explicitEnd = runDrag('end', 110)
    const inferredEnd = runDrag('handle', 119)

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

  test('keeps drag listeners, selection locks, and handles scoped to each owner document', async () => {
    const { registerSplitterHandle, startSplitterDrag } = await import('./manager')
    const iframe = document.createElement('iframe')
    const hostRoot = createRootElement()
    document.body.append(hostRoot, iframe)
    const iframeDocument = iframe.contentDocument
    const iframeWindow = iframe.contentWindow

    if (!iframeDocument || !iframeWindow) {
      throw new TypeError('Expected iframe owner document and window')
    }

    const iframeRoot = createRootElement(iframeDocument)
    iframeDocument.body.append(iframeRoot)
    const hostHandle = createTestHandle({
      orientation: 'horizontal',
      rootElement: hostRoot,
      rect: { top: 0, right: 100, bottom: 1, left: 0 },
    })
    const iframeHandle = createTestHandle({
      orientation: 'horizontal',
      rootElement: iframeRoot,
      rect: { top: 0, right: 100, bottom: 1, left: 0 },
    })
    const unregisterHost = registerSplitterHandle(hostHandle.registration)
    let unregisterIframe: (() => void) | undefined = registerSplitterHandle(
      iframeHandle.registration,
    )
    const iframeGlobal = iframeWindow as Window & typeof globalThis
    const FramePointerEvent = iframeGlobal.PointerEvent ?? iframeGlobal.MouseEvent
    const createIframePointerEvent = (type: string, init: MouseEventInit) =>
      new FramePointerEvent(type, init)

    try {
      document.body.style.userSelect = 'text'
      iframeDocument.body.style.userSelect = 'all'

      startSplitterDrag(
        iframeHandle.registration,
        createIframePointerEvent('pointerdown', { clientX: 0, clientY: 0 }),
        'handle',
      )

      expect(iframeDocument.body.style.userSelect).toBe('none')
      expect(document.body.style.userSelect).toBe('text')
      expect(iframeHandle.draggingEvents).toEqual([true])

      iframeWindow.dispatchEvent(
        createIframePointerEvent('pointermove', { clientX: 30, clientY: 0 }),
      )
      window.dispatchEvent(createPointerEvent('pointermove', { clientX: 30, clientY: 0 }))

      expect(iframeHandle.dragCalls).toEqual([{ deltaPx: 30, altKey: false }])
      expect(hostHandle.dragCalls).toEqual([])

      startSplitterDrag(
        hostHandle.registration,
        createPointerEvent('pointerdown', { clientX: 0, clientY: 0 }),
        'handle',
      )

      expect(document.body.style.userSelect).toBe('none')
      expect(iframeHandle.draggingEvents).toEqual([true])
      expect(hostHandle.draggingEvents).toEqual([true])

      window.dispatchEvent(createPointerEvent('pointermove', { clientX: 20, clientY: 0 }))
      unregisterIframe()
      unregisterIframe = undefined
      iframeWindow.dispatchEvent(
        createIframePointerEvent('pointermove', { clientX: 60, clientY: 0 }),
      )

      expect(hostHandle.dragCalls).toEqual([{ deltaPx: 20, altKey: false }])
      expect(iframeHandle.draggingEvents).toEqual([true, false])
      expect(iframeHandle.dragCalls).toEqual([{ deltaPx: 30, altKey: false }])
      expect(iframeDocument.body.style.userSelect).toBe('all')
      expect(document.body.style.userSelect).toBe('none')

      window.dispatchEvent(createPointerEvent('contextmenu', { clientX: 20, clientY: 0 }))

      expect(hostHandle.draggingEvents).toEqual([true, false])
      expect(document.body.style.userSelect).toBe('text')
    } finally {
      unregisterHost()
      unregisterIframe?.()
      iframe.remove()
    }
  })
})
