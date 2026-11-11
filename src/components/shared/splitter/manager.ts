import { attachEventListenerMap } from '../../../shared/event-listener'

export const SPLITTER_ROOT_ATTRIBUTE = 'splitter-root'
export const SPLITTER_START_TARGET_ATTRIBUTE = 'splitter-start-target'
export const SPLITTER_END_TARGET_ATTRIBUTE = 'splitter-end-target'

export const SPLITTER_ROOT_SELECTOR = `[data-${SPLITTER_ROOT_ATTRIBUTE}]`
export const SPLITTER_TARGET_SELECTOR = `[data-${SPLITTER_START_TARGET_ATTRIBUTE}], [data-${SPLITTER_END_TARGET_ATTRIBUTE}]`

export type SplitterOrientation = 'horizontal' | 'vertical'
export type SplitterIntersectionTarget = 'handle' | 'start' | 'end'
export type SplitterIntersectionEdge = 'start' | 'end'

const INTERSECTION_TOLERANCE = 4
const INTERSECTION_EDGE_THRESHOLD = 10

export interface SplitterHandleRegistration {
  id: symbol
  getElement: () => HTMLElement | undefined
  getRootElement: () => HTMLElement | undefined
  getOrientation: () => SplitterOrientation
  getStartIntersectionEnabled: () => boolean
  getEndIntersectionEnabled: () => boolean
  getStartIntersection: () => SplitterHandleRegistration | null
  getEndIntersection: () => SplitterHandleRegistration | null
  setStartIntersection: (handle: SplitterHandleRegistration | null) => void
  setEndIntersection: (handle: SplitterHandleRegistration | null) => void
  setDragging: (dragging: boolean) => void
  setCrossHovered: (hovered: boolean) => void
  onDrag: (deltaPx: number, altKey: boolean) => void
  onDragEnd: (event: PointerEvent | TouchEvent | MouseEvent) => void
}

interface RegisteredHandleEntry {
  handle: SplitterHandleRegistration
  rootElement: HTMLElement | undefined
}

interface DragHandleSnapshot {
  handle: SplitterHandleRegistration
  orientation: SplitterOrientation
}

interface DragSession {
  ownerDocument: Document
  handles: DragHandleSnapshot[]
  startX: number
  startY: number
  lastX: number
  lastY: number
  captureElement?: HTMLElement | null
  selectionSnapshot?: { userSelect: string; webkitUserSelect: string }
  cleanup: () => void
}

interface HandleSnapshot {
  handle: SplitterHandleRegistration
  orientation: SplitterOrientation
  rect: DOMRect
}

/**
 * Single-instance manager state for all registered splitter handles.
 * This is intentionally module-scoped so intersection and drag coordination
 * work across related roots in one document while sessions stay isolated by owner document.
 *
 * Tests should isolate this module state via module reset (e.g. `vi.resetModules()`).
 */
const registeredHandles = new Map<symbol, RegisteredHandleEntry>()
const dragSessions = new Map<Document, DragSession>()
let intersectionsRefreshScheduled = false
const crossHoverRefCount = new Map<symbol, number>()

function equalsWithTolerance(a: number, b: number): boolean {
  return Math.abs(a - b) <= INTERSECTION_TOLERANCE
}

function setHandleCrossHovered(handle: SplitterHandleRegistration, hovered: boolean): void {
  const currentCount = crossHoverRefCount.get(handle.id) ?? 0
  const nextCount = hovered ? currentCount + 1 : Math.max(0, currentCount - 1)

  if (nextCount === 0) {
    crossHoverRefCount.delete(handle.id)
  } else {
    crossHoverRefCount.set(handle.id, nextCount)
  }

  handle.setCrossHovered(nextCount > 0)
}

function lockDocumentTextSelection(session: DragSession): void {
  if (session.selectionSnapshot) {
    return
  }

  const body = session.ownerDocument.body
  if (!body) {
    return
  }

  const style = body.style as CSSStyleDeclaration & { webkitUserSelect: string }
  session.selectionSnapshot = {
    userSelect: style.userSelect,
    webkitUserSelect: style.webkitUserSelect,
  }

  style.userSelect = 'none'
  style.webkitUserSelect = 'none'
}

function unlockDocumentTextSelection(session: DragSession): void {
  if (!session.selectionSnapshot) {
    return
  }

  const body = session.ownerDocument.body
  if (!body) {
    session.selectionSnapshot = undefined
    return
  }

  const style = body.style as CSSStyleDeclaration & { webkitUserSelect: string }
  style.userSelect = session.selectionSnapshot.userSelect
  style.webkitUserSelect = session.selectionSnapshot.webkitUserSelect
  session.selectionSnapshot = undefined
}

function runScheduledIntersectionsRefresh(): void {
  intersectionsRefreshScheduled = false
  refreshSplitterIntersections()
}

export function scheduleSplitterIntersectionsRefresh(): void {
  if (intersectionsRefreshScheduled) {
    return
  }

  intersectionsRefreshScheduled = true
  queueMicrotask(runScheduledIntersectionsRefresh)
}

function clearDragSession(
  ownerDocument: Document,
  event: PointerEvent | TouchEvent | MouseEvent,
): void {
  const current = dragSessions.get(ownerDocument)
  if (!current) {
    return
  }

  dragSessions.delete(ownerDocument)
  unlockDocumentTextSelection(current)

  for (const dragHandle of current.handles) {
    dragHandle.handle.setDragging(false)
    dragHandle.handle.onDragEnd(event)
  }

  current.cleanup()
}

function onPointerMove(ownerDocument: Document, event: PointerEvent): void {
  const current = dragSessions.get(ownerDocument)
  if (!current) {
    return
  }

  if (event.cancelable) {
    event.preventDefault()
  }

  const deltaX = event.clientX - current.lastX
  const deltaY = event.clientY - current.lastY
  current.lastX = event.clientX
  current.lastY = event.clientY

  for (const dragHandle of current.handles) {
    const deltaPx = dragHandle.orientation === 'horizontal' ? deltaX : deltaY
    dragHandle.handle.onDrag(deltaPx, event.altKey)
  }
}

function resolveTopMostRootElement(handle: SplitterHandleRegistration): HTMLElement | undefined {
  let topMostRoot = handle.getRootElement()
  if (!topMostRoot) {
    return undefined
  }

  let parentRoot = topMostRoot.parentElement?.closest(SPLITTER_ROOT_SELECTOR) as HTMLElement | null

  while (parentRoot) {
    topMostRoot = parentRoot
    parentRoot = topMostRoot.parentElement?.closest(SPLITTER_ROOT_SELECTOR) as HTMLElement | null
  }

  return topMostRoot
}

function resolveRegisteredRootElement(entry: RegisteredHandleEntry): HTMLElement | undefined {
  if (entry.rootElement && entry.rootElement.isConnected) {
    return entry.rootElement
  }

  const nextRoot = resolveTopMostRootElement(entry.handle)
  entry.rootElement = nextRoot
  return nextRoot
}

function resolveHandleOwnerDocument(handle: SplitterHandleRegistration): Document | undefined {
  return handle.getElement()?.ownerDocument
}

function createDragEndEvent(ownerDocument: Document): MouseEvent {
  const ownerWindow = ownerDocument.defaultView
  const MouseEventCtor = ownerWindow?.MouseEvent ?? MouseEvent

  return new MouseEventCtor('mouseup')
}

function resolveIntersectionTargetByPointerEdge(
  handle: SplitterHandleRegistration,
  event: PointerEvent,
): SplitterIntersectionEdge | null {
  const element = handle.getElement()
  if (!element) {
    return null
  }

  const rect = element.getBoundingClientRect()

  if (handle.getOrientation() === 'horizontal') {
    if (event.clientY - rect.top <= INTERSECTION_EDGE_THRESHOLD) {
      return 'start'
    }

    if (rect.bottom - event.clientY <= INTERSECTION_EDGE_THRESHOLD) {
      return 'end'
    }

    return null
  }

  if (event.clientX - rect.left <= INTERSECTION_EDGE_THRESHOLD) {
    return 'start'
  }

  if (rect.right - event.clientX <= INTERSECTION_EDGE_THRESHOLD) {
    return 'end'
  }

  return null
}

function getHandleIntersection(
  handle: SplitterHandleRegistration,
  edge: SplitterIntersectionEdge,
): SplitterHandleRegistration | null {
  return edge === 'start' ? handle.getStartIntersection() : handle.getEndIntersection()
}

function resolveSecondaryDragHandle(
  baseHandle: SplitterHandleRegistration,
  target: SplitterIntersectionTarget,
  event: PointerEvent,
): SplitterHandleRegistration | null {
  const edge =
    target === 'handle' ? resolveIntersectionTargetByPointerEdge(baseHandle, event) : target
  return edge === null ? null : getHandleIntersection(baseHandle, edge)
}

function resolveDragHandles(
  baseHandle: SplitterHandleRegistration,
  target: SplitterIntersectionTarget,
  event: PointerEvent,
): SplitterHandleRegistration[] {
  const ownerDocument = resolveHandleOwnerDocument(baseHandle)
  const secondaryHandle = resolveSecondaryDragHandle(baseHandle, target, event)
  if (
    !secondaryHandle ||
    secondaryHandle.id === baseHandle.id ||
    resolveHandleOwnerDocument(secondaryHandle) !== ownerDocument ||
    secondaryHandle.getOrientation() === baseHandle.getOrientation()
  ) {
    return [baseHandle]
  }

  return [baseHandle, secondaryHandle]
}

function isCrossAxisOverlapping(
  primaryStart: number,
  primaryEnd: number,
  secondaryStart: number,
  secondaryEnd: number,
): boolean {
  return !(primaryStart > secondaryEnd) && !(primaryEnd < secondaryStart)
}

function setIntersection(
  handle: SplitterHandleRegistration,
  edge: SplitterIntersectionEdge,
  intersection: SplitterHandleRegistration,
): void {
  if (edge === 'start') {
    if (handle.getStartIntersectionEnabled()) {
      handle.setStartIntersection(intersection)
    }

    return
  }

  if (handle.getEndIntersectionEnabled()) {
    handle.setEndIntersection(intersection)
  }
}

function assignIntersections(snapshots: HandleSnapshot[]): void {
  for (const primary of snapshots) {
    for (const secondary of snapshots) {
      if (primary.orientation === secondary.orientation) {
        continue
      }

      if (primary.orientation === 'horizontal') {
        if (
          !isCrossAxisOverlapping(
            primary.rect.left,
            primary.rect.right,
            secondary.rect.left,
            secondary.rect.right,
          )
        ) {
          continue
        }

        if (equalsWithTolerance(primary.rect.top, secondary.rect.bottom)) {
          setIntersection(primary.handle, 'start', secondary.handle)
        }
        if (equalsWithTolerance(primary.rect.bottom, secondary.rect.top)) {
          setIntersection(primary.handle, 'end', secondary.handle)
        }

        continue
      }

      if (
        !isCrossAxisOverlapping(
          primary.rect.top,
          primary.rect.bottom,
          secondary.rect.top,
          secondary.rect.bottom,
        )
      ) {
        continue
      }

      if (equalsWithTolerance(primary.rect.left, secondary.rect.right)) {
        setIntersection(primary.handle, 'start', secondary.handle)
      }
      if (equalsWithTolerance(primary.rect.right, secondary.rect.left)) {
        setIntersection(primary.handle, 'end', secondary.handle)
      }
    }
  }
}

export function refreshSplitterIntersections(): void {
  for (const entry of registeredHandles.values()) {
    entry.handle.setStartIntersection(null)
    entry.handle.setEndIntersection(null)
  }

  const snapshotsByDocument = new Map<Document, Map<HTMLElement, HandleSnapshot[]>>()

  for (const entry of registeredHandles.values()) {
    const element = entry.handle.getElement()
    if (!element) {
      continue
    }

    const rootElement = resolveRegisteredRootElement(entry)
    if (!rootElement) {
      continue
    }

    const snapshotsByRoot = snapshotsByDocument.get(element.ownerDocument) ?? new Map()
    const snapshots = snapshotsByRoot.get(rootElement) ?? []
    snapshots.push({
      handle: entry.handle,
      orientation: entry.handle.getOrientation(),
      rect: element.getBoundingClientRect(),
    })
    snapshotsByRoot.set(rootElement, snapshots)
    snapshotsByDocument.set(element.ownerDocument, snapshotsByRoot)
  }

  for (const snapshotsByRoot of snapshotsByDocument.values()) {
    for (const snapshots of snapshotsByRoot.values()) {
      assignIntersections(snapshots)
    }
  }
}

export function registerSplitterHandle(handle: SplitterHandleRegistration): () => void {
  registeredHandles.set(handle.id, {
    handle,
    rootElement: resolveTopMostRootElement(handle),
  })
  scheduleSplitterIntersectionsRefresh()

  return () => {
    crossHoverRefCount.delete(handle.id)
    registeredHandles.delete(handle.id)

    for (const [ownerDocument, session] of dragSessions) {
      if (!session.handles.some((sessionHandle) => sessionHandle.handle.id === handle.id)) {
        continue
      }

      clearDragSession(ownerDocument, createDragEndEvent(ownerDocument))
    }

    scheduleSplitterIntersectionsRefresh()
  }
}

export function updateSplitterIntersectionHover(
  handle: SplitterHandleRegistration,
  edge: SplitterIntersectionEdge,
  hovered: boolean,
): void {
  setHandleCrossHovered(handle, hovered)

  const secondaryHandle = getHandleIntersection(handle, edge)

  if (!secondaryHandle || secondaryHandle.id === handle.id) {
    return
  }

  setHandleCrossHovered(secondaryHandle, hovered)
}

export function startSplitterDrag(
  handle: SplitterHandleRegistration,
  event: PointerEvent,
  target: SplitterIntersectionTarget,
  captureElement?: HTMLElement | null,
): void {
  if (event.cancelable) {
    event.preventDefault()
  }

  const handles = resolveDragHandles(handle, target, event)
  if (handles.some((dragHandle) => !dragHandle.getElement())) {
    return
  }

  const ownerDocument = resolveHandleOwnerDocument(handle) ?? captureElement?.ownerDocument
  if (!ownerDocument) {
    return
  }

  if (handles.some((dragHandle) => resolveHandleOwnerDocument(dragHandle) !== ownerDocument)) {
    return
  }

  const previousSession = dragSessions.get(ownerDocument)
  if (previousSession) {
    clearDragSession(ownerDocument, event)
  }

  const dragHandles: DragHandleSnapshot[] = handles.map((dragHandle) => ({
    handle: dragHandle,
    orientation: dragHandle.getOrientation(),
  }))

  // Attach pointer listeners to the capturing element when available.
  // When setPointerCapture is active, mobile browsers route captured pointer
  // events to the capturing element rather than bubbling them to window,
  // so we must listen there for reliable move/up/cancel delivery.
  // We also listen on window as a fallback (e.g. when capture is not supported
  // or for contextmenu which bypasses pointer capture).
  const cleanupCapture =
    captureElement && typeof captureElement.addEventListener === 'function'
      ? attachEventListenerMap(captureElement, {
          pointermove: (nextEvent) => onPointerMove(ownerDocument, nextEvent),
          pointerup: (nextEvent) => clearDragSession(ownerDocument, nextEvent),
          pointercancel: (nextEvent) => clearDragSession(ownerDocument, nextEvent),
        })
      : undefined

  const ownerWindow = ownerDocument.defaultView
  const cleanupWindow = !ownerWindow
    ? () => {}
    : attachEventListenerMap(ownerWindow, {
        pointermove: (nextEvent) => onPointerMove(ownerDocument, nextEvent),
        pointerup: (nextEvent) => clearDragSession(ownerDocument, nextEvent),
        pointercancel: (nextEvent) => clearDragSession(ownerDocument, nextEvent),
        contextmenu: (nextEvent) => clearDragSession(ownerDocument, nextEvent),
      })

  const session: DragSession = {
    ownerDocument,
    handles: dragHandles,
    startX: event.clientX,
    startY: event.clientY,
    lastX: event.clientX,
    lastY: event.clientY,
    captureElement,
    cleanup: () => {
      cleanupCapture?.()
      cleanupWindow()
    },
  }
  dragSessions.set(ownerDocument, session)
  lockDocumentTextSelection(session)

  for (const dragHandle of dragHandles) {
    dragHandle.handle.setDragging(true)
  }
}
