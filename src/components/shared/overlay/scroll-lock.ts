const SCROLLABLE_OVERFLOW = /(auto|scroll|overlay)/
const SCROLL_LOCK_PROPERTIES = [
  'overflow',
  'overflow-x',
  'overflow-y',
  'scrollbar-gutter',
  'padding-right',
]

const scrollLocks = new WeakMap<HTMLElement, { count: number; restore: () => void }>()

function hasScrollableOverflow(element: HTMLElement): boolean {
  const style = element.ownerDocument.defaultView?.getComputedStyle(element)
  return SCROLLABLE_OVERFLOW.test(
    `${style?.overflow ?? ''} ${style?.overflowX ?? ''} ${style?.overflowY ?? ''}`,
  )
}

function saveInlineStyles(element: HTMLElement, properties: string[]): () => void {
  const saved = properties.map((property) => ({
    property,
    value: element.style.getPropertyValue(property),
    priority: element.style.getPropertyPriority(property),
  }))
  return () => {
    for (const { property } of saved) {
      element.style.removeProperty(property)
    }
    for (const { property, value, priority } of saved) {
      if (value) {
        element.style.setProperty(property, value, priority)
      }
    }
  }
}

/**
 * Hides a scroller's overflow without changing its content width. A classic scrollbar keeps its
 * space through `scrollbar-gutter: stable`, and inline-end padding covers any remaining shift.
 */
function lockScroller(element: HTMLElement, isPage: boolean): () => void {
  const ownerDocument = element.ownerDocument
  // The viewport scrollbar is measured and reserved on <html> and compensated on <body>.
  const measured = isPage ? ownerDocument.documentElement : element
  const padded = isPage ? ownerDocument.body : element
  const restores = [...new Set([element, measured, padded])].map((target) =>
    saveInlineStyles(target, SCROLL_LOCK_PROPERTIES),
  )
  // <html> clientWidth reports the viewport and ignores a reserved gutter, so measure its box.
  const measure = () => (isPage ? measured.offsetWidth : measured.clientWidth)

  const width = measure()
  element.style.setProperty('overflow', 'hidden', 'important')
  if (measure() > width) {
    measured.style.setProperty('scrollbar-gutter', 'stable')
    const shift = measure() - width
    if (shift > 0) {
      const padding = Number.parseFloat(
        ownerDocument.defaultView?.getComputedStyle(padded).paddingRight ?? '0',
      )
      padded.style.paddingRight = `${(Number.isNaN(padding) ? 0 : padding) + shift}px`
    }
  }

  return () => {
    for (const restore of restores) {
      restore()
    }
  }
}

/**
 * Locks the page scroller and, when supplied, the reference element's scrollable ancestors.
 * Locked scrollers keep their scrollbar space so content does not shift.
 */
export function acquireBodyScrollLock(referenceElement?: HTMLElement): () => void {
  const ownerDocument = referenceElement?.ownerDocument
  const body = ownerDocument?.body
  if (!ownerDocument || !body) {
    return () => undefined
  }

  // The viewport uses <html> overflow when <html> sets its own; otherwise <body> overflow propagates.
  const root = ownerDocument.documentElement
  const pageScroller = scrollLocks.has(root) || hasScrollableOverflow(root) ? root : body
  const elements = [pageScroller]
  for (
    let element = referenceElement.parentElement;
    element && element !== body;
    element = element.parentElement
  ) {
    if (scrollLocks.has(element) || hasScrollableOverflow(element)) {
      elements.push(element)
    }
  }

  for (const element of elements) {
    const existing = scrollLocks.get(element)
    if (existing) {
      existing.count += 1
    } else {
      scrollLocks.set(element, {
        count: 1,
        restore: lockScroller(element, element === pageScroller),
      })
    }
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
      if (state.count === 0) {
        state.restore()
        scrollLocks.delete(element)
      }
    }
  }
}
