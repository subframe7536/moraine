import type { JSX } from 'solid-js'
import { DEV } from 'solid-js'
import { createStore, produce } from 'solid-js/store'

import { DEFAULT_TOAST_DURATION } from './toast.types'
import type { ToastItemRecord, ToastT } from './toast.types'

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
    const a = first as ToastT.Action
    const b = second as ToastT.Action
    return (
      isSameToastValue(a.label, b.label) &&
      isSameToastValue(a.variant, b.variant) &&
      isSameToastValue(a.size, b.size) &&
      isSameToastValue(a.activeEffect, b.activeEffect)
    )
  }
  return false
}

function isSameToastContent(first: ToastItemRecord, second: Partial<ToastItemRecord>): boolean {
  if (first.jsx !== undefined || second.jsx !== undefined) {
    return isSameToastValue(first.jsx, second.jsx)
  }

  const sameTitle = isSameToastValue(first.title, second.title)
  const sameDescription = isSameToastValue(first.description, second.description)
  const sameVariant = isSameToastValue(
    first.variants?.variant ?? 'default',
    second.variants?.variant ?? 'default',
  )
  const sameAction =
    (first.action === undefined && second.action === undefined) ||
    isSameAction(first.action, second.action)
  const sameCancel =
    (first.cancel === undefined && second.cancel === undefined) ||
    isSameAction(first.cancel, second.cancel)

  return sameTitle && sameDescription && sameVariant && sameAction && sameCancel
}

export interface ToastStore {
  readonly toasts: ToastItemRecord[]
  add: (options: ToastT.InitOptions) => string | number
  loading: (options: ToastT.InitOptions) => string | number
  promise: <T>(
    promiseValue: Promise<T> | (() => Promise<T>),
    options: ToastT.PromiseOptions<T>,
  ) => ToastT.PromiseReturn<T>
  custom: (
    render: (id: string | number) => JSX.Element,
    options?: ToastT.InitOptions,
  ) => string | number
  update: (id: string | number, options: ToastT.UpdateOptions) => string | number
  close: (id?: string | number) => void
  onBump: (listener: (id: string | number) => void) => () => void
  preventDuplicate: ToastT.PreventDuplicate
  setHostPreventDuplicate: (
    hostId: string | undefined,
    value: ToastT.PreventDuplicate | undefined,
  ) => void
  registerHost: (hostId: string | undefined) => void
  unregisterHost: (hostId: string | undefined) => void
}

export function matchesHostId(item: ToastItemRecord, hostId: string | undefined): boolean {
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
  itemOptions: ToastT.InitOptions
} {
  const {
    loading,
    success,
    error,
    finally: onFinally,
    description,
    duration,
    ...itemOptions
  } = options
  return { loading, success, error, onFinally, description, duration, itemOptions }
}

/**
 * Creates an isolated reactive toast store instance.
 */
export function createToastStore(): ToastStore {
  const [store, setStore] = createStore<ToastItemRecord[]>([])
  const hostPreventDuplicates = new Map<string, ToastT.PreventDuplicate>()
  const registeredHosts = new Map<string, number>()
  const bumpListeners = new Set<(id: string | number) => void>()
  let counter = 1
  let defaultPreventDuplicate: ToastT.PreventDuplicate = false

  const hostKey = (hostId: string | undefined): string => hostId ?? DEFAULT_HOST_KEY

  const hasMatchingHost = (item: ToastItemRecord): boolean => {
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

  const nextId = (): number => {
    let id = counter
    while (store.some((t) => t.id === id)) {
      id += 1
    }
    counter = id + 1
    return id
  }

  const triggerBump = (id: string | number): void => {
    bumpListeners.forEach((fn) => fn(id))
  }

  const onBump = (listener: (id: string | number) => void): (() => void) => {
    bumpListeners.add(listener)
    return () => {
      bumpListeners.delete(listener)
    }
  }

  const add = (options: ToastT.InitOptions): string | number => {
    const id = options.id !== undefined ? options.id : nextId()
    const preventOption =
      options.preventDuplicate !== undefined
        ? options.preventDuplicate
        : options.toastId
          ? (hostPreventDuplicates.get(options.toastId) ?? false)
          : defaultPreventDuplicate

    if (preventOption && options.id === undefined) {
      const targetPlacement = options.variants?.placement ?? 'bottom'
      const targetAlign = options.variants?.align ?? 'end'

      const frontIndex = store.findIndex((t) => {
        if (t.closed) {
          return false
        }
        if (options.toastId ? t.toastId !== options.toastId : Boolean(t.toastId)) {
          return false
        }
        const tPlacement = t.variants?.placement ?? 'bottom'
        const tAlign = t.variants?.align ?? 'end'
        return tPlacement === targetPlacement && tAlign === targetAlign
      })

      if (frontIndex !== -1) {
        const frontToast = store[frontIndex]!
        const isDuplicate =
          typeof preventOption === 'function'
            ? preventOption(options, frontToast)
            : isSameToastContent(frontToast, options)

        if (isDuplicate) {
          triggerBump(frontToast.id)
          return frontToast.id
        }
      }
    }

    const toastItem: ToastItemRecord = {
      ...options,
      id,
    }

    let isExisting = false
    setStore(
      produce((draft) => {
        const item = draft.find((t) => t.id === id)
        if (item) {
          isExisting = true
          Object.assign(item, toastItem)
        } else {
          draft.unshift(toastItem)
        }
      }),
    )

    if (isExisting) {
      triggerBump(id)
    }

    return id
  }

  const loading = (options: ToastT.InitOptions) =>
    add({
      ...options,
      variants: {
        variant: 'loading',
        ...options.variants,
      },
      duration: options.duration ?? Number.POSITIVE_INFINITY,
    })

  const update = (id: string | number, options: ToastT.UpdateOptions): string | number => {
    let found = false
    setStore(
      produce((draft) => {
        const item = draft.find((t) => t.id === id)
        if (item) {
          found = true
          const mergedVariants =
            options.variants || item.variants
              ? { ...item.variants, ...options.variants }
              : undefined
          Object.assign(item, {
            ...options,
            ...(mergedVariants ? { variants: mergedVariants } : {}),
          })
        }
      }),
    )
    if (found) {
      triggerBump(id)
    }
    return id
  }

  const custom = (
    render: (id: string | number) => JSX.Element,
    options?: ToastT.InitOptions,
  ): string | number => {
    return add({
      ...options,
      jsx: render,
    } as ToastItemRecord)
  }

  const close = (id?: string | number): void => {
    setStore(
      produce((draft) => {
        for (let i = draft.length - 1; i >= 0; i--) {
          const item = draft[i]!
          if (id !== undefined && item.id !== id) {
            continue
          }
          if (!hasMatchingHost(item) || item.closed) {
            draft.splice(i, 1)
          } else {
            item.closed = true
          }
        }
      }),
    )
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
      id = loading({
        ...itemOptions,
        title: loadingMessage,
        description: typeof description !== 'function' ? description : undefined,
      })
    } else {
      id = options.id ?? nextId()
    }

    const actualPromise = Promise.resolve(
      typeof promiseValue === 'function' ? promiseValue() : promiseValue,
    )

    let result: ['resolve', T] | ['reject', unknown]

    const resolvePayload = async (
      variant: NonNullable<ToastT.Variants['variant']>,
      handler: unknown,
      param: unknown,
    ) => {
      const title = typeof handler === 'function' ? await handler(param) : handler
      const resolvedDescription =
        typeof description === 'function' ? description(param) : description

      add({
        ...itemOptions,
        id,
        variants: {
          ...itemOptions.variants,
          variant,
        },
        title: title as JSX.Element,
        description: resolvedDescription,
        duration: duration ?? DEFAULT_TOAST_DURATION,
      })
    }

    const settleWithoutHandler = () => {
      if (id !== undefined) {
        close(id)
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

  return {
    add,
    loading,
    promise,
    custom,
    update,
    close,
    onBump,
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
}

let defaultStore: ToastStore | undefined

export function getDefaultToastStore(): ToastStore {
  if (!defaultStore) {
    defaultStore = createToastStore()
  }
  return defaultStore
}
