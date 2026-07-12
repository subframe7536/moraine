import { autoUpdate, computePosition, flip, offset, platform, shift, size } from '@floating-ui/dom'
import type { Middleware, Placement, ReferenceElement, VirtualElement } from '@floating-ui/dom'
import type { Accessor, JSX } from 'solid-js'
import { createEffect, createSignal, onCleanup, untrack } from 'solid-js'

import { useEventListenerMap } from '../../../shared/use-event-listener'
import { isInsideDescendantOverlay, isTopOverlay, pushOverlayLayer } from '../overlay-stack'
import type { OverlayStackEntry } from '../overlay-stack'
import { focusWithoutScrolling, getTransformOrigin, resolveDirection } from '../utils'

export function getOverlayMenuTextValue(item: {
  label?: JSX.Element
  description?: JSX.Element
}): string | undefined {
  if (typeof item.label === 'string') {
    return item.label
  }

  if (typeof item.description === 'string') {
    return item.description
  }

  return undefined
}

export function hasOverlayMenuChildren<TItem extends { type?: string; children?: TItem[] }>(
  item: TItem,
): boolean {
  if (item.type === 'group') {
    return false
  }

  return Boolean(
    item.children?.some((child) => child.type !== 'group' || Boolean(child.children?.length)),
  )
}

interface OverlayMenuGroup<TItem> {
  label?: JSX.Element
  items: TItem[]
}

export function resolveMenuGroups<
  TItem extends { type?: string; children?: any[]; label?: JSX.Element },
>(items?: TItem[]): OverlayMenuGroup<TItem>[] {
  if (!items || items.length === 0) {
    return []
  }

  const groups: OverlayMenuGroup<TItem>[] = []
  let defaultGroup: TItem[] = []

  for (const item of items) {
    if (item.type === 'group') {
      if (defaultGroup.length > 0) {
        groups.push({ items: defaultGroup })
        defaultGroup = []
      }

      if (item.children?.length) {
        groups.push({
          label: item.label,
          items: item.children,
        })
      }

      continue
    }

    defaultGroup.push(item)
  }

  if (defaultGroup.length > 0) {
    groups.push({ items: defaultGroup })
  }

  return groups
}

export type OverlayMenuFocusStrategy = 'content' | 'first' | 'last' | 'none'

export interface OverlayMenuAnchorRect {
  height: number
  width: number
  x: number
  y: number
}

export interface OverlayMenuRegisteredItem {
  disabled: Accessor<boolean>
  element: Accessor<HTMLElement | undefined>
  hasSubmenu: boolean
  id: string
  textValue: Accessor<string | undefined>
}

export interface OverlayMenuRegisteredSubmenu {
  close: () => void
  id: string
  isOpen: Accessor<boolean>
}

export interface OverlayMenuPointerGraceIntent {
  area: Array<[number, number]>
  trough: {
    bottom: number
    left: number
    right: number
    top: number
  }
}

const POINTER_GRACE_SHADOW_PADDING = 12

export interface OverlayMenuLayerState {
  clearQueuedPointerEnter: (element?: HTMLElement) => void
  closeSubmenus: (exceptId?: string) => void
  contentElement: Accessor<HTMLDivElement | undefined>
  currentPlacement: Accessor<Placement>
  focusContent: () => void
  focusFirstItem: () => void
  focusItemByOffset: (delta: number) => void
  focusLastItem: () => void
  highlightedItemId: Accessor<string | undefined>
  queuePointerEnter: (element: HTMLElement, callback: () => void) => void
  registerItem: (item: OverlayMenuRegisteredItem) => () => void
  registerSubmenu: (submenu: OverlayMenuRegisteredSubmenu) => () => void
  setContentElement: (element: HTMLDivElement | undefined) => void
  setCurrentPlacement: (placement: Placement) => void
  setHighlightedItemId: (id?: string) => void
  setPointerGraceIntent: (
    intent: OverlayMenuPointerGraceIntent | null,
    point?: [number, number],
  ) => void
  shouldBlockPointerEnter: (event: PointerEvent) => boolean
}
const POINTER_GRACE_TIMEOUT = 300

export interface OverlayMenuCloseOptions {
  restoreFocus?: boolean
}

function isPointInPolygon(point: [number, number], polygon: Array<[number, number]>): boolean {
  let inside = false

  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const [xi, yi] = polygon[index]!
    const [xj, yj] = polygon[previous]!
    const intersect =
      yi > point[1] !== yj > point[1] &&
      point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi || 1) + xi

    if (intersect) {
      inside = !inside
    }
  }

  return inside
}

function isPointInRect(
  point: [number, number],
  rect: OverlayMenuPointerGraceIntent['trough'],
): boolean {
  return (
    point[0] >= Math.min(rect.left, rect.right) &&
    point[0] <= Math.max(rect.left, rect.right) &&
    point[1] >= Math.min(rect.top, rect.bottom) &&
    point[1] <= Math.max(rect.top, rect.bottom)
  )
}

export function createPointerGraceIntent(
  placement: Placement,
  exitPoint: [number, number],
  triggerElement: Element,
  contentElement: Element,
): OverlayMenuPointerGraceIntent {
  const basePlacement = placement.split('-')[0] as Placement extends `${infer T}-${string}`
    ? T
    : string
  const triggerRect = triggerElement.getBoundingClientRect()
  const rect = contentElement.getBoundingClientRect()
  const [exitX, exitY] = exitPoint

  switch (basePlacement) {
    case 'top':
      return {
        area: [
          [exitX, exitY + 5],
          [rect.left, rect.bottom + POINTER_GRACE_SHADOW_PADDING],
          [rect.left, rect.top],
          [rect.right, rect.top],
          [rect.right, rect.bottom + POINTER_GRACE_SHADOW_PADDING],
        ],
        trough: {
          bottom: Math.max(triggerRect.top, rect.bottom + POINTER_GRACE_SHADOW_PADDING),
          left: Math.min(triggerRect.left, rect.left),
          right: Math.max(triggerRect.right, rect.right),
          top: Math.min(triggerRect.top, rect.bottom + POINTER_GRACE_SHADOW_PADDING),
        },
      }
    case 'left':
      return {
        area: [
          [exitX + 5, exitY],
          [rect.right + POINTER_GRACE_SHADOW_PADDING, rect.bottom],
          [rect.left, rect.bottom],
          [rect.left, rect.top],
          [rect.right + POINTER_GRACE_SHADOW_PADDING, rect.top],
        ],
        trough: {
          bottom: Math.max(triggerRect.bottom, rect.bottom),
          left: Math.min(rect.right, triggerRect.left),
          right: Math.max(rect.right + POINTER_GRACE_SHADOW_PADDING, triggerRect.left),
          top: Math.min(triggerRect.top, rect.top),
        },
      }
    case 'bottom':
      return {
        area: [
          [exitX, exitY - 5],
          [rect.right, rect.top - POINTER_GRACE_SHADOW_PADDING],
          [rect.right, rect.bottom],
          [rect.left, rect.bottom],
          [rect.left, rect.top - POINTER_GRACE_SHADOW_PADDING],
        ],
        trough: {
          bottom: Math.max(rect.bottom, triggerRect.bottom),
          left: Math.min(triggerRect.left, rect.left),
          right: Math.max(triggerRect.right, rect.right),
          top: Math.min(rect.top - POINTER_GRACE_SHADOW_PADDING, triggerRect.bottom),
        },
      }
    default:
      return {
        area: [
          [exitX - 5, exitY],
          [rect.left - POINTER_GRACE_SHADOW_PADDING, rect.top],
          [rect.right, rect.top],
          [rect.right, rect.bottom],
          [rect.left - POINTER_GRACE_SHADOW_PADDING, rect.bottom],
        ],
        trough: {
          bottom: Math.max(triggerRect.bottom, rect.bottom),
          left: Math.min(triggerRect.right, rect.left - POINTER_GRACE_SHADOW_PADDING),
          right: Math.max(triggerRect.right, rect.left),
          top: Math.min(triggerRect.top, rect.top),
        },
      }
  }
}

export function isPointInPointerGraceIntent(
  point: [number, number],
  intent: OverlayMenuPointerGraceIntent,
): boolean {
  return isPointInRect(point, intent.trough) || isPointInPolygon(point, intent.area)
}

function toDomRect(rect: OverlayMenuAnchorRect): DOMRect {
  return {
    bottom: rect.y + rect.height,
    height: rect.height,
    left: rect.x,
    right: rect.x + rect.width,
    top: rect.y,
    width: rect.width,
    x: rect.x,
    y: rect.y,
    toJSON: () => ({}),
  } as DOMRect
}

export function createVirtualReference(
  rect: OverlayMenuAnchorRect,
  contextElement?: HTMLElement,
): VirtualElement & { contextElement?: HTMLElement } {
  return {
    contextElement,
    getBoundingClientRect: () => toDomRect(rect),
  }
}

export function focusElement(element: HTMLElement | undefined): void {
  if (!element) {
    return
  }

  focusWithoutScrolling(element)
  element.scrollIntoView?.({ block: 'nearest' })
}

export function useOverlayMenuFloatingPosition(options: {
  contentElement: Accessor<HTMLElement | undefined>
  floatingElement: Accessor<HTMLElement | undefined>
  getReferenceElement: () => ReferenceElement | undefined
  gutter: Accessor<number>
  onPositionedChange: (positioned: boolean) => void
  onPlacementChange: (placement: Placement) => void
  open: Accessor<boolean>
  overflowPadding: Accessor<number>
  placement: Accessor<Placement>
}): void {
  let cleanupAutoUpdate: (() => void) | undefined

  createEffect(() => {
    if (!options.open()) {
      options.onPositionedChange(false)
      cleanupAutoUpdate?.()
      cleanupAutoUpdate = undefined
      return
    }

    const floatingElement = options.floatingElement()
    const referenceElement = options.getReferenceElement()

    if (!floatingElement || !referenceElement) {
      options.onPositionedChange(false)
      return
    }

    const direction = resolveDirection()

    const updatePosition = async () => {
      const content = options.contentElement()
      const floating = options.floatingElement()
      const reference = options.getReferenceElement()

      if (!floating || !reference) {
        return
      }

      const measuredElement = content ?? floating

      const overflowPadding = options.overflowPadding()
      const middleware: Middleware[] = [
        offset({ mainAxis: options.gutter() }),
        flip({ padding: overflowPadding }),
        shift({ crossAxis: true, mainAxis: true, padding: overflowPadding }),
        size({
          padding: overflowPadding,
          apply({ availableHeight, availableWidth, rects }) {
            measuredElement.style.setProperty(
              '--mo-popper-anchor-width',
              `${Math.round(rects.reference.width)}px`,
            )
            measuredElement.style.setProperty(
              '--mo-popper-content-available-width',
              `${Math.floor(availableWidth)}px`,
            )
            measuredElement.style.setProperty(
              '--mo-popper-content-available-height',
              `${Math.floor(availableHeight)}px`,
            )
            measuredElement.style.setProperty(
              '--mo-popper-content-overflow-padding',
              `${overflowPadding}px`,
            )
          },
        }),
      ]

      const position = await computePosition(reference, floating, {
        middleware,
        placement: options.placement(),
        platform: {
          ...platform,
          isRTL: () => direction === 'rtl',
        },
        strategy: 'absolute',
      })

      options.onPlacementChange(position.placement)
      content?.style.setProperty(
        '--mo-popper-content-transform-origin',
        getTransformOrigin(position.placement, direction),
      )

      Object.assign(floating.style, {
        left: '0',
        position: 'fixed',
        top: '0',
        transform: `translate3d(${Math.round(position.x)}px, ${Math.round(position.y)}px, 0)`,
        visibility: 'visible',
      })
      options.onPositionedChange(true)
    }

    cleanupAutoUpdate = autoUpdate(referenceElement, floatingElement, updatePosition)
    void updatePosition()

    onCleanup(() => {
      cleanupAutoUpdate?.()
      cleanupAutoUpdate = undefined
    })
  })
}

export function useOverlayMenuLayerState(): OverlayMenuLayerState {
  const [contentElement, setContentElement] = createSignal<HTMLDivElement | undefined>(undefined)
  const [currentPlacement, setCurrentPlacement] = createSignal<Placement>('bottom-start')
  const [highlightedItemId, setHighlightedItemId] = createSignal<string | undefined>(undefined)
  const [items, setItems] = createSignal<OverlayMenuRegisteredItem[]>([])
  const [submenus, setSubmenus] = createSignal<OverlayMenuRegisteredSubmenu[]>([])
  let pointerGraceIntent: OverlayMenuPointerGraceIntent | null = null
  let pointerGraceTimeoutId = 0
  let queuedPointerEnter:
    | {
        callback: () => void
        element: HTMLElement
      }
    | undefined

  const closeSubmenus = (exceptId?: string): void => {
    for (const submenu of [...submenus()].reverse()) {
      if (submenu.id === exceptId || !submenu.isOpen()) {
        continue
      }

      submenu.close()
    }
  }

  const getEnabledItems = () => items().filter((item) => item.element() && !item.disabled())

  const focusItem = (item: OverlayMenuRegisteredItem | undefined): void => {
    if (!item) {
      setHighlightedItemId(undefined)
      return
    }

    setHighlightedItemId(item.id)
    focusElement(item.element())
  }

  const focusContent = (): void => {
    setHighlightedItemId(undefined)
    focusWithoutScrolling(contentElement())
  }

  const focusItemByOffset = (delta: number): void => {
    const enabledItems = getEnabledItems()

    if (enabledItems.length === 0) {
      return
    }

    const currentIndex = enabledItems.findIndex((item) => item.id === highlightedItemId())
    const nextIndex =
      currentIndex === -1
        ? delta > 0
          ? 0
          : enabledItems.length - 1
        : (currentIndex + delta + enabledItems.length) % enabledItems.length
    const nextItem = enabledItems[nextIndex]

    if (!nextItem) {
      return
    }

    closeSubmenus(nextItem.hasSubmenu ? nextItem.id : undefined)
    focusItem(nextItem)
  }

  const focusFirstItem = (): void => {
    const nextItem = getEnabledItems()[0]

    if (!nextItem) {
      return
    }

    closeSubmenus(nextItem.hasSubmenu ? nextItem.id : undefined)
    focusItem(nextItem)
  }

  const focusLastItem = (): void => {
    const enabledItems = getEnabledItems()
    const nextItem = enabledItems[enabledItems.length - 1]

    if (!nextItem) {
      return
    }

    closeSubmenus(nextItem.hasSubmenu ? nextItem.id : undefined)
    focusItem(nextItem)
  }

  const registerItem = (item: OverlayMenuRegisteredItem): (() => void) => {
    setItems((currentItems) => [...currentItems, item])

    return () => {
      setItems((currentItems) => currentItems.filter((currentItem) => currentItem.id !== item.id))

      if (untrack(() => highlightedItemId() === item.id)) {
        setHighlightedItemId(undefined)
      }
    }
  }

  const registerSubmenu = (submenu: OverlayMenuRegisteredSubmenu): (() => void) => {
    setSubmenus((currentSubmenus) => [...currentSubmenus, submenu])

    return () => {
      setSubmenus((currentSubmenus) =>
        currentSubmenus.filter((currentSubmenu) => currentSubmenu.id !== submenu.id),
      )
    }
  }

  const queuePointerEnter = (element: HTMLElement, callback: () => void): void => {
    queuedPointerEnter = { callback, element }
  }

  const clearQueuedPointerEnter = (element?: HTMLElement): void => {
    if (!queuedPointerEnter) {
      return
    }

    if (element && queuedPointerEnter.element !== element) {
      return
    }

    queuedPointerEnter = undefined
  }

  const setPointerGraceIntent = (
    intent: OverlayMenuPointerGraceIntent | null,
    point?: [number, number],
  ): void => {
    const shouldPreserveDeadline =
      pointerGraceIntent !== null &&
      point !== undefined &&
      isPointInPointerGraceIntent(point, pointerGraceIntent)

    if (!intent) {
      if (shouldPreserveDeadline) {
        return
      }

      pointerGraceIntent = null
      window.clearTimeout(pointerGraceTimeoutId)
      pointerGraceTimeoutId = 0
      clearQueuedPointerEnter()
      return
    }

    pointerGraceIntent = intent

    if (shouldPreserveDeadline) {
      return
    }

    window.clearTimeout(pointerGraceTimeoutId)

    pointerGraceTimeoutId = window.setTimeout(() => {
      pointerGraceIntent = null
      pointerGraceTimeoutId = 0

      const pendingPointerEnter = queuedPointerEnter

      if (!pendingPointerEnter) {
        return
      }

      queuedPointerEnter = undefined
      pendingPointerEnter.callback()
    }, POINTER_GRACE_TIMEOUT)
  }

  onCleanup(() => {
    window.clearTimeout(pointerGraceTimeoutId)
    queuedPointerEnter = undefined
  })

  return {
    clearQueuedPointerEnter,
    closeSubmenus,
    contentElement,
    currentPlacement,
    focusContent,
    focusFirstItem,
    focusItemByOffset,
    focusLastItem,
    highlightedItemId,
    queuePointerEnter,
    registerItem,
    registerSubmenu,
    setContentElement,
    setCurrentPlacement,
    setHighlightedItemId,
    setPointerGraceIntent,
    shouldBlockPointerEnter: (event) =>
      pointerGraceIntent !== null &&
      isPointInPointerGraceIntent([event.clientX, event.clientY], pointerGraceIntent),
  }
}

export function useOverlayMenuDismiss(options: {
  containsTarget: (node: Node) => boolean
  contentElement?: Accessor<HTMLElement | undefined>
  triggerElement?: Accessor<HTMLElement | undefined>
  onClose: () => void
  open: Accessor<boolean>
}): void {
  createEffect(() => {
    if (!options.open() || typeof document === 'undefined') {
      return
    }

    const stackEntry: OverlayStackEntry = {
      contentElement: options.contentElement ?? (() => undefined),
      triggerElement: options.triggerElement ?? (() => undefined),
    }
    onCleanup(pushOverlayLayer(stackEntry))

    const isInside = (node: Node): boolean => {
      if (options.containsTarget(node)) {
        return true
      }

      return isInsideDescendantOverlay(stackEntry, node)
    }

    const onDocumentPointerDown = (event: PointerEvent): void => {
      const target = event.target

      if (!(target instanceof Node) || isInside(target)) {
        return
      }

      if (!isTopOverlay(stackEntry)) {
        return
      }

      options.onClose()
    }
    const onDocumentFocusIn = (event: FocusEvent): void => {
      const target = event.target

      if (!(target instanceof Node) || isInside(target)) {
        return
      }

      if (!isTopOverlay(stackEntry)) {
        return
      }

      options.onClose()
    }
    const onDocumentKeyDown = (event: KeyboardEvent): void => {
      const target = event.target

      if (target instanceof Node && isInside(target)) {
        return
      }

      if (event.key !== 'Escape') {
        return
      }

      if (!isTopOverlay(stackEntry)) {
        return
      }

      event.preventDefault()
      options.onClose()
    }

    useEventListenerMap(
      document,
      {
        pointerdown: onDocumentPointerDown,
        focusin: onDocumentFocusIn,
        keydown: onDocumentKeyDown,
      },
      true,
    )
  })
}

export function focusLayerFromStrategy(
  layer: OverlayMenuLayerState,
  strategy: OverlayMenuFocusStrategy,
): void {
  if (strategy === 'content') {
    layer.focusContent()
    return
  }

  if (strategy === 'first') {
    layer.focusFirstItem()
    return
  }

  if (strategy === 'last') {
    layer.focusLastItem()
  }
}

export function onLayerKeyDown(
  event: KeyboardEvent,
  layer: OverlayMenuLayerState,
  onClose: (options?: OverlayMenuCloseOptions) => void,
  closeParentKey?: string,
): void {
  if (event.key === 'Tab') {
    event.preventDefault()
    return
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    layer.focusItemByOffset(1)
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    layer.focusItemByOffset(-1)
    return
  }

  if (event.key === 'Home') {
    event.preventDefault()
    layer.focusFirstItem()
    return
  }

  if (event.key === 'End') {
    event.preventDefault()
    layer.focusLastItem()
    return
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    onClose({ restoreFocus: true })
    return
  }

  if (closeParentKey && event.key === closeParentKey) {
    event.preventDefault()
    onClose()
  }
}
