import { isServer } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import type { Accessor } from 'solid-js'
import {
  children as resolveChildren,
  createMemo,
  createRenderEffect,
  createUniqueId,
  flush,
  getOwner,
  runWithOwner,
  untrack,
} from 'solid-js'

/**
 * Runs `fn` and, when the caller has no reactive owner, settles the writes it
 * staged with `flush` — like a Solid 1 `batch`. DOM event listeners, timers,
 * and microtasks run unowned, so writes they make would stage forever.
 */
export function settle<T>(fn: () => T): T {
  const result = fn()
  try {
    flush()
  } catch {
    // Inside an action body or an onSettled callback flush() throws; writes
    // already staged are committed by that scope's own settle. Inside an
    // effect callback flush() is a no-op for the same reason — direct writes
    // join the running pass's transaction, while a nested flush(fn) would
    // park them in a pass tx that is discarded.
  }
  return result
}
/**
 * Applies prop defaults the way Solid 1 `mergeProps` did: a prop present but
 * `undefined` falls through to the default. Solid 2's `merge` returns the
 * right-most source that defines the key — `merge({ gutter: 4 }, props)` reads
 * `undefined` when callers write `gutter={undefined}` — so components use this
 * proxy for their `merged` defaults instead. Reads still reach the source's
 * own getters, preserving per-prop laziness.
 */
export function mergeDefaults<T extends object, U extends object>(defaults: T, source: U): T & U {
  return new Proxy(source as T & U, {
    get(target, key, receiver) {
      const value = Reflect.get(target, key, receiver)
      return value === undefined && key in defaults ? defaults[key as keyof T] : value
    },
    has(target, key) {
      return key in target || key in defaults
    },
    getOwnPropertyDescriptor(target, key) {
      return (
        Reflect.getOwnPropertyDescriptor(target, key) ??
        Reflect.getOwnPropertyDescriptor(defaults, key)
      )
    },
    ownKeys(target) {
      return [...new Set([...Reflect.ownKeys(defaults), ...Reflect.ownKeys(target)])]
    },
  })
}
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
  const resolvedId = createMemo(() => {
    const id = deterministicId?.()

    // Return deterministic ID if provided
    if (id) {
      return id
    }

    // Fallback to auto-incrementing counter
    const resolvedPrefix = typeof prefix === 'function' ? prefix() : prefix
    return `${resolvedPrefix}-${uniqueId}`
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
 * View of `props` exposing only `keys`, each as a lazy getter — the picked counterpart
 * to `omit` (the `splitProps` picked half from 1.x).
 *
 * Presence is decided from property descriptors, never by reading values: `merge`
 * resolves shadowing by descriptor, so an accessor key (reactive getter) counts as
 * present without evaluating it — reading `props.children` during key collection
 * would re-render the tree. Only static data keys holding `undefined` are hidden.
 */
export function pick<T extends object, K extends ReadonlyArray<keyof T>>(
  props: T,
  ...keys: K
): Pick<T, K[number]> {
  const present = (key: keyof T): boolean => {
    if (!keys.includes(key)) {
      return false
    }
    const descriptor = Reflect.getOwnPropertyDescriptor(props, key)
    if (descriptor === undefined) {
      return key in props
    }
    return (
      Boolean(descriptor.enumerable) &&
      (descriptor.get !== undefined || descriptor.value !== undefined)
    )
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
      return keys.filter((key) => present(key)) as Array<string | symbol>
    },
  })
}

/**
 * `children(() => props.children)` resolved through the own `children` descriptor
 * rather than a props-view read: `pick`/`omit` proxies and dev-mode props track
 * key access, so a memo that reads `local.children` re-runs — and rebuilds the
 * subtree — on any unrelated prop change. The leaf getter keeps the memo
 * subscribed only to what the children thunk itself reads.
 */
export function resolvePropsChildren(props: {
  children?: JSX.Element
}): ReturnType<typeof resolveChildren> {
  const descriptor = Object.getOwnPropertyDescriptor(props, 'children')
  const resolved = resolveChildren(() =>
    descriptor === undefined
      ? undefined
      : descriptor.get !== undefined
        ? (descriptor.get.call(props) as JSX.Element)
        : (descriptor.value as JSX.Element),
  )
  const owner = getOwner()
  let pinned = false
  const accessor = (() => {
    const value = resolved()
    // Solid 2 disposes computations whose last subscriber unmounts, and the next
    // read re-invokes the children getter — recreating the subtree. Once any
    // binding reads the memo, pin it under the component owner so it stays
    // observed without evaluating it eagerly. The pin exists only on the client,
    // so it is transparent: it must not take a hydration id from the owner.
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
    return value
  }) as ReturnType<typeof resolveChildren>
  accessor.toArray = () => resolved.toArray()
  return accessor
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
