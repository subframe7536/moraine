import { isServer } from '@solidjs/web'
import { constructTable } from '@tanstack/table-core'
import type { RowData, Table, TableFeatures, TableOptions } from '@tanstack/table-core'
import type { TableAtomOptions, TableReactivityBindings } from '@tanstack/table-core/reactivity'
import {
  createEffect,
  createMemo,
  createRoot,
  createSignal,
  flush,
  getOwner,
  isHydrating,
  merge,
  onCleanup,
  untrack,
} from 'solid-js'

import { settle } from '../shared/utils'
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
  // Transparent owners keep subscription bookkeeping out of the hydration id
  // namespace — the server never subscribes, so a non-transparent root here
  // would shift the client owner tree relative to the server markup.
  createRoot(
    (d) => {
      dispose = d
      createEffect(
        signal,
        (val) => {
          // Subscriber callbacks are notification-time snapshots: table-core
          // re-reads sibling atoms inside `cb`, which must not subscribe.
          if (!disposed) {
            untrack(() => cb(val))
          }
        },
        { defer: true, transparent: true },
      )
    },
    { transparent: true },
  )
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
    batch: flush,
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
      const [signal, setSignal] = createSignal<Exclude<T, (...args: Array<never>) => unknown>>(
        () => initialValue as Exclude<T, (...args: Array<never>) => unknown>,
        {
          equals: options?.compare,
          name: options?.debugName,
          ownedWrite: true,
        },
      )
      // Returned function is a reactive accessor wrapper for TanStack Table atoms.
      // oxlint-disable-next-line subf/solid-reactivity
      return Object.assign(() => signal(), {
        get: () => signal(),
        set: (updater: T | ((prev: T) => T)) => {
          // Table-core mutators run unowned; settle so the write is visible to
          // the table's derived memos before the caller reads them back.
          settle(() => {
            if (typeof updater === 'function') {
              setSignal(
                updater as (
                  prev: Exclude<T, (...args: Array<never>) => unknown>,
                ) => Exclude<T, (...args: Array<never>) => unknown>,
              )
            } else {
              setSignal(() => updater as Exclude<T, (...args: Array<never>) => unknown>)
            }
          })
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
 * directly to Solid's signals and `merge` getters.
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
      mergeOptions: (defaultOptions: Record<string, unknown>, options: Record<string, unknown>) =>
        merge(defaultOptions, options),
    },
    mergedOptions,
  )

  // constructTable flattens options with object spread, resolving getters to static values.
  // That construction snapshot is deliberate and untracked: folding the merged feature defaults
  // and live `resolvedOptions` getters onto that same object below restores caller reactivity
  // (a getter that resolves to `undefined` falls back to the feature default, not the stale
  // snapshot) without notifying optionsStore subscribers.
  // The `table.options` setter write is still issued so internal atom memos that computed
  // against the static snapshot re-run once and subscribe to the live getters — but during
  // hydration the staged write commits after subscribers have claimed DOM and its
  // invalidation discards the claimed nodes, so it is deferred past the claim.
  const hydrating = isHydrating()
  return untrack(() => {
    const table = constructTable(resolvedOptions as unknown as TableOptions<TFeatures, TData>)
    const defaultOptions = Object.values(table._features).reduce<Record<string, unknown>>(
      (obj, feature) => {
        return Object.assign(obj, feature.getDefaultTableOptions?.(table))
      },
      {},
    )

    const liveOptions = merge(defaultOptions, resolvedOptions)
    const mutableTable = table as unknown as { options: Record<string, unknown> }
    Object.defineProperties(mutableTable.options, Object.getOwnPropertyDescriptors(liveOptions))
    if (hydrating) {
      queueMicrotask(() => {
        mutableTable.options = liveOptions
      })
    } else if (!isServer) {
      mutableTable.options = liveOptions
    }
    return table
  })
}
