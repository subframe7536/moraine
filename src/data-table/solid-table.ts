/* oxlint-disable subf/solid-reactivity -- Adapts TanStack table-core reactivity to Solid signals and reactive props proxies. */
import { constructTable } from '@tanstack/table-core'
import type { RowData, Table, TableFeatures, TableOptions } from '@tanstack/table-core'
import type { TableAtomOptions, TableReactivityBindings } from '@tanstack/table-core/reactivity'
import {
  batch,
  createEffect,
  createMemo,
  createRoot,
  createSignal,
  getOwner,
  mergeProps,
  on,
  onCleanup,
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
  let disposed = false
  let dispose: (() => void) | undefined
  const unsubscribe = () => {
    disposed = true
    subscriptions.delete(unsubscribe)
    dispose?.()
  }
  subscriptions.add(unsubscribe)
  createRoot((d) => {
    dispose = d
    createEffect(
      on(
        signal,
        (val) => {
          if (!disposed) {
            cb(val)
          }
        },
        { defer: true },
      ),
    )
  })
  return { unsubscribe }
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
    batch,
    untrack,
    createReadonlyAtom: <T>(fn: () => T, options?: TableAtomOptions<T>): any => {
      const memo = createMemo(fn, undefined, {
        equals: options?.compare,
        name: options?.debugName,
      })
      return Object.assign(() => memo(), {
        get: () => memo(),
        subscribe: (observerOrFn: Observer<T>) =>
          subscribeToSignal(memo, observerOrFn, subscriptions),
      })
    },
    createWritableAtom: <T>(initialValue: T, options?: TableAtomOptions<T>): any => {
      const [signal, setSignal] = createSignal(initialValue, {
        equals: options?.compare,
        name: options?.debugName,
      })
      return Object.assign(() => signal(), {
        get: () => signal(),
        set: (updater: T | ((prev: T) => T)) => {
          if (typeof updater === 'function') {
            setSignal(updater as (prev: T) => T)
          } else {
            setSignal(() => updater)
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
 * directly to Solid's signals and `mergeProps` getters.
 */
export function createTable<TFeatures extends TableFeatures, TData extends RowData>(
  tableOptions: TableOptions<TFeatures, TData>,
): Table<TFeatures, TData> {
  const reactivity = createSolidReactivity()
  if (getOwner()) {
    onCleanup(reactivity.dispose)
  }
  const mergedOptions = mergeProps(tableOptions, {
    features: {
      coreReactivityFeature: reactivity,
      ...tableOptions.features,
    },
  })
  const resolvedOptions = mergeProps(
    {
      mergeOptions: (defaultOptions: any, options: any) => mergeProps(defaultOptions, options),
    },
    mergedOptions,
  )

  const table = constructTable(resolvedOptions as any) as unknown as Table<TFeatures, TData>

  // constructTable flattens options with object spread, resolving getters to static values.
  // Merging feature default options over the live `resolvedOptions` (a getter that resolves to
  // `undefined` must fall back to the feature default, not the stale snapshot) restores caller
  // reactive getters, and the `table.options` setter writes through optionsStore so every atom
  // memo re-runs once against the proxy and subscribes to the live getters.
  const featuresList = Object.values(table._features)
  const defaultOptions = featuresList.reduce((obj, feature) => {
    return Object.assign(obj, feature.getDefaultTableOptions?.(table))
  }, {} as any)

  ;(table as any).options = mergeProps(defaultOptions, resolvedOptions)

  return table
}
