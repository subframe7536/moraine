import type { Accessor } from 'solid-js'
import { createMemo, createUniqueId, untrack } from 'solid-js'
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
  prefix = 'mo',
): Accessor<string> {
  const fallbackId = `${prefix}-${createUniqueId()}`
  const resolvedId = createMemo(() => {
    const id = deterministicId?.()

    // Return deterministic ID if provided
    if (id) {
      return id
    }

    // Fallback to auto-incrementing counter
    return fallbackId
  })

  return resolvedId
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
  return value.replace(/[^a-zA-Z0-9-]/g, (char) => `_${char.codePointAt(0)!.toString(16)}_`)
}

/** Assigns a composed DOM ref without introducing React-style ref objects. */
export function callRef<T>(ref: unknown, element: T): void {
  if (typeof ref === 'function') {
    untrack(() => (ref as (element: T) => void)(element))
  }
}

/**
 * View of `props` exposing only `keys`, each as a lazy getter — the picked counterpart
 * to `omit` (the `splitProps` picked half from 1.x).
 *
 * Presence is decided from property descriptors, never by reading values: `merge`
 * resolves shadowing by descriptor, so an accessor key (reactive getter) counts as
 * present without evaluating it — reading `props.children` during key collection
 * would re-render the tree. Only static data keys holding `undefined` are hidden.
 */
export function pick<T extends object, K extends readonly (keyof T)[]>(
  props: T,
  ...keys: K
): Pick<T, K[number]> {
  const present = (key: keyof T): boolean => {
    if (!keys.includes(key as K[number])) {
      return false
    }
    const descriptor = Reflect.getOwnPropertyDescriptor(props, key)
    if (descriptor === undefined) {
      return key in props
    }
    return Boolean(descriptor.enumerable) && (descriptor.get !== undefined || descriptor.value !== undefined)
  }
  return new Proxy({} as Pick<T, K[number]>, {
    get(_, key) {
      return keys.includes(key as K[number]) ? props[key as keyof T] : undefined
    },
    has(_, key) {
      return present(key as keyof T)
    },
    getOwnPropertyDescriptor(_, key) {
      if (!present(key as keyof T)) {
        return undefined
      }
      return {
        enumerable: true,
        configurable: true,
        get: () => props[key as keyof T],
      }
    },
    ownKeys() {
      return keys.filter((key) => present(key)) as (string | symbol)[]
    },
  })
}

/**
 * Per-key memoized predicate over a reactive source — the `createSelector` replacement.
 * `isSelected(key)` reads a per-key memo, so unrelated key changes do not re-run observers.
 */
export function createSelector<S, K>(
  source: () => S,
  fn: (key: K, source: S) => boolean = (key, src) => key === (src as unknown as K),
): (key: K) => boolean {
  const memos = new Map<K, Accessor<boolean>>()
  return (key) => {
    let memo = memos.get(key)
    if (!memo) {
      memo = createMemo(() => fn(key, source()))
      memos.set(key, memo)
    }
    return memo()
  }
}
