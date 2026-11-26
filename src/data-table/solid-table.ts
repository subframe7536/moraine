import { isServer } from '@solidjs/web'
import { constructTable } from '@tanstack/table-core'
import type { RowData, Table, TableFeatures, TableOptions } from '@tanstack/table-core'
import type { TableAtomOptions, TableReactivityBindings } from '@tanstack/table-core/reactivity'
import {
  createEffect,
  createMemo,
  createRoot,
  createSignal,
  getOwner,
  isHydrating,
  merge,
  onCleanup,
  onHydrationEnd,
  untrack,
} from 'solid-js'

/**
 * Lightweight Solid-native signal subscription without relying on `observable`.
 * `defer: true` aligns with `@tanstack/store` subscription semantics, notifying
 * subscribers on subsequent changes rather than immediately upon registration.
 */
type Observer<T> = ((val: T) => void) | { next?: (val: T) => void }

function subscribeToSignal<T>(
  signal: () => T,
  observerOrFn: Observer<T>,
  subscriptions: Set<() => void>,
): { unsubscribe: () => void } {
  const cb =
    typeof observerOrFn === 'function' ? observerOrFn : observerOrFn?.next?.bind(observerOrFn)
  if (!cb) {
    return { unsubscribe: () => {} }
  }
  let dispose: (() => void) | undefined
  const unsubscribe = () => {
    subscriptions.delete(unsubscribe)
    dispose?.()
  }
  subscriptions.add(unsubscribe)
  // Transparent owners keep subscription bookkeeping out of the hydration id
  // namespace — the server never subscribes, so a non-transparent root here
  // would shift the client owner tree relative to the server markup.
  createRoot(
    (d) => {
      dispose = d
      createEffect(
        signal,
        (val) => {
          cb(val)
        },
        { defer: true, transparent: true },
      )
    },
    { transparent: true },
  )
  return { unsubscribe }
}

/**
 * Merges default options with reactive overrides while preserving `undefined` fallback semantics.
 * Solid 2's `merge()` treats explicit `undefined` getters as overrides, so this helper falls back
 * to `defaults[key]` whenever `overrides[key]` evaluates to `undefined`.
 */
function mergeWithDefaults(
  defaults: Record<string, unknown>,
  overrides: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  const keys = new Set([...Object.keys(defaults), ...Object.keys(overrides)])
  for (const key of keys) {
    Object.defineProperty(result, key, {
      enumerable: true,
      configurable: true,
      get() {
        const value = overrides[key]
        return value !== undefined ? value : defaults[key]
      },
    })
  }
  return result
}

/**
 * Framework reactivity bindings for table-core without observable or createComputed.
 * `dispose` tears down every subscription table-core has not already unsubscribed.
 */
export function createSolidReactivity(): TableReactivityBindings & { dispose: () => void } {
  const subscriptions = new Set<() => void>()
  const dispose = () => {
    for (const unsubscribe of subscriptions) {
      unsubscribe()
    }
  }

  return {
    dispose,
    createOptionsStore: true,
    wrapExternalAtoms: false,
    schedule: (fn: () => void) => queueMicrotask(fn),
    batch: (fn: () => void) => fn(),
    untrack,
    createReadonlyAtom: <T>(fn: () => T, options?: TableAtomOptions<T>) => {
      const memo = createMemo(fn, {
        equals: options?.compare,
        name: options?.debugName,
      })
      // Returned function is a reactive accessor wrapper for TanStack Table atoms.
      // oxlint-disable-next-line subf/solid-reactivity
      return Object.assign(() => memo(), {
        get: () => memo(),
        subscribe: (observerOrFn: Observer<T>) =>
          subscribeToSignal(memo, observerOrFn, subscriptions),
      })
    },
    createWritableAtom: <T>(initialValue: T, options?: TableAtomOptions<T>) => {
      type Value = Exclude<T, (...args: Array<never>) => unknown>
      const signalOptions = {
        equals: options?.compare,
        name: options?.debugName,
        ...(options?.debugName === 'table/optionsStore' ||
        options?.debugName?.startsWith('table/baseAtoms/')
          ? { ownedWrite: true }
          : {}),
      }
      const [signal, setSignal] = createSignal<Value>(
        (typeof initialValue === 'function' ? () => initialValue as Value : initialValue) as never,
        signalOptions,
      )
      // Returned function is a reactive accessor wrapper for TanStack Table atoms.
      // oxlint-disable-next-line subf/solid-reactivity
      return Object.assign(() => signal(), {
        get: () => signal(),
        set: (updater: T | ((prev: T) => T)) => {
          if (typeof updater === 'function') {
            setSignal(updater as (prev: Value) => Value)
          } else {
            setSignal(() => updater as Value)
          }
        },
        subscribe: (observerOrFn: Observer<T>) =>
          subscribeToSignal(signal, observerOrFn, subscriptions),
      })
    },
    addSubscription: () => {},
    unmount: dispose,
  }
}

/**
 * Creates a reactive Solid table instance from table-core.
 * Avoids `createComputed` and `observable` entirely by delegating reactivity
 * directly to Solid's signals and live option getters.
 */
export function createTable<TFeatures extends TableFeatures, TData extends RowData>(
  tableOptions: TableOptions<TFeatures, TData>,
): Table<TFeatures, TData> {
  const reactivity = createSolidReactivity()
  if (getOwner()) {
    onCleanup(reactivity.dispose)
  }
  const mergedOptions = merge(tableOptions, {
    features: {
      coreReactivityFeature: reactivity,
      ...tableOptions.features,
    },
  })
  const resolvedOptions = merge(
    {
      mergeOptions: mergeWithDefaults,
    },
    mergedOptions,
  )

  // constructTable flattens options with object spread, resolving getters to static values.
  // That construction snapshot is deliberate and untracked: folding the merged feature defaults
  // and live `resolvedOptions` getters onto that same object below restores caller reactivity
  // (a getter that resolves to `undefined` falls back to the feature default, not the stale
  // snapshot) without notifying optionsStore subscribers.
  // The `table.options` setter write is still issued so internal atom memos that computed
  // against the static snapshot re-run once and subscribe to the live getters — during
  // hydration it is deferred to `onHydrationEnd` so claimed DOM nodes are not invalidated.
  const hydrating = isHydrating()
  return untrack(() => {
    const table = constructTable(resolvedOptions as unknown as TableOptions<TFeatures, TData>)
    const defaultOptions = Object.values(table._features).reduce<Record<string, unknown>>(
      (obj, feature) => {
        return Object.assign(obj, feature.getDefaultTableOptions?.(table))
      },
      {},
    )

    const liveOptions = mergeWithDefaults(defaultOptions, resolvedOptions)
    const mutableTable = table as unknown as { options: Record<string, unknown> }
    Object.defineProperties(mutableTable.options, Object.getOwnPropertyDescriptors(liveOptions))
    if (hydrating) {
      let active = true
      if (getOwner()) {
        onCleanup(() => {
          active = false
        })
      }
      onHydrationEnd(() => {
        if (active) {
          mutableTable.options = liveOptions
        }
      })
    } else if (!isServer) {
      mutableTable.options = liveOptions
    }
    return table
  })
}
