const INTERACTIVE_SELECTOR = 'a, button, input, select, textarea, label, [role="checkbox"]'
const POINTER_FOCUS_SELECTOR = 'button, input, [role="checkbox"]'

function getTarget(event: Event): Element | null {
  return event.target instanceof Element ? event.target : null
}

/** Whether the event originates from the item itself, not from a nested item or its group. */
export function belongsToItem(event: Event): boolean {
  const host = event.currentTarget
  const target = getTarget(event)
  if (!(host instanceof Element) || !target || target.closest('[role="treeitem"]') !== host) {
    return false
  }
  const group = target.closest('[role="group"]')
  return !group || !host.contains(group)
}

/** Whether the event originates from an interactive element inside the item, such as a link. */
export function isFromInteractiveDescendant(event: Event): boolean {
  const host = event.currentTarget
  const interactive = getTarget(event)?.closest(INTERACTIVE_SELECTOR)
  return (
    host instanceof Element && !!interactive && interactive !== host && host.contains(interactive)
  )
}

/** Whether a press should keep focus on the item instead of moving it into a control. */
export function isFromPointerFocusableDescendant(event: Event): boolean {
  const host = event.currentTarget
  const control = getTarget(event)?.closest(POINTER_FOCUS_SELECTOR)
  return host instanceof Element && !!control && control !== host && host.contains(control)
}

/** Index attribute the virtualizer reads to measure a row. */
export function getVirtualRowAttributes(row: { 'data-index'?: number | string } | null): {
  'data-index'?: number | string
} {
  return row ? { 'data-index': row['data-index'] } : {}
}
