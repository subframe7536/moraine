import type { Accessor } from 'solid-js'
import { createEffect, on, onCleanup, untrack } from 'solid-js'

/**
 * Runs `bind` for each element the accessor yields, in the calling owner.
 *
 * Ref callbacks only store the element; registration, listeners, and cleanup live here.
 * The returned cleanup runs when the element changes, becomes `undefined`, or the owner disposes.
 */
export function bindElement<T>(
  element: Accessor<T | undefined | null | false>,
  bind: (element: T) => VoidFunction | void,
): void {
  createEffect(
    on(element, (current) => {
      if (!current) {
        return
      }
      const cleanup = untrack(() => bind(current))
      if (cleanup) {
        onCleanup(cleanup)
      }
    }),
  )
}

/**
 * Publishes an element to a longer-lived signal, such as a parent context.
 *
 * The cleanup clears the signal only while it still holds this element.
 */
export function publishElement<T>(
  get: Accessor<T | undefined>,
  set: (element: T | undefined) => void,
): (element: T) => VoidFunction {
  return (element) => {
    set(element)
    return () => {
      if (untrack(get) === element) {
        set(undefined)
      }
    }
  }
}
