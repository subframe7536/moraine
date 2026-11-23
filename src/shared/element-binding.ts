import type { Accessor } from 'solid-js'
import { createRenderEffect, createRoot, getOwner, runWithOwner, untrack } from 'solid-js'
/**
 * Runs `bind` for each element the accessor yields, in the calling owner.
 *
 * Ref callbacks only store the element; registration, listeners, and cleanup live here.
 * The returned cleanup runs when the element changes, becomes `undefined`, or the owner disposes.
 * Bindings run as render effects, so registrations exist before user effects such as `onSettled`.
 */
export function bindElement<T>(
  element: Accessor<T | undefined | null | false>,
  bind: (element: T) => VoidFunction | void,
): void {
  const owner = getOwner()
  createRenderEffect(element, (current) => {
    if (!current) {
      return
    }
    if (!owner) {
      return untrack(() => bind(current))
    }
    return runWithOwner(owner, () =>
      createRoot((dispose) => {
        const cleanup = untrack(() => bind(current))
        return () => {
          try {
            cleanup?.()
          } finally {
            dispose()
          }
        }
      }),
    )
  })
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
