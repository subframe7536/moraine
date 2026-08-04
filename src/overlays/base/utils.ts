import type { Placement } from '@floating-ui/dom'

import type { OverlayMenuSide } from './menu/index.ts'

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
  '[contenteditable]',
  '[tabindex]:not([tabindex="-1"])',
] as const

export const FOCUSABLE_SELECTOR = FOCUSABLE_SELECTOR_PARTS.join(',')

type FloatingSide = 'top' | 'right' | 'bottom' | 'left'

const REVERSE_BASE_PLACEMENT: Record<FloatingSide, FloatingSide> = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right',
}

let scrollLockDepth = 0
let previousBodyOverflow = ''

export function acquireBodyScrollLock(): () => void {
  if (typeof document === 'undefined') {
    return () => undefined
  }

  if (scrollLockDepth === 0) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }

  scrollLockDepth += 1

  let released = false

  return () => {
    if (released) {
      return
    }

    released = true
    scrollLockDepth = Math.max(0, scrollLockDepth - 1)

    if (scrollLockDepth === 0) {
      document.body.style.overflow = previousBodyOverflow
      previousBodyOverflow = ''
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

      return (element as HTMLElement & { inert?: boolean }).inert !== true
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

export function focusTrigger(triggerElement: HTMLElement | undefined): void {
  if (!triggerElement) {
    return
  }

  const [firstFocusable] = getFocusableElements(triggerElement)
  focusWithoutScrolling(firstFocusable ?? triggerElement)
}

export function resolveDirection(): 'ltr' | 'rtl' {
  if (typeof document === 'undefined') {
    return 'ltr'
  }

  return (document.dir || document.documentElement.dir || 'ltr') === 'rtl' ? 'rtl' : 'ltr'
}

export function getTransformOrigin(placement: Placement, direction: 'ltr' | 'rtl'): string {
  const [basePlacement, alignment] = placement.split('-') as [
    FloatingSide,
    'start' | 'end' | undefined,
  ]
  const reversePlacement = REVERSE_BASE_PLACEMENT[basePlacement]

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
