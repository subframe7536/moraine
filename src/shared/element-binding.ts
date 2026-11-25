import type { Accessor, Owner } from 'solid-js'
import {
  createRenderEffect,
  createRoot,
  getOwner,
  onCleanup,
  runWithOwner,
  untrack,
} from 'solid-js'

/**
 * Runs `bind` for each element the accessor yields, in the calling owner.
 *
 * Ref callbacks only store the element; registration, listeners, and cleanup live here.
 * The returned cleanup runs when the element changes, becomes `undefined`, or the owner disposes.
 * Bindings run as render effects, so registrations exist before user effects such as `onSettled`.
 *
 * The `scope` argument runs a callback under a per-binding root so binds that need reactive
 * primitives (effects, memos) can create them; everything created inside `scope` is disposed
 * when the element changes or the owner disposes.
 */
export function bindElement<T>(
  element: Accessor<T | undefined | null | false>,
  bind: (element: T, scope: <R>(fn: () => R) => R) => VoidFunction | void,
): void {
  const owner = getOwner()
  let bindDispose: VoidFunction | undefined
  let bindOwner: Owner | undefined

  onCleanup(() => {
    bindDispose?.()
    bindDispose = undefined
    bindOwner = undefined
  })

  createRenderEffect(
    () => {
      const current = element()
      if (!owner) {
        return current
      }
      bindDispose?.()
      bindDispose = undefined
      bindOwner = undefined
      if (!current) {
        return current
      }
      createRoot((dispose) => {
        bindDispose = dispose
        bindOwner = getOwner() ?? undefined
      })
      return current
    },
    (current) => {
      if (!current) {
        return
      }
      const currentOwner = bindOwner
      if (!owner || !currentOwner) {
        return untrack(() => bind(current, (fn) => fn()))
      }
      const cleanup = untrack(() => bind(current, (fn) => runWithOwner(currentOwner, fn)))
      return () => cleanup?.()
    },
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
