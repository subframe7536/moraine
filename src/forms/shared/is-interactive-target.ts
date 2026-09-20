/** Returns whether a pointer target belongs to a nested interactive control. */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  if (
    !target ||
    typeof target !== 'object' ||
    !('nodeType' in target) ||
    target.nodeType !== 1 ||
    !('closest' in target) ||
    typeof target.closest !== 'function'
  ) {
    return false
  }

  return Boolean(
    target.closest(
      'button, a, input, textarea, select, [role="button"], [tabindex]:not([tabindex="-1"])',
    ),
  )
}
