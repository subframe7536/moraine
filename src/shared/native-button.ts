const BUTTON_INPUT_TYPES = new Set(['button', 'color', 'file', 'image', 'reset', 'submit'])

/** Detects native button behavior without depending on the current JavaScript realm. */
export function isNativeButtonElement(element: HTMLElement | undefined, type?: string): boolean {
  if (!element) {
    return false
  }
  if (element.localName === 'button') {
    return true
  }
  return (
    element.localName === 'input' &&
    BUTTON_INPUT_TYPES.has((type ?? (element as HTMLInputElement).type).toLowerCase())
  )
}

export function isNativeButtonTag(tag: string, type?: string): boolean {
  if (tag.toLowerCase() === 'button') {
    return true
  }
  return tag.toLowerCase() === 'input' && BUTTON_INPUT_TYPES.has((type ?? 'button').toLowerCase())
}
