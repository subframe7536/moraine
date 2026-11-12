import {
  containsComposed,
  getActiveElement,
  getComposedElementAncestors,
  getComposedElementDescendants,
  isHTMLElement,
} from './dom'

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

export const FOCUSABLE_SELECTOR = /* @__PURE__ */ FOCUSABLE_SELECTOR_PARTS.join(',')

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
  if (!element || element.ownerDocument.activeElement === element) {
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

  const autofocusTarget = container.querySelector<HTMLElement>('[data-autofocus],[autofocus]')
  if (autofocusTarget) {
    focusWithoutScrolling(autofocusTarget)
    if (getActiveElement(container.ownerDocument) === autofocusTarget) {
      return
    }
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

export function containFocusInContainer(
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
