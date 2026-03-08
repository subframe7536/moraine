import type { ResizableOrientation } from './panel'

export type { ResizableOrientation } from './panel'

export const RESIZABLE_HANDLE_TARGET_HANDLE = 0 as const
export const RESIZABLE_HANDLE_TARGET_START = 1 as const
export const RESIZABLE_HANDLE_TARGET_END = 2 as const

export type ResizableHandleIntersectionTarget = 0 | 1 | 2
export type ResizableHandleIntersectionEdge = 1 | 2

const INTERSECTION_TOLERANCE = 4
const MANAGER_STATE_INTERSECTION_REFRESH_SCHEDULED = 1 << 0
const RESIZABLE_ROOT_SELECTOR = '[data-resizable-root]'
const INTERSECTION_EDGE_THRESHOLD = 10

const ORIENTATION_FLAG_VERTICAL = 0 as const
const ORIENTATION_FLAG_HORIZONTAL = 1 as const
const ORIENTATION_MASK_HORIZONTAL = 1 << 0
const ORIENTATION_MASK_VERTICAL = 1 << 1

const ALT_KEY_MODE_EVENT = 0 as const
const ALT_KEY_MODE_DISABLED = 1 as const
const ALT_KEY_MODE_ONLY = 2 as const

const RECT_EDGE_TOP = 0 as const
const RECT_EDGE_RIGHT = 1 as const
const RECT_EDGE_BOTTOM = 2 as const
const RECT_EDGE_LEFT = 3 as const

type OrientationFlag = typeof ORIENTATION_FLAG_VERTICAL | typeof ORIENTATION_FLAG_HORIZONTAL
type AltKeyModeFlag =
  | typeof ALT_KEY_MODE_EVENT
  | typeof ALT_KEY_MODE_DISABLED
  | typeof ALT_KEY_MODE_ONLY
type RectEdge =
  | typeof RECT_EDGE_TOP
  | typeof RECT_EDGE_RIGHT
  | typeof RECT_EDGE_BOTTOM
  | typeof RECT_EDGE_LEFT

export interface ResizableHandleRegistration {
  id: symbol
  getElement: () => HTMLElement | undefined
  getRootElement: () => HTMLElement | undefined
  getOrientation: () => ResizableOrientation
  getAltKeyMode: () => boolean | 'only'
  getStartIntersectionEnabled: () => boolean
  getEndIntersectionEnabled: () => boolean
  getStartIntersection: () => ResizableHandleRegistration | null
  getEndIntersection: () => ResizableHandleRegistration | null
  setStartIntersection: (handle: ResizableHandleRegistration | null) => void
  setEndIntersection: (handle: ResizableHandleRegistration | null) => void
  setDragging: (dragging: boolean) => void
  setCrossHovered: (hovered: boolean) => void
  onDrag: (deltaPx: number, altKey: boolean) => void
  onDragEnd: (event: PointerEvent | TouchEvent | MouseEvent) => void
}

interface RegisteredHandleEntry {
  handle: ResizableHandleRegistration
  rootElement: HTMLElement | undefined
}

interface DragHandleSnapshot {
  handle: ResizableHandleRegistration
  orientation: OrientationFlag
  altKeyMode: AltKeyModeFlag
}

interface DragSession {
  handles: DragHandleSnapshot[]
  startX: number
  startY: number
}

interface HandleSnapshot {
  handle: ResizableHandleRegistration
  orientation: OrientationFlag
  rect: DOMRect
}

interface HandleSnapshotsByOrientation {
  horizontal: HandleSnapshot[]
  vertical: HandleSnapshot[]
  horizontalByLeft: Map<number, HandleSnapshot[]>
  horizontalByRight: Map<number, HandleSnapshot[]>
  verticalByTop: Map<number, HandleSnapshot[]>
  verticalByBottom: Map<number, HandleSnapshot[]>
}

const registeredHandles = new Map<symbol, RegisteredHandleEntry>()
let dragSession: DragSession | null = null
let managerState = 0
const crossHoverRefCount = new Map<symbol, number>()

function resolveOrientationFlag(orientation: ResizableOrientation): OrientationFlag {
  return orientation === 'horizontal' ? ORIENTATION_FLAG_HORIZONTAL : ORIENTATION_FLAG_VERTICAL
}

function isHorizontalOrientation(orientation: OrientationFlag): boolean {
  return orientation === ORIENTATION_FLAG_HORIZONTAL
}

function resolveAltKeyModeFlag(mode: boolean | 'only'): AltKeyModeFlag {
  if (mode === 'only') {
    return ALT_KEY_MODE_ONLY
  }

  if (mode === false) {
    return ALT_KEY_MODE_DISABLED
  }

  return ALT_KEY_MODE_EVENT
}

function resolveDragAltKey(mode: AltKeyModeFlag, event: PointerEvent): boolean {
  if (mode === ALT_KEY_MODE_ONLY) {
    return true
  }

  if (mode === ALT_KEY_MODE_DISABLED) {
    return false
  }

  return event.altKey
}

function equalsWithTolerance(a: number, b: number): boolean {
  return Math.abs(a - b) <= INTERSECTION_TOLERANCE
}

function getRectEdgeValue(rect: DOMRect, edge: RectEdge): number {
  if (edge === RECT_EDGE_TOP) {
    return rect.top
  }

  if (edge === RECT_EDGE_RIGHT) {
    return rect.right
  }

  if (edge === RECT_EDGE_BOTTOM) {
    return rect.bottom
  }

  return rect.left
}

function setHandleCrossHovered(handle: ResizableHandleRegistration, hovered: boolean): void {
  const currentCount = crossHoverRefCount.get(handle.id) ?? 0
  const nextCount = hovered ? currentCount + 1 : Math.max(0, currentCount - 1)

  if (nextCount === 0) {
    crossHoverRefCount.delete(handle.id)
  } else {
    crossHoverRefCount.set(handle.id, nextCount)
  }

  handle.setCrossHovered(nextCount > 0)
}

function runScheduledIntersectionsRefresh(): void {
  managerState &= ~MANAGER_STATE_INTERSECTION_REFRESH_SCHEDULED
  refreshResizableHandleIntersections()
}

export function scheduleResizableHandleIntersectionsRefresh(): void {
  if ((managerState & MANAGER_STATE_INTERSECTION_REFRESH_SCHEDULED) !== 0) {
    return
  }

  managerState |= MANAGER_STATE_INTERSECTION_REFRESH_SCHEDULED

  if (typeof queueMicrotask === 'function') {
    queueMicrotask(runScheduledIntersectionsRefresh)
    return
  }

  Promise.resolve().then(runScheduledIntersectionsRefresh)
}

function clearDragSession(event: PointerEvent | TouchEvent | MouseEvent): void {
  if (!dragSession) {
    return
  }

  const current = dragSession
  dragSession = null

  for (const dragHandle of current.handles) {
    dragHandle.handle.setDragging(false)
    dragHandle.handle.onDragEnd(event)
  }

  if (typeof window !== 'undefined') {
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', clearDragSession)
    window.removeEventListener('pointercancel', clearDragSession)
    window.removeEventListener('contextmenu', clearDragSession)
  }
}

function onPointerMove(event: PointerEvent): void {
  if (!dragSession) {
    return
  }

  const deltaX = event.clientX - dragSession.startX
  const deltaY = event.clientY - dragSession.startY

  for (const dragHandle of dragSession.handles) {
    const deltaPx = isHorizontalOrientation(dragHandle.orientation) ? deltaX : deltaY
    dragHandle.handle.onDrag(deltaPx, resolveDragAltKey(dragHandle.altKeyMode, event))
  }
}

function resolveTopMostRootElement(handle: ResizableHandleRegistration): HTMLElement | undefined {
  let topMostRoot = handle.getRootElement()
  if (!topMostRoot) {
    return undefined
  }

  let parentRoot = topMostRoot.parentElement?.closest(RESIZABLE_ROOT_SELECTOR) as HTMLElement | null

  while (parentRoot) {
    topMostRoot = parentRoot
    parentRoot = topMostRoot.parentElement?.closest(RESIZABLE_ROOT_SELECTOR) as HTMLElement | null
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

function resolveIntersectionTargetByPointerEdge(
  handle: ResizableHandleRegistration,
  event: PointerEvent,
): ResizableHandleIntersectionEdge | null {
  const element = handle.getElement()
  if (!element) {
    return null
  }

  const rect = element.getBoundingClientRect()
  const orientation = resolveOrientationFlag(handle.getOrientation())

  if (isHorizontalOrientation(orientation)) {
    if (event.clientY - rect.top <= INTERSECTION_EDGE_THRESHOLD) {
      return RESIZABLE_HANDLE_TARGET_START
    }

    if (rect.bottom - event.clientY <= INTERSECTION_EDGE_THRESHOLD) {
      return RESIZABLE_HANDLE_TARGET_END
    }

    return null
  }

  if (event.clientX - rect.left <= INTERSECTION_EDGE_THRESHOLD) {
    return RESIZABLE_HANDLE_TARGET_START
  }

  if (rect.right - event.clientX <= INTERSECTION_EDGE_THRESHOLD) {
    return RESIZABLE_HANDLE_TARGET_END
  }

  return null
}

function getHandleIntersection(
  handle: ResizableHandleRegistration,
  target: ResizableHandleIntersectionEdge,
): ResizableHandleRegistration | null {
  return target === RESIZABLE_HANDLE_TARGET_START
    ? handle.getStartIntersection()
    : handle.getEndIntersection()
}

function resolveSecondaryDragHandle(
  baseHandle: ResizableHandleRegistration,
  target: ResizableHandleIntersectionTarget,
  event: PointerEvent,
): ResizableHandleRegistration | null {
  if (target === RESIZABLE_HANDLE_TARGET_HANDLE) {
    const inferredTarget = resolveIntersectionTargetByPointerEdge(baseHandle, event)
    if (!inferredTarget) {
      return null
    }

    return getHandleIntersection(baseHandle, inferredTarget)
  }

  if (target === RESIZABLE_HANDLE_TARGET_START || target === RESIZABLE_HANDLE_TARGET_END) {
    return getHandleIntersection(baseHandle, target)
  }

  return null
}

function resolveDragHandles(
  baseHandle: ResizableHandleRegistration,
  target: ResizableHandleIntersectionTarget,
  event: PointerEvent,
): ResizableHandleRegistration[] {
  const secondaryHandle = resolveSecondaryDragHandle(baseHandle, target, event)
  if (!secondaryHandle || secondaryHandle.id === baseHandle.id) {
    return [baseHandle]
  }

  const handles = [baseHandle, secondaryHandle]
  let orientationMask = 0

  for (const handle of handles) {
    const orientation = resolveOrientationFlag(handle.getOrientation())
    orientationMask |=
      orientation === ORIENTATION_FLAG_HORIZONTAL
        ? ORIENTATION_MASK_HORIZONTAL
        : ORIENTATION_MASK_VERTICAL
  }

  return orientationMask === (ORIENTATION_MASK_HORIZONTAL | ORIENTATION_MASK_VERTICAL)
    ? handles
    : [baseHandle]
}

function createDragHandleSnapshot(handle: ResizableHandleRegistration): DragHandleSnapshot {
  return {
    handle,
    orientation: resolveOrientationFlag(handle.getOrientation()),
    altKeyMode: resolveAltKeyModeFlag(handle.getAltKeyMode()),
  }
}

function createRootSnapshotBuckets(): HandleSnapshotsByOrientation {
  return {
    horizontal: [],
    vertical: [],
    horizontalByLeft: new Map<number, HandleSnapshot[]>(),
    horizontalByRight: new Map<number, HandleSnapshot[]>(),
    verticalByTop: new Map<number, HandleSnapshot[]>(),
    verticalByBottom: new Map<number, HandleSnapshot[]>(),
  }
}

function appendSnapshotToBucket(
  bucket: Map<number, HandleSnapshot[]>,
  edgeValue: number,
  snapshot: HandleSnapshot,
): void {
  const key = Math.round(edgeValue)
  const snapshots = bucket.get(key)

  if (!snapshots) {
    bucket.set(key, [snapshot])
    return
  }

  snapshots.push(snapshot)
}

function forEachBucketCandidate(
  bucket: Map<number, HandleSnapshot[]>,
  edgeValue: number,
  callback: (snapshot: HandleSnapshot) => void,
): void {
  const minKey = Math.floor(edgeValue - INTERSECTION_TOLERANCE)
  const maxKey = Math.ceil(edgeValue + INTERSECTION_TOLERANCE)

  for (let key = minKey; key <= maxKey; key += 1) {
    const snapshots = bucket.get(key)
    if (!snapshots) {
      continue
    }

    for (const snapshot of snapshots) {
      callback(snapshot)
    }
  }
}

function isCrossAxisOverlapping(primary: HandleSnapshot, secondary: HandleSnapshot): boolean {
  if (isHorizontalOrientation(primary.orientation)) {
    return !(primary.rect.left > secondary.rect.right || primary.rect.right < secondary.rect.left)
  }

  return !(primary.rect.top > secondary.rect.bottom || primary.rect.bottom < secondary.rect.top)
}

function setIntersection(
  handle: ResizableHandleRegistration,
  target: ResizableHandleIntersectionEdge,
  intersection: ResizableHandleRegistration,
): void {
  if (target === RESIZABLE_HANDLE_TARGET_START) {
    if (handle.getStartIntersectionEnabled()) {
      handle.setStartIntersection(intersection)
    }

    return
  }

  if (handle.getEndIntersectionEnabled()) {
    handle.setEndIntersection(intersection)
  }
}

function assignIntersectionsFromBucket(input: {
  primary: HandleSnapshot
  candidatesByEdge: Map<number, HandleSnapshot[]>
  primaryEdge: RectEdge
  secondaryEdge: RectEdge
  target: ResizableHandleIntersectionEdge
}): void {
  const primaryEdgeValue = getRectEdgeValue(input.primary.rect, input.primaryEdge)

  forEachBucketCandidate(input.candidatesByEdge, primaryEdgeValue, (secondary) => {
    if (!isCrossAxisOverlapping(input.primary, secondary)) {
      return
    }

    const secondaryEdgeValue = getRectEdgeValue(secondary.rect, input.secondaryEdge)
    if (!equalsWithTolerance(primaryEdgeValue, secondaryEdgeValue)) {
      return
    }

    setIntersection(input.primary.handle, input.target, secondary.handle)
  })
}

export function refreshResizableHandleIntersections(): void {
  for (const entry of registeredHandles.values()) {
    entry.handle.setStartIntersection(null)
    entry.handle.setEndIntersection(null)
  }

  const handlesByRoot = new Map<HTMLElement, HandleSnapshotsByOrientation>()

  for (const entry of registeredHandles.values()) {
    const element = entry.handle.getElement()
    if (!element) {
      continue
    }

    const rootElement = resolveRegisteredRootElement(entry)
    if (!rootElement) {
      continue
    }

    const snapshot: HandleSnapshot = {
      handle: entry.handle,
      orientation: resolveOrientationFlag(entry.handle.getOrientation()),
      rect: element.getBoundingClientRect(),
    }

    const scopedHandles = handlesByRoot.get(rootElement) ?? createRootSnapshotBuckets()

    if (isHorizontalOrientation(snapshot.orientation)) {
      scopedHandles.horizontal.push(snapshot)
      appendSnapshotToBucket(scopedHandles.horizontalByLeft, snapshot.rect.left, snapshot)
      appendSnapshotToBucket(scopedHandles.horizontalByRight, snapshot.rect.right, snapshot)
    } else {
      scopedHandles.vertical.push(snapshot)
      appendSnapshotToBucket(scopedHandles.verticalByTop, snapshot.rect.top, snapshot)
      appendSnapshotToBucket(scopedHandles.verticalByBottom, snapshot.rect.bottom, snapshot)
    }

    handlesByRoot.set(rootElement, scopedHandles)
  }

  for (const scopedHandles of handlesByRoot.values()) {
    for (const horizontal of scopedHandles.horizontal) {
      assignIntersectionsFromBucket({
        primary: horizontal,
        candidatesByEdge: scopedHandles.verticalByBottom,
        primaryEdge: RECT_EDGE_TOP,
        secondaryEdge: RECT_EDGE_BOTTOM,
        target: RESIZABLE_HANDLE_TARGET_START,
      })

      assignIntersectionsFromBucket({
        primary: horizontal,
        candidatesByEdge: scopedHandles.verticalByTop,
        primaryEdge: RECT_EDGE_BOTTOM,
        secondaryEdge: RECT_EDGE_TOP,
        target: RESIZABLE_HANDLE_TARGET_END,
      })
    }

    for (const vertical of scopedHandles.vertical) {
      assignIntersectionsFromBucket({
        primary: vertical,
        candidatesByEdge: scopedHandles.horizontalByRight,
        primaryEdge: RECT_EDGE_LEFT,
        secondaryEdge: RECT_EDGE_RIGHT,
        target: RESIZABLE_HANDLE_TARGET_START,
      })

      assignIntersectionsFromBucket({
        primary: vertical,
        candidatesByEdge: scopedHandles.horizontalByLeft,
        primaryEdge: RECT_EDGE_RIGHT,
        secondaryEdge: RECT_EDGE_LEFT,
        target: RESIZABLE_HANDLE_TARGET_END,
      })
    }
  }
}

export function registerResizableHandle(handle: ResizableHandleRegistration): () => void {
  registeredHandles.set(handle.id, {
    handle,
    rootElement: resolveTopMostRootElement(handle),
  })
  scheduleResizableHandleIntersectionsRefresh()

  return () => {
    crossHoverRefCount.delete(handle.id)
    registeredHandles.delete(handle.id)

    if (dragSession?.handles.some((sessionHandle) => sessionHandle.handle.id === handle.id)) {
      clearDragSession(new MouseEvent('mouseup'))
    }

    scheduleResizableHandleIntersectionsRefresh()
  }
}

export function updateResizableHandleIntersectionHoverState(
  handle: ResizableHandleRegistration,
  target: ResizableHandleIntersectionEdge,
  hovered: boolean,
): void {
  setHandleCrossHovered(handle, hovered)

  const secondaryHandle = getHandleIntersection(handle, target)

  if (!secondaryHandle || secondaryHandle.id === handle.id) {
    return
  }

  setHandleCrossHovered(secondaryHandle, hovered)
}

export function startResizableHandleDrag(
  handle: ResizableHandleRegistration,
  event: PointerEvent,
  target: ResizableHandleIntersectionTarget,
): void {
  const handles = resolveDragHandles(handle, target, event)
  if (handles.some((dragHandle) => !dragHandle.getElement())) {
    return
  }

  if (dragSession) {
    clearDragSession(event)
  }

  const dragHandles = handles.map(createDragHandleSnapshot)

  dragSession = {
    handles: dragHandles,
    startX: event.clientX,
    startY: event.clientY,
  }

  for (const dragHandle of dragHandles) {
    dragHandle.handle.setDragging(true)
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', clearDragSession)
    window.addEventListener('pointercancel', clearDragSession)
    window.addEventListener('contextmenu', clearDragSession)
  }
}
