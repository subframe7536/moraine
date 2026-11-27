import { isServer } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import type { Accessor, merge as solidMerge } from 'solid-js'
import {
  $PROXY,
  children as resolveChildren,
  createMemo,
  createRenderEffect,
  createUniqueId,
  getOwner,
  runWithOwner,
  untrack,
} from 'solid-js'

/**
 * Generates a unique identifier for accessibility and form association.
 *
 * Priority:
 * 1. Returns `deterministicId` if provided
 * 2. Falls back to a generated identifier with a prefix
 *
 * @param deterministicId - Optional explicit ID to use.
 * @param prefix - Prefix for generated IDs. Defaults to `'mo'`.
 * @returns A unique string identifier.
 *
 * @example
 * ```tsx
 * // Auto-generated ID
 * const id = createId()
 * id() // 'mo-1'
 *
 * // With custom prefix
 * const id = createId(() => props.id, 'dialog')
 * id() // 'dialog-cl-2'
 * ```
 */
export function createId(
  deterministicId?: () => string | null | undefined,
  prefix: string | (() => string) = 'mo',
): Accessor<string> {
  const uniqueId = createUniqueId()
  if (!deterministicId && typeof prefix === 'string') {
    const fixedId = `${prefix}-${uniqueId}`
    return () => fixedId
  }

  return createMemo(() => {
    const id = deterministicId?.()

    // Return deterministic ID if provided
    if (id) {
      return id
    }

    // Fallback to auto-incrementing counter
    const resolvedPrefix = typeof prefix === 'function' ? prefix() : prefix
    return `${resolvedPrefix}-${uniqueId}`
  })
}

export interface HandlerCallResult<R = unknown> {
  defaultPrevented: boolean
  result: R | undefined
}

export function callHandler<E extends Event = Event, R = unknown>(
  event: E,
  handler: unknown,
): HandlerCallResult<R> {
  let result: R | undefined

  if (handler) {
    if (typeof handler === 'function') {
      result = (handler as (event: E) => R)(event)
    } else if (Array.isArray(handler) && typeof handler[0] === 'function') {
      result = (handler[0] as (data: unknown, event: E) => R)(handler[1], event)
    }
  }

  return {
    defaultPrevented: event?.defaultPrevented ?? false,
    result,
  }
}

/** Whether the current user agent belongs to an Android browser. */
export function isAndroidUserAgent(): boolean {
  return /android/i.test(globalThis.navigator?.userAgent ?? '')
}

/**
 * Escapes a value into a DOM id segment. Every character outside `[a-zA-Z0-9-]`
 * (including `_`) is encoded as `_<hex>_`, so distinct values never produce the
 * same segment.
 */
export function toIdSegment(value: string): string {
  return value.replaceAll(
    /[^a-zA-Z0-9-]/g,
    (char) => `_${(char.codePointAt(0) ?? 0).toString(16)}_`,
  )
}

/**
 * Assigns a composed DOM ref without introducing React-style ref objects. Like Solid's own
 * `ref` binding, the ref is resolved untracked when the element is assigned, so `ref` is an
 * accessor of the caller's ref prop rather than a value read inside the ref callback.
 */
export function callRef<T>(ref: () => unknown, element: T): void {
  untrack(() => {
    const resolved = ref()
    if (typeof resolved === 'function') {
      ;(resolved as (element: T) => void)(element)
    }
  })
}

/**
 * `children(() => props.children)` pinned under the component owner once read.
 *
 * Solid 2 disposes computations whose last subscriber unmounts, and the next read
 * re-invokes the children getter — recreating the subtree. Once any binding reads
 * the memo (via direct call or `.toArray()`), pin it under the component owner on
 * the client with `{ transparent: true }` so it stays observed without shifting
 * hydration IDs.
 */
export function resolvePropsChildren(props: {
  children?: JSX.Element
}): ReturnType<typeof resolveChildren> {
  const resolved = resolveChildren(() => props.children)
  const owner = getOwner()
  let pinned = false
  const pin = (): void => {
    if (!pinned && !isServer && owner) {
      pinned = true
      runWithOwner(owner, () =>
        createRenderEffect(
          () => resolved(),
          () => {},
          { transparent: true },
        ),
      )
    }
  }
  const accessor = (() => {
    const value = resolved()
    pin()
    return value
  }) as ReturnType<typeof resolveChildren>
  accessor.toArray = () => {
    const value = resolved.toArray()
    pin()
    return value
  }
  return accessor
}

const latestPublishedElement = new WeakMap<object, unknown>()

/**
 * Publishes an element to a longer-lived signal, such as a parent context.
 *
 * The cleanup clears the signal only while it still holds this element,
 * including across same-tick staged writes in Solid 2.
 */
export function publishElement<T>(
  _get: Accessor<T | undefined>,
  set: (element: T | undefined) => void,
): (element: T) => VoidFunction {
  return (element) => {
    latestPublishedElement.set(set, element)
    set(element)
    return () => {
      if (latestPublishedElement.get(set) === element) {
        latestPublishedElement.delete(set)
        set(undefined)
      }
    }
  }
}

/**
 * Merges reactive prop objects left-to-right like Solid 2's `merge()`, except
 * `undefined` values fall back to earlier sources instead of overwriting them.
 *
 * Preserves reactive getters across all sources so explicit `undefined` props
 * (e.g. forwarded optional props) never clobber defaults.
 */
export function mergeDefinedProps<T extends Array<object>>(
  ...sources: T
): ReturnType<typeof solidMerge<T>> {
  const resolveValue = (property: PropertyKey): unknown => {
    for (let i = sources.length - 1; i >= 0; i--) {
      const source = sources[i] as Record<PropertyKey, unknown> | undefined
      if (source && property in source) {
        const value = source[property]
        if (value !== undefined) {
          return value
        }
      }
    }
    return undefined
  }

  return new Proxy(
    {},
    {
      get(_target, property, receiver) {
        if (property === $PROXY) {
          return receiver
        }
        return resolveValue(property)
      },
      has(_target, property) {
        if (property === $PROXY) {
          return true
        }
        for (let i = sources.length - 1; i >= 0; i--) {
          const source = sources[i] as Record<PropertyKey, unknown> | undefined
          if (source && property in source) {
            return true
          }
        }
        return false
      },
      ownKeys() {
        const keys = new Set<string | symbol>()
        for (const source of sources) {
          if (source) {
            for (const key of Reflect.ownKeys(source)) {
              keys.add(key)
            }
          }
        }
        return [...keys]
      },
      getOwnPropertyDescriptor(_target, property) {
        for (let i = sources.length - 1; i >= 0; i--) {
          const source = sources[i] as Record<PropertyKey, unknown> | undefined
          if (source && property in source) {
            return {
              enumerable: true,
              configurable: true,
              get() {
                return resolveValue(property)
              },
            }
          }
        }
        return undefined
      },
    },
  ) as ReturnType<typeof solidMerge<T>>
}
