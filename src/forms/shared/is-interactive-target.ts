/** Returns whether a pointer target belongs to a nested interactive control. */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false
  }

  return Boolean(
    target.closest(
      'button, a, input, textarea, select, [role="button"], [tabindex]:not([tabindex="-1"])',
    ),
  )
}
