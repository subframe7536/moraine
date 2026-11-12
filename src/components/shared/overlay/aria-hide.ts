import { containsComposed, getComposedElementAncestors, getComposedElementChildren } from './dom'
import { containsOverlayContentAbove } from './overlay-stack'

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
  observe: () => void
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
    if (containsComposed(target, element)) {
      return
    }

    if (containsComposed(element, target)) {
      for (const child of getComposedElementChildren(element)) {
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
        [...hiddenElements].some((element) => containsComposed(element, mutationTarget))
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
  const observe = (): void => {
    observer.observe(root, { childList: true, subtree: true })
    for (const ancestor of getComposedElementAncestors(target)) {
      if (ancestor.shadowRoot && containsComposed(root, ancestor)) {
        observer.observe(ancestor.shadowRoot, { childList: true, subtree: true })
      }
    }
  }
  const layer: AriaHideLayer = { hiddenElements, observer, root, target, walk, observe }
  layers.push(layer)
  observe()

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
        previousLayer.observe()
      }
    }
  }
}
