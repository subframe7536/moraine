/** Whether a JSX slot has content. Unlike truthiness, zero and empty strings are intentional content. */
export function hasJsxContent(value: unknown): boolean {
  return value !== undefined && value !== null && value !== false
}

/** Whether a form-oriented JSX slot has visible content. Empty strings do not create a slot. */
export function hasNonEmptyJsxContent(value: unknown): boolean {
  return hasJsxContent(value) && value !== ''
}
