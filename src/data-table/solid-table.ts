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
  mergeProps,
  on,
  untrack,
} from 'solid-js'

/**
 * Lightweight Solid-native signal subscription without relying on `observable`.
 * `defer: true` aligns with `@tanstack/store` subscription semantics, notifying
 * subscribers on subsequent changes rather than immediately upon registration.
 */
function subscribeToSignal<T>(
  signal: () => T,
  observerOrFn: ((val: T) => void) | { next?: (val: T) => void },
): { unsubscribe: () => void } {
  const cb =
    typeof observerOrFn === 'function' ? observerOrFn : observerOrFn?.next?.bind(observerOrFn)
  if (!cb) {
    return { unsubscribe: () => {} }
  }
  let disposed = false
  let dispose: (() => void) | undefined
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
  return {
    unsubscribe: () => {
      disposed = true
      dispose?.()
    },
  }
}

/** Framework reactivity bindings for table-core without observable or createComputed. */
export function createSolidReactivity(): TableReactivityBindings {
  return {
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
        subscribe: (observerOrFn: any) => subscribeToSignal(memo, observerOrFn),
      })
    },
    createWritableAtom: <T>(initialValue: T, options?: TableAtomOptions<T>): any => {
      const [signal, setSignal] = createSignal(initialValue, {
        equals: options?.compare,
        name: options?.debugName,
      })
      return Object.assign(() => signal(), {
        get: () => signal(),
        set: (updater: any) => {
          if (typeof updater === 'function') {
            setSignal(updater)
          } else {
            setSignal(() => updater)
          }
        },
        subscribe: (observerOrFn: any) => subscribeToSignal(signal, observerOrFn),
      })
    },
    addSubscription: () => {},
    unmount: () => {},
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
