import { cls } from 'cls-variant'
import type { ClassValueArray } from 'cls-variant'
import { cvaFactory } from 'cls-variant/cva'
import type { CvaFunction } from 'cls-variant/cva'
import type { Accessor, JSX } from 'solid-js'
import { createMemo, createUniqueId } from 'solid-js'

/**
 * Generates a unique identifier for accessibility and form association.
 *
 * Priority:
 * 1. Returns `deterministicId` if provided
 * 2. Falls back to a generated identifier with a prefix
 *
 * @param deterministicId - Optional explicit ID to use
 * @param prefix - Prefix for generated IDs (default: 'mo')
 * @returns A unique string identifier
 *
 * @example
 * ```tsx
 * // Auto-generated ID
 * const id = useId()
 * id() // 'mo-1'
 *
 * // With custom prefix
 * const [local, rest] = splitProps(props, ['id'])
 * const id = useId(() => local.id, 'dialog')
 * id() // 'dialog-cl-2'
 * ```
 */
export function useId(
  deterministicId?: () => string | null | undefined,
  prefix = 'mo',
): Accessor<string> {
  const resolvedId = createMemo(() => {
    const id = deterministicId?.()

    // Return deterministic ID if provided
    if (id) {
      return id
    }

    // Fallback to auto-incrementing counter
    return `${prefix}-${createUniqueId()}`
  })

  return resolvedId
}
type extendCNFunction = (clz: string) => string

let __fn: extendCNFunction = (s) => s
export function extendCN(fn: extendCNFunction): void {
  __fn = fn
}

export function cn(...classes: ClassValueArray): string | undefined {
  return __fn(cls(...classes)) || undefined
}

export const cva: CvaFunction = (...args) => {
  return cvaFactory((...classes) => __fn(cls(...classes)))(...args) || undefined
}

export interface HandlerCallResult<R = unknown> {
  defaultPrevented: boolean
  result: R | undefined
}

export function callHandler<T, E extends Event, R = unknown>(
  event: E,
  handler: JSX.EventHandlerUnion<T, E> | undefined,
): HandlerCallResult<R> {
  let result: R | undefined

  if (handler) {
    if (typeof handler === 'function') {
      result = (handler as (event: E) => R)(event)
    } else {
      result = (handler[0] as (data: T, event: E) => R)(handler[1] as T, event)
    }
  }

  return {
    defaultPrevented: event?.defaultPrevented ?? false,
    result,
  }
}
