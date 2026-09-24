import type { Placement } from '@floating-ui/dom'

import {
  containsComposed,
  getActiveElement,
  getComposedElementAncestors,
  getComposedElementDescendants,
  isHTMLElement,
  isNode,
} from './dom'
import { containsOverlayContentAbove } from './overlay-stack'

const FOCUSABLE_SELECTOR_PARTS = [
  'a[href]',
  'area[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  'iframe',
  'object',
  'embed',
  'audio[controls]',
  'video[controls]',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
] as const

export const FOCUSABLE_SELECTOR = FOCUSABLE_SELECTOR_PARTS.join(',')

export interface CompositionState {
  dispose: () => void
  isComposing: () => boolean
  onCompositionStart: () => void
  onCompositionEnd: () => void
}

export function createCompositionState(): CompositionState {
  let composing = false
  let endCompositionTimeout: ReturnType<typeof setTimeout> | undefined

  const clearEndCompositionTimeout = (): void => {
    if (endCompositionTimeout !== undefined) {
      clearTimeout(endCompositionTimeout)
      endCompositionTimeout = undefined
    }
  }

  return {
    dispose: () => {
      clearEndCompositionTimeout()
      composing = false
    },
    isComposing: () => composing,
    onCompositionStart: () => {
      clearEndCompositionTimeout()
      composing = true
    },
    onCompositionEnd: () => {
      clearEndCompositionTimeout()
      // Safari can dispatch the Escape that cancels IME conversion immediately
      // after compositionend. Keep this bounded guard through that key event.
      endCompositionTimeout = setTimeout(() => {
        composing = false
        endCompositionTimeout = undefined
      }, 100)
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
        event.defaultPrevented ||
        event.button !== 0 ||
        event.ctrlKey ||
        !isNode(target) ||
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
const ariaHideLayers = new WeakMap<Document, AriaHideLayer[]>()

/** Hides every body branch outside the target from assistive technology. */
export function acquireAriaHideOutside(
  target: Element,
  root: HTMLElement = target.ownerDocument.body,
): () => void {
  const ownerDocument = root.ownerDocument
  let layers = ariaHideLayers.get(ownerDocument)
  if (!layers) {
    layers = []
    ariaHideLayers.set(ownerDocument, layers)
  }
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

  layers[layers.length - 1]?.observer.disconnect()

  for (const child of root.children) {
    walk(child)
  }

  const MutationObserverConstructor =
    ownerDocument.defaultView?.MutationObserver ?? MutationObserver
  const observer = new MutationObserverConstructor((records) => {
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
  layers.push(layer)
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

    const index = layers.indexOf(layer)
    const wasTopLayer = index === layers.length - 1
    if (index !== -1) {
      layers.splice(index, 1)
    }

    if (wasTopLayer) {
      const previousLayer = layers[layers.length - 1]
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
  const ownerDocument = referenceElement?.ownerDocument
  if (!ownerDocument) {
    return () => undefined
  }

  const elements = [ownerDocument.body]
  for (
    let element = referenceElement.parentElement;
    element && element !== ownerDocument.body;
    element = element.parentElement
  ) {
    const style = ownerDocument.defaultView?.getComputedStyle(element)
    if (
      scrollLocks.has(element) ||
      /(auto|scroll|overlay)/.test(
        `${style?.overflow ?? ''} ${style?.overflowX ?? ''} ${style?.overflowY ?? ''}`,
      )
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
    if (element === ownerDocument.body) {
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
    if (element === ownerDocument.body) {
      const view = ownerDocument.defaultView
      const scrollbarWidth = Math.max(
        0,
        (view?.innerWidth ?? ownerDocument.documentElement.clientWidth) -
          ownerDocument.documentElement.clientWidth,
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

/** Reveal an overlay item without scrolling the document behind its portal. */
export function scrollIntoViewWithin(element: HTMLElement, boundary: HTMLElement): void {
  if (!boundary.contains(element)) {
    return
  }

  for (
    let container = element.parentElement;
    container && boundary.contains(container);
    container = container.parentElement
  ) {
    if (container.scrollHeight > container.clientHeight) {
      const item = element.getBoundingClientRect()
      const viewport = container.getBoundingClientRect()
      const top = viewport.top + container.clientTop
      const bottom = top + container.clientHeight

      if (item.top < top) {
        container.scrollTop += item.top - top
      } else if (item.bottom > bottom) {
        container.scrollTop += item.bottom - bottom
      }
    }
    if (container === boundary) {
      break
    }
  }
}

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const candidates = getComposedElementDescendants(container).filter(
    (element): element is HTMLElement =>
      isHTMLElement(element) &&
      element.matches(FOCUSABLE_SELECTOR) &&
      isSequentiallyFocusable(element),
  )
  const radioGroups = new Map<string, Map<HTMLFormElement | null, HTMLInputElement[]>>()

  for (const candidate of candidates) {
    if (isRadioInput(candidate) && candidate.name) {
      const forms =
        radioGroups.get(candidate.name) ?? new Map<HTMLFormElement | null, HTMLInputElement[]>()
      const group = forms.get(candidate.form) ?? []
      group.push(candidate)
      forms.set(candidate.form, group)
      radioGroups.set(candidate.name, forms)
    }
  }

  return candidates.filter((candidate) => {
    if (!isRadioInput(candidate) || !candidate.name) {
      return true
    }

    const group = radioGroups.get(candidate.name)?.get(candidate.form) ?? []
    return (group.find((radio) => radio.checked) ?? group[0]) === candidate
  })
}

function isRadioInput(element: HTMLElement): element is HTMLInputElement {
  return element.localName === 'input' && (element as HTMLInputElement).type === 'radio'
}

function isSequentiallyFocusable(element: HTMLElement): boolean {
  if (element.tabIndex < 0 || element.matches(':disabled')) {
    return false
  }

  for (const ancestor of getComposedElementAncestors(element)) {
    if (
      ancestor.getAttribute('aria-hidden') === 'true' ||
      ancestor.hasAttribute('hidden') ||
      ancestor.hasAttribute('inert') ||
      (ancestor as HTMLElement & { inert?: boolean }).inert === true
    ) {
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

    if (ancestor.localName === 'details' && !ancestor.hasAttribute('open')) {
      const summary = Array.from(ancestor.children).find((child) => child.localName === 'summary')
      if (summary === undefined || (element !== summary && !summary.contains(element))) {
        return false
      }
    }
  }

  return true
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

  const focusableElements = getFocusableElements(container)
  for (const focusable of focusableElements) {
    focusWithoutScrolling(focusable)
    if (getActiveElement(container.ownerDocument) === focusable) {
      return
    }
  }

  focusWithoutScrolling(container)
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
  return getActiveElement(target.ownerDocument) === target
}

export function resolveDirection(element?: Element): 'ltr' | 'rtl' {
  const ownerDocument = element?.ownerDocument
  if (element) {
    const direction = ownerDocument?.defaultView?.getComputedStyle(element).direction
    if (direction === 'ltr' || direction === 'rtl') {
      return direction
    }
  }

  return (ownerDocument?.dir || ownerDocument?.documentElement.dir || 'ltr') === 'rtl'
    ? 'rtl'
    : 'ltr'
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

  const activeElement = getActiveElement(container.ownerDocument)

  if (event.shiftKey) {
    if (
      activeElement === container ||
      activeElement === firstFocusable ||
      !activeElement ||
      !containsComposed(container, activeElement)
    ) {
      event.preventDefault()
      lastFocusable.focus()
    }

    return
  }

  if (
    activeElement === container ||
    activeElement === lastFocusable ||
    !activeElement ||
    !containsComposed(container, activeElement)
  ) {
    event.preventDefault()
    firstFocusable.focus()
  }
}
