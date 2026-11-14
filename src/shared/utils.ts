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
 * const [local, rest] = splitProps(props, ['id'])
 * const id = createId(() => local.id, 'dialog')
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
