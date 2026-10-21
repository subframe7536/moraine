/**
 * Whether a JSX slot, prop, or children value has renderable content.
 *
 * Returns `true` for numeric 0, non-empty strings, DOM nodes/JSX elements, and render functions.
 * Returns `false` for `undefined`, `null`, `false`, `true`, `""` (empty string), and `[]` (empty arrays).
 */
export function hasContent(value: unknown): boolean {
  if (value === 0) {
    return true
  }
  if (!value || value === '' || value === true) {
    return false
  }
  if (Array.isArray(value) && value.length === 0) {
    return false
  }
  return true
}
