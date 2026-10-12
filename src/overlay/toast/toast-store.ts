import type { JSX } from 'solid-js'
import { DEV } from 'solid-js'
import { createStore } from 'solid-js/store'

import { DEFAULT_TOAST_DURATION } from './toast.types'
import type { ToastT } from './toast.types'

const HISTORY_LIMIT = 100
const DEFAULT_HOST_KEY = ''

function isSameToastValue(first: unknown, second: unknown): boolean {
  if (typeof first === 'string' || typeof first === 'number') {
    if (typeof second === 'string' || typeof second === 'number') {
      return String(first) === String(second)
    }
    return false
  }
  return Object.is(first, second)
}

function isSameAction(first: unknown, second: unknown): boolean {
  if (first === second) {
    return true
  }
  if (
    typeof first === 'object' &&
    first !== null &&
    typeof second === 'object' &&
    second !== null &&
    'label' in first &&
    'label' in second
  ) {
    return isSameToastValue((first as ToastT.Action).label, (second as ToastT.Action).label)
  }
  return false
}

function isSameToastContent(first: ToastT.Item, second: Partial<ToastT.Item>): boolean {
  if (first.jsx !== undefined || second.jsx !== undefined) {
    return isSameToastValue(first.jsx, second.jsx)
  }

  const sameTitle = isSameToastValue(first.title, second.title)
  const sameDescription = isSameToastValue(first.description, second.description)
  const sameVariant = isSameToastValue(first.variant ?? 'default', second.variant ?? 'default')
  const sameAction =
    (first.action === undefined && second.action === undefined) ||
    isSameAction(first.action, second.action)
  const sameCancel =
    (first.cancel === undefined && second.cancel === undefined) ||
    isSameAction(first.cancel, second.cancel)

  return sameTitle && sameDescription && sameVariant && sameAction && sameCancel
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }
  if (typeof Node === 'function' && value instanceof Node) {
    return false
  }
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

function isToastOptions(value: unknown): value is ToastT.AddOptions {
  if (!isPlainObject(value)) {
    return false
  }
  // Solid compiled JSX is a plain object whose `t` field is the template function.
  return typeof value.t !== 'function'
}

export interface ToastStore {
  show: (message: JSX.Element | ToastT.AddOptions, options?: ToastT.AddOptions) => string | number
  success: (message: JSX.Element, options?: ToastT.AddOptions) => string | number
  error: (message: JSX.Element, options?: ToastT.AddOptions) => string | number
  warning: (message: JSX.Element, options?: ToastT.AddOptions) => string | number
  info: (message: JSX.Element, options?: ToastT.AddOptions) => string | number
  loading: (message: JSX.Element, options?: ToastT.AddOptions) => string | number
  promise: <T>(
    promiseValue: Promise<T> | (() => Promise<T>),
    options: ToastT.PromiseOptions<T>,
  ) => ToastT.PromiseReturn<T>
  custom: (
    render: (id: string | number) => JSX.Element,
    options?: ToastT.AddOptions,
  ) => string | number
  dismiss: (id?: string | number) => void
  remove: (id?: string | number) => void
  clear: () => void
  getToasts: () => ToastT.Item[]
  getHistory: () => ToastT.Item[]
  readonly toasts: ToastT.Item[]
  preventDuplicate: ToastT.PreventDuplicate
}

/** Host registration surface used by the Toast viewport. */
export interface ToastHostStore extends ToastStore {
  setHostPreventDuplicate: (
    hostId: string | undefined,
    value: ToastT.PreventDuplicate | undefined,
  ) => void
  registerHost: (hostId: string | undefined) => void
  unregisterHost: (hostId: string | undefined) => void
}

function matchesHostId(item: ToastT.Item, hostId: string | undefined): boolean {
  if (hostId) {
    return item.toastId === hostId
  }
  return !item.toastId
}

function splitPromiseOptions<T>(options: ToastT.PromiseOptions<T>): {
  loading: ToastT.PromiseOptions<T>['loading']
  success: ToastT.PromiseOptions<T>['success']
  error: ToastT.PromiseOptions<T>['error']
  onFinally: ToastT.PromiseOptions<T>['finally']
  description: ToastT.PromiseOptions<T>['description']
  duration: number | undefined
  itemOptions: ToastT.AddOptions
} {
  const {
    loading,
    success,
    error,
    finally: onFinally,
    description,
    duration,
    variant: _variant,
    ...itemOptions
  } = options
  return { loading, success, error, onFinally, description, duration, itemOptions }
}

/**
 * Creates an isolated reactive toast store instance.
 */
export function createToastStore(): ToastStore {
  const [store, setStore] = createStore<ToastT.Item[]>([])
  const history: ToastT.Item[] = []
  const hostPreventDuplicates = new Map<string, ToastT.PreventDuplicate>()
  const registeredHosts = new Map<string, number>()
  let counter = 1
  let defaultPreventDuplicate: ToastT.PreventDuplicate = false

  const hostKey = (hostId: string | undefined): string => hostId ?? DEFAULT_HOST_KEY

  const hasMatchingHost = (item: ToastT.Item): boolean => {
    return (registeredHosts.get(hostKey(item.toastId)) ?? 0) > 0
  }

  const setHostPreventDuplicate = (
    hostId: string | undefined,
    value: ToastT.PreventDuplicate | undefined,
  ): void => {
    const key = hostKey(hostId)
    if (value === undefined) {
      hostPreventDuplicates.delete(key)
      if (key === DEFAULT_HOST_KEY) {
        defaultPreventDuplicate = false
      }
      return
    }
    if (key === DEFAULT_HOST_KEY) {
      defaultPreventDuplicate = value
      return
    }
    if (value === false) {
      hostPreventDuplicates.delete(key)
      return
    }
    hostPreventDuplicates.set(key, value)
  }

  const registerHost = (hostId: string | undefined): void => {
    const key = hostKey(hostId)
    const next = (registeredHosts.get(key) ?? 0) + 1
    registeredHosts.set(key, next)
    if (DEV && next > 1) {
      console.warn(
        hostId
          ? `[moraine] Duplicate <Toast id="${hostId}" />. Each Toast host id must be unique.`
          : '[moraine] Duplicate <Toast /> without id. Mount one default host, or give each instance an id.',
      )
    }
  }

  const unregisterHost = (hostId: string | undefined): void => {
    const key = hostKey(hostId)
    const next = (registeredHosts.get(key) ?? 0) - 1
    if (next <= 0) {
      registeredHosts.delete(key)
    } else {
      registeredHosts.set(key, next)
    }
  }

  const recordHistory = (item: ToastT.Item): void => {
    history.push({ ...item })
    if (history.length > HISTORY_LIMIT) {
      history.splice(0, history.length - HISTORY_LIMIT)
    }
  }

  const nextId = (): number => {
    let id = counter
    while (store.some((t) => t.id === id)) {
      id += 1
    }
    counter = id + 1
    return id
  }

  const show = (
    message: JSX.Element | ToastT.AddOptions,
    options?: ToastT.AddOptions,
  ): string | number => {
    let resolvedOptions: ToastT.AddOptions = options ?? {}
    let resolvedTitle: JSX.Element | (() => JSX.Element) | undefined

    if (isToastOptions(message)) {
      resolvedOptions = { ...message, ...options }
      resolvedTitle = resolvedOptions.title
    } else {
      resolvedTitle = (message as JSX.Element | (() => JSX.Element)) ?? resolvedOptions.title
    }

    const id = resolvedOptions.id !== undefined ? resolvedOptions.id : nextId()
    const preventOption =
      resolvedOptions.preventDuplicate !== undefined
        ? resolvedOptions.preventDuplicate
        : resolvedOptions.toastId
          ? (hostPreventDuplicates.get(resolvedOptions.toastId) ?? false)
          : defaultPreventDuplicate

    if (preventOption && resolvedOptions.id === undefined) {
      const candidate: Partial<ToastT.Item> = {
        title: resolvedTitle,
        description: resolvedOptions.description,
        variant: resolvedOptions.variant ?? 'default',
        toastId: resolvedOptions.toastId,
        placement: resolvedOptions.placement,
        align: resolvedOptions.align,
        action: resolvedOptions.action,
        cancel: resolvedOptions.cancel,
        jsx: resolvedOptions.jsx,
      }

      const targetPlacement = candidate.placement ?? 'bottom'
      const targetAlign = candidate.align ?? 'end'

      const frontIndex = store.findIndex((t) => {
        if (t.dismissed) {
          return false
        }
        if (candidate.toastId ? t.toastId !== candidate.toastId : Boolean(t.toastId)) {
          return false
        }
        const tPlacement = t.placement ?? 'bottom'
        const tAlign = t.align ?? 'end'
        return tPlacement === targetPlacement && tAlign === targetAlign
      })

      if (frontIndex !== -1) {
        const frontToast = store[frontIndex]!
        const isDuplicate =
          typeof preventOption === 'function'
            ? preventOption(candidate, frontToast)
            : isSameToastContent(frontToast, candidate)

        if (isDuplicate) {
          setStore(frontIndex, 'bumpKey', (k) => (k ?? 0) + 1)
          return frontToast.id
        }
      }
    }

    let publishedItem: ToastT.Item | undefined
    const existingIndex = store.findIndex((t) => t.id === id)
    const toastItem: ToastT.Item = {
      dismissible: true,
      variant: 'default',
      ...resolvedOptions,
      id,
      title: resolvedTitle,
      dismissed: false,
      bumpKey: 0,
    }

    if (existingIndex !== -1) {
      setStore(existingIndex, (prev) => ({
        ...prev,
        ...toastItem,
        bumpKey: (prev.bumpKey ?? 0) + 1,
      }))
      publishedItem = store[existingIndex]
    } else {
      setStore((prev) => [toastItem, ...prev])
      publishedItem = toastItem
    }

    if (publishedItem) {
      recordHistory(publishedItem)
    }

    return id
  }

  const success = (message: JSX.Element, options?: ToastT.AddOptions) =>
    show(message, { ...options, variant: 'success' })

  const error = (message: JSX.Element, options?: ToastT.AddOptions) =>
    show(message, { ...options, variant: 'error' })

  const warning = (message: JSX.Element, options?: ToastT.AddOptions) =>
    show(message, { ...options, variant: 'warning' })

  const info = (message: JSX.Element, options?: ToastT.AddOptions) =>
    show(message, { ...options, variant: 'info' })

  const loading = (message: JSX.Element, options?: ToastT.AddOptions) =>
    show(message, {
      ...options,
      variant: 'loading',
      duration: options?.duration ?? Number.POSITIVE_INFINITY,
    })

  const custom = (
    render: (id: string | number) => JSX.Element,
    options?: ToastT.AddOptions,
  ): string | number => {
    return show(undefined, {
      ...options,
      jsx: (id: string | number) => render(id),
    })
  }

  const dismiss = (id?: string | number): void => {
    // Mutate dismissed in place so Solid <For> keeps the same item identity and
    // ToastItem can play its exit transition. Replacing the object remounts the
    // item already-dismissed and skips the animation.
    const orphanIds: Array<string | number> = []

    for (let i = 0; i < store.length; i++) {
      const item = store[i]!
      if (id !== undefined && item.id !== id) {
        continue
      }
      if (!hasMatchingHost(item)) {
        orphanIds.push(item.id)
        continue
      }
      if (!item.dismissed) {
        setStore(i, 'dismissed', true)
      }
    }

    if (orphanIds.length > 0) {
      const orphanSet = new Set(orphanIds)
      setStore((prev) => prev.filter((item) => !orphanSet.has(item.id)))
    }
  }

  const remove = (id?: string | number): void => {
    if (id !== undefined) {
      setStore((prev) => prev.filter((t) => t.id !== id))
    } else {
      setStore([])
    }
  }

  const clear = (): void => {
    setStore([])
    history.length = 0
  }

  const promise = <T>(
    promiseValue: Promise<T> | (() => Promise<T>),
    options: ToastT.PromiseOptions<T>,
  ): ToastT.PromiseReturn<T> => {
    const {
      loading: loadingMessage,
      success: successMessage,
      error: errorMessage,
      onFinally,
      description,
      duration,
      itemOptions,
    } = splitPromiseOptions(options)

    let id: string | number | undefined

    if (loadingMessage !== undefined) {
      id = loading(typeof loadingMessage === 'function' ? loadingMessage() : loadingMessage, {
        ...itemOptions,
        description: typeof description !== 'function' ? description : undefined,
      })
    } else {
      id = options.id ?? nextId()
    }

    const actualPromise = Promise.resolve(
      typeof promiseValue === 'function' ? promiseValue() : promiseValue,
    )

    let result: ['resolve', T] | ['reject', unknown]

    const resolvePayload = async (variant: ToastT.Variant, handler: unknown, param: unknown) => {
      const title = typeof handler === 'function' ? await handler(param) : handler
      const resolvedDescription =
        typeof description === 'function' ? description(param) : description

      show(title as JSX.Element, {
        ...itemOptions,
        id,
        variant,
        description: resolvedDescription,
        duration: duration ?? DEFAULT_TOAST_DURATION,
      })
    }

    const settleWithoutHandler = () => {
      if (id !== undefined) {
        dismiss(id)
      }
    }

    const originalPromise = actualPromise
      // oxlint-disable-next-line subf/solid-reactivity -- Promise resolution executes outside component rendering.
      .then(async (response) => {
        result = ['resolve', response]
        if (response instanceof Error) {
          if (errorMessage !== undefined) {
            await resolvePayload('error', errorMessage, response)
          } else {
            settleWithoutHandler()
          }
          return
        }

        if (successMessage !== undefined) {
          await resolvePayload('success', successMessage, response)
        } else {
          settleWithoutHandler()
        }
      })
      // oxlint-disable-next-line subf/solid-reactivity -- Promise rejection executes outside component rendering.
      .catch(async (errorValue) => {
        result = ['reject', errorValue]
        if (errorMessage !== undefined) {
          await resolvePayload('error', errorMessage, errorValue)
        } else {
          settleWithoutHandler()
        }
      })
      .finally(() => {
        if (onFinally) {
          void onFinally()
        }
      })

    const unwrap = () =>
      new Promise<T>((resolve, reject) => {
        originalPromise
          .then(() => {
            if (result[0] === 'reject') {
              reject(result[1])
            } else {
              resolve(result[1])
            }
          })
          .catch(reject)
      })

    const returnId = (id ?? nextId()) as ToastT.PromiseReturn<T>
    return Object.assign(returnId, { unwrap })
  }

  const getToasts = (): ToastT.Item[] => {
    return store.filter((t) => !t.dismissed)
  }

  const getHistory = (): ToastT.Item[] => history

  const manager: ToastHostStore = {
    show,
    success,
    error,
    warning,
    info,
    loading,
    promise,
    custom,
    dismiss,
    remove,
    clear,
    getToasts,
    getHistory,
    get toasts() {
      return store
    },
    get preventDuplicate() {
      return defaultPreventDuplicate
    },
    set preventDuplicate(val: ToastT.PreventDuplicate) {
      defaultPreventDuplicate = val
    },
    setHostPreventDuplicate,
    registerHost,
    unregisterHost,
  }
  return manager
}

let defaultStore: ToastHostStore | undefined

export function getDefaultToastStore(): ToastHostStore {
  if (!defaultStore) {
    defaultStore = createToastStore() as ToastHostStore
  }
  return defaultStore
}

export { matchesHostId }
