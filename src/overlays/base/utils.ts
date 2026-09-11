import type { Placement } from '@floating-ui/dom'

import type { OverlayMenuSide } from './menu'
import { containsOverlayContentAbove } from './overlay-stack'

const FOCUSABLE_SELECTOR_PARTS = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]',
  '[tabindex]:not([tabindex="-1"])',
] as const

export const FOCUSABLE_SELECTOR = FOCUSABLE_SELECTOR_PARTS.join(',')

export interface CompositionState {
  isComposing: () => boolean
  onCompositionStart: () => void
  onCompositionEnd: () => void
}

export function createCompositionState(): CompositionState {
  let composing = false

  return {
    isComposing: () => composing,
    onCompositionStart: () => {
      composing = true
    },
    onCompositionEnd: () => {
      composing = false
    },
  }
}

export function isComposingKeyEvent(event: KeyboardEvent, state: CompositionState): boolean {
  return event.isComposing || event.keyCode === 229 || state.isComposing()
}

interface OutsidePressOptions {
  isInside: (target: Node) => boolean
  isEnabled: () => boolean
  onPress: (event: PointerEvent) => void
}

interface PendingPointer {
  event: PointerEvent
  startX: number
  startY: number
  timeoutId: ReturnType<typeof setTimeout>
  valid: boolean
}

export interface OutsidePressHandlers {
  dispose: () => void
  pointerdown: (event: PointerEvent) => void
  pointermove: (event: PointerEvent) => void
  pointerup: (event: PointerEvent) => void
  pointercancel: (event: PointerEvent) => void
}

/** Delays coarse-pointer dismissal until a completed tap so scrolling cannot close an overlay. */
export function createOutsidePressHandlers(options: OutsidePressOptions): OutsidePressHandlers {
  const pendingPointers = new Map<number, PendingPointer>()
  let disposed = false

  const clearPointer = (event: PointerEvent): PendingPointer | undefined => {
    const pending = pendingPointers.get(event.pointerId)
    pendingPointers.delete(event.pointerId)
    if (pending) {
      clearTimeout(pending.timeoutId)
    }
    return pending
  }

  return {
    dispose: () => {
      if (disposed) {
        return
      }

      disposed = true
      for (const pending of pendingPointers.values()) {
        clearTimeout(pending.timeoutId)
      }
      pendingPointers.clear()
    },
    pointerdown: (event) => {
      if (disposed) {
        return
      }

      const target = event.target
      if (
        event.button !== 0 ||
        event.ctrlKey ||
        !(target instanceof Node) ||
        options.isInside(target) ||
        !options.isEnabled()
      ) {
        return
      }

      if (event.pointerType !== 'touch' && event.pointerType !== 'pen') {
        options.onPress(event)
        return
      }

      clearPointer(event)
      let pending: PendingPointer
      const timeoutId = setTimeout(() => {
        if (pendingPointers.get(event.pointerId) === pending) {
          pendingPointers.delete(event.pointerId)
        }
      }, 1000)
      pending = {
        event,
        startX: event.clientX,
        startY: event.clientY,
        timeoutId,
        valid: !event.defaultPrevented,
      }
      pendingPointers.set(event.pointerId, pending)
      if (pendingPointers.size > 1) {
        for (const pending of pendingPointers.values()) {
          pending.valid = false
        }
      }
    },
    pointermove: (event) => {
      if (disposed) {
        return
      }

      const pending = pendingPointers.get(event.pointerId)
      if (
        pending &&
        (Math.abs(event.clientX - pending.startX) > 5 ||
          Math.abs(event.clientY - pending.startY) > 5)
      ) {
        pending.valid = false
      }
    },
    pointerup: (event) => {
      if (disposed) {
        return
      }

      const pending = clearPointer(event)
      if (pending?.valid && pendingPointers.size === 0 && options.isEnabled()) {
        options.onPress(pending.event)
      }
    },
    pointercancel: (event) => {
      if (disposed) {
        return
      }

      clearPointer(event)
    },
  }
}

type FloatingSide = 'top' | 'right' | 'bottom' | 'left'

const REVERSE_BASE_PLACEMENT: Record<FloatingSide, FloatingSide> = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right',
}

const scrollLocks = new WeakMap<
  HTMLElement,
  {
    count: number
    styles: Array<{ property: string; value: string; priority: string }>
  }
>()

interface AriaHiddenState {
  count: number
  previousValue: string | null
}

interface AriaHideLayer {
  hiddenElements: Set<Element>
  observer: MutationObserver
  root: HTMLElement
  target: Element
  walk: (element: Element) => void
}

const ariaHiddenStates = new WeakMap<Element, AriaHiddenState>()
const ariaHideLayers: AriaHideLayer[] = []

/** Hides every body branch outside the target from assistive technology. */
export function acquireAriaHideOutside(
  target: Element,
  root: HTMLElement = document.body,
): () => void {
  const hiddenElements = new Set<Element>()

  const hide = (element: Element): void => {
    if (hiddenElements.has(element)) {
      return
    }

    const currentState = ariaHiddenStates.get(element)
    if (currentState) {
      currentState.count += 1
      hiddenElements.add(element)
      return
    }

    const previousValue = element.getAttribute('aria-hidden')
    if (previousValue === 'true') {
      return
    }

    element.setAttribute('aria-hidden', 'true')
    ariaHiddenStates.set(element, { count: 1, previousValue })
    hiddenElements.add(element)
  }

  const walk = (element: Element): void => {
    if (element === target || target.contains(element)) {
      return
    }

    if (element.contains(target)) {
      for (const child of element.children) {
        walk(child)
      }
      return
    }

    if (
      containsOverlayContentAbove(target, element) ||
      element.matches('[data-live-announcer="true"], [data-react-aria-top-layer="true"]')
    ) {
      return
    }

    hide(element)
  }

  ariaHideLayers[ariaHideLayers.length - 1]?.observer.disconnect()

  for (const child of root.children) {
    walk(child)
  }

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type !== 'childList') {
        continue
      }

      const mutationTarget = record.target
      if (
        mutationTarget.nodeType === 1 &&
        [...hiddenElements].some((element) => element.contains(mutationTarget))
      ) {
        continue
      }

      for (const addedNode of record.addedNodes) {
        if (addedNode.nodeType === 1) {
          walk(addedNode as Element)
        }
      }
    }
  })
  const layer: AriaHideLayer = { hiddenElements, observer, root, target, walk }
  ariaHideLayers.push(layer)
  observer.observe(root, { childList: true, subtree: true })

  let released = false

  return () => {
    if (released) {
      return
    }

    released = true
    observer.disconnect()

    for (const element of hiddenElements) {
      const state = ariaHiddenStates.get(element)
      if (!state) {
        continue
      }

      state.count -= 1
      if (state.count > 0) {
        continue
      }

      if (state.previousValue === null) {
        element.removeAttribute('aria-hidden')
      } else {
        element.setAttribute('aria-hidden', state.previousValue)
      }
      ariaHiddenStates.delete(element)
    }

    const index = ariaHideLayers.indexOf(layer)
    const wasTopLayer = index === ariaHideLayers.length - 1
    if (index !== -1) {
      ariaHideLayers.splice(index, 1)
    }

    if (wasTopLayer) {
      const previousLayer = ariaHideLayers[ariaHideLayers.length - 1]
      if (previousLayer) {
        for (const child of previousLayer.root.children) {
          previousLayer.walk(child)
        }
        previousLayer.observer.observe(previousLayer.root, { childList: true, subtree: true })
      }
    }
  }
}

/** Locks the body and, when supplied, the reference element's scrollable ancestors. */
export function acquireBodyScrollLock(referenceElement?: HTMLElement): () => void {
  if (typeof document === 'undefined') {
    return () => undefined
  }

  const elements = [document.body]
  for (
    let element = referenceElement?.parentElement;
    element && element !== document.body;
    element = element.parentElement
  ) {
    const style = getComputedStyle(element)
    if (
      scrollLocks.has(element) ||
      /(auto|scroll|overlay)/.test(`${style.overflow} ${style.overflowX} ${style.overflowY}`)
    ) {
      elements.push(element)
    }
  }

  for (const element of elements) {
    const existing = scrollLocks.get(element)
    if (existing) {
      existing.count += 1
      continue
    }
    const properties = ['overflow', 'overflow-x', 'overflow-y']
    if (element === document.body) {
      properties.push('padding-right')
    }
    scrollLocks.set(element, {
      count: 1,
      styles: properties.map((property) => ({
        property,
        value: element.style.getPropertyValue(property),
        priority: element.style.getPropertyPriority(property),
      })),
    })
    if (element === document.body) {
      const view = document.defaultView
      const scrollbarWidth = Math.max(
        0,
        (view?.innerWidth ?? document.documentElement.clientWidth) -
          document.documentElement.clientWidth,
      )
      if (scrollbarWidth > 0) {
        const currentPadding = Number.parseFloat(
          view?.getComputedStyle(element).paddingRight ?? '0',
        )
        element.style.paddingRight = `${(Number.isNaN(currentPadding) ? 0 : currentPadding) + scrollbarWidth}px`
      }
    }
    element.style.setProperty('overflow', 'hidden', 'important')
  }

  let released = false

  return () => {
    if (released) {
      return
    }

    released = true
    for (const element of elements) {
      const state = scrollLocks.get(element)!
      state.count -= 1
      if (state.count > 0) {
        continue
      }
      for (const { property } of state.styles) {
        element.style.removeProperty(property)
      }
      for (const { property, value, priority } of state.styles) {
        if (value) {
          element.style.setProperty(property, value, priority)
        }
      }
      scrollLocks.delete(element)
    }
  }
}

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => {
      if (element.tabIndex < 0) {
        return false
      }

      if (element.hasAttribute('disabled') || element.getAttribute('aria-hidden') === 'true') {
        return false
      }

      if (element.closest('[aria-hidden="true"], [hidden], [inert]')) {
        return false
      }

      let ancestor: HTMLElement | null = element
      while (ancestor) {
        if ((ancestor as HTMLElement & { inert?: boolean }).inert === true) {
          return false
        }

        const style = ancestor.ownerDocument.defaultView?.getComputedStyle(ancestor)
        if (
          style?.display === 'none' ||
          style?.visibility === 'hidden' ||
          style?.visibility === 'collapse'
        ) {
          return false
        }
        ancestor = ancestor.parentElement
      }

      return true
    },
  )
}

export function focusWithoutScrolling(element: HTMLElement | undefined): void {
  if (!element) {
    return
  }

  try {
    element.focus({ preventScroll: true })
  } catch {
    element.focus()
  }
}

export function focusContent(container: HTMLElement | undefined): void {
  if (!container) {
    return
  }

  const [firstFocusable] = getFocusableElements(container)
  focusWithoutScrolling(firstFocusable ?? container)
}

export function focusTrigger(triggerElement: HTMLElement | undefined): boolean {
  if (!triggerElement) {
    return false
  }

  const [firstFocusable] = getFocusableElements(triggerElement)
  const target = firstFocusable ?? triggerElement
  if (
    !target.isConnected ||
    target.tabIndex < 0 ||
    target.hasAttribute('disabled') ||
    target.getAttribute('aria-disabled') === 'true' ||
    target.getAttribute('aria-hidden') === 'true' ||
    (target as HTMLElement & { inert?: boolean }).inert === true
  ) {
    return false
  }

  focusWithoutScrolling(target)
  return document.activeElement === target
}

export function resolveDirection(element?: Element): 'ltr' | 'rtl' {
  if (typeof document === 'undefined') {
    return 'ltr'
  }

  if (element && typeof getComputedStyle === 'function') {
    const direction = getComputedStyle(element).direction
    if (direction === 'ltr' || direction === 'rtl') {
      return direction
    }
  }

  return (document.dir || document.documentElement.dir || 'ltr') === 'rtl' ? 'rtl' : 'ltr'
}

export interface TransformOriginOptions {
  gutter?: number
  overlap?: boolean
  reference: { height: number; width: number; x: number; y: number }
  shift?: { x?: number; y?: number }
  x: number
  y: number
}

export function getTransformOrigin(
  placement: Placement,
  direction: 'ltr' | 'rtl',
  options?: TransformOriginOptions,
): string {
  const [basePlacement, alignment] = placement.split('-') as [
    FloatingSide,
    'start' | 'end' | undefined,
  ]
  const reversePlacement = REVERSE_BASE_PLACEMENT[basePlacement]

  if (!options) {
    if (!alignment) {
      return `${reversePlacement} center`
    }

    if (basePlacement === 'left' || basePlacement === 'right') {
      return `${reversePlacement} ${alignment === 'start' ? 'top' : 'bottom'}`
    }

    if (alignment === 'start') {
      return `${reversePlacement} ${direction === 'rtl' ? 'right' : 'left'}`
    }

    return `${reversePlacement} ${direction === 'rtl' ? 'left' : 'right'}`
  }

  const isVertical = basePlacement === 'top' || basePlacement === 'bottom'
  const crossAxisShift = isVertical ? (options.shift?.x ?? 0) : (options.shift?.y ?? 0)
  const mainAxisShift = isVertical ? (options.shift?.y ?? 0) : (options.shift?.x ?? 0)
  const gutter = options.gutter ?? 0
  const crossOrigin =
    alignment && Math.abs(crossAxisShift) <= 1
      ? (alignment === 'start') === (isVertical && direction === 'rtl')
        ? '100%'
        : '0%'
      : `${
          isVertical
            ? options.reference.x + options.reference.width / 2 - options.x
            : options.reference.y + options.reference.height / 2 - options.y
        }px`
  let sideOrigin =
    basePlacement === 'top' || basePlacement === 'left'
      ? `calc(100% + ${gutter}px)`
      : `${-gutter}px`

  if (options.overlap && Math.abs(mainAxisShift) > gutter) {
    sideOrigin = `${
      isVertical
        ? options.reference.y + options.reference.height / 2 - options.y
        : options.reference.x + options.reference.width / 2 - options.x
    }px`
  }

  if (isVertical) {
    return `${crossOrigin} ${sideOrigin}`
  }

  return `${sideOrigin} ${crossOrigin}`
}

export function trapFocusInContainer(
  event: KeyboardEvent,
  container: HTMLElement | undefined,
): void {
  if (event.key !== 'Tab' || !container) {
    return
  }

  const focusableElements = getFocusableElements(container)

  if (focusableElements.length === 0) {
    event.preventDefault()
    container.focus()
    return
  }

  const firstFocusable = focusableElements[0]
  const lastFocusable = focusableElements[focusableElements.length - 1]

  if (!firstFocusable || !lastFocusable) {
    event.preventDefault()
    container.focus()
    return
  }

  const activeElement = document.activeElement

  if (event.shiftKey) {
    if (activeElement === container || activeElement === firstFocusable) {
      event.preventDefault()
      lastFocusable.focus()
    }

    return
  }

  if (activeElement === lastFocusable) {
    event.preventDefault()
    firstFocusable.focus()
  }
}
export function resolveOverlayMenuSide(placement?: string): OverlayMenuSide {
  if (placement?.startsWith('right')) {
    return 'right'
  }

  if (placement?.startsWith('bottom')) {
    return 'bottom'
  }

  if (placement?.startsWith('left')) {
    return 'left'
  }

  return 'top'
}
