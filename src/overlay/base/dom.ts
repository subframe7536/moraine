import { isNativeButtonElement } from '../../shared/native-button'

/** Cross-realm-safe DOM guards and composed-tree traversal for overlay internals. */
export function isNode(value: unknown): value is Node {
  return Boolean(value) && typeof (value as Node).nodeType === 'number'
}

export function isElement(value: unknown): value is Element {
  return isNode(value) && value.nodeType === 1
}

export function isHTMLElement(value: unknown): value is HTMLElement {
  return (
    isElement(value) &&
    value.namespaceURI === 'http://www.w3.org/1999/xhtml' &&
    typeof (value as HTMLElement).focus === 'function'
  )
}

export function getOwnerDocument(node?: Node): Document | undefined {
  return node?.nodeType === 9 ? (node as Document) : (node?.ownerDocument ?? undefined)
}

export function getOwnerWindow(node?: Node): Window | undefined {
  return getOwnerDocument(node)?.defaultView ?? undefined
}

export function isHTMLButtonElement(value: unknown): value is HTMLButtonElement {
  return isHTMLElement(value) && value.localName === 'button'
}

export { isNativeButtonElement }

export function isPointerEvent(value: unknown): value is PointerEvent {
  return (
    isNode((value as Event | undefined)?.target) &&
    typeof (value as PointerEvent).pointerId === 'number' &&
    typeof (value as PointerEvent).pointerType === 'string'
  )
}

function getComposedParent(node: Node): Node | null {
  if (isElement(node) && node.assignedSlot) {
    return node.assignedSlot
  }

  if (node.parentNode) {
    return node.parentNode
  }

  const root = node.getRootNode()
  return root.nodeType === 11 && 'host' in root ? (root as ShadowRoot).host : null
}

/** Returns whether `target` belongs to `container` through light DOM, slots, or open shadow roots. */
export function containsComposed(container: Element, target: Node): boolean {
  if (container === target || container.contains(target)) {
    return true
  }

  const visited = new Set<Node>()
  let current: Node | null = target
  while (current && !visited.has(current)) {
    if (current === container) {
      return true
    }
    visited.add(current)
    current = getComposedParent(current)
  }

  return false
}

/** Resolves the innermost active element visible through open shadow roots. */
export function getActiveElement(ownerDocument: Document): Element | null {
  let activeElement = ownerDocument.activeElement
  while (activeElement?.shadowRoot?.activeElement) {
    activeElement = activeElement.shadowRoot.activeElement
  }
  return activeElement
}

export function getComposedElementAncestors(element: Element): Element[] {
  const ancestors: Element[] = []
  const visited = new Set<Node>()
  let current: Node | null = element
  while (current && !visited.has(current)) {
    visited.add(current)
    if (isElement(current)) {
      ancestors.push(current)
    }
    current = getComposedParent(current)
  }
  return ancestors
}

export function getComposedElementChildren(element: Element): Element[] {
  if (element.localName === 'slot') {
    const assigned = (element as HTMLSlotElement).assignedElements({ flatten: true })
    if (assigned.length > 0) {
      return assigned
    }
  }

  return Array.from(element.shadowRoot?.children ?? element.children)
}

/** Enumerates element descendants in composed order without visiting assigned slot content twice. */
export function getComposedElementDescendants(container: Element): Element[] {
  const descendants: Element[] = []
  const visited = new Set<Element>()

  const walk = (element: Element): void => {
    for (const child of getComposedElementChildren(element)) {
      if (visited.has(child)) {
        continue
      }
      visited.add(child)
      descendants.push(child)
      walk(child)
    }
  }

  walk(container)
  return descendants
}
