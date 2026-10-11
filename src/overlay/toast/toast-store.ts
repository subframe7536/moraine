import type { JSX } from 'solid-js'
import { createStore } from 'solid-js/store'

import type { ToasterT } from './toaster.types'

function isSameToastValue(first: unknown, second: unknown): boolean {
  if (typeof first === 'string' || typeof first === 'number') {
    if (typeof second === 'string' || typeof second === 'number') {
      return String(first) === String(second)
    }
    return false
  }
  return Object.is(first, second)
}

function isSameToastContent(first: ToasterT.Item, second: Partial<ToasterT.Item>): boolean {
  return (
    isSameToastValue(first.title, second.title) &&
    isSameToastValue(first.description, second.description) &&
    isSameToastValue(first.variant, second.variant) &&
    first.toasterId === second.toasterId &&
    first.placement === second.placement &&
    first.align === second.align
  )
}

export interface ToastStore {
  (message: JSX.Element | ToasterT.AddOptions, options?: ToasterT.AddOptions): string | number
  add: (
    message: JSX.Element | ToasterT.AddOptions,
    options?: ToasterT.AddOptions,
  ) => string | number
  success: (message: JSX.Element, options?: ToasterT.AddOptions) => string | number
  error: (message: JSX.Element, options?: ToasterT.AddOptions) => string | number
  warning: (message: JSX.Element, options?: ToasterT.AddOptions) => string | number
  info: (message: JSX.Element, options?: ToasterT.AddOptions) => string | number
  loading: (message: JSX.Element, options?: ToasterT.AddOptions) => string | number
  promise: <T>(
    promiseValue: Promise<T> | (() => Promise<T>),
    options: ToasterT.PromiseOptions<T>,
  ) => ToasterT.PromiseReturn<T>
  custom: (
    render: (id: string | number) => JSX.Element,
    options?: ToasterT.AddOptions,
  ) => string | number
  dismiss: (id?: string | number) => void
  remove: (id?: string | number) => void
  clear: () => void
  getToasts: () => ToasterT.Item[]
  getHistory: () => ToasterT.Item[]
  subscribe: (subscriber: (toast: ToasterT.Item) => void) => () => void
  readonly toasts: ToasterT.Item[]
  preventDuplicate: boolean
}

/**
 * Creates an isolated reactive toast store instance.
 */
export function createToastStore(): ToastStore {
  const [store, setStore] = createStore<ToasterT.Item[]>([])
  const subscribers: Array<(toast: ToasterT.Item) => void> = []
  const history: ToasterT.Item[] = []
  let counter = 1
  let defaultPreventDuplicate = false

  const publish = (toastItem: ToasterT.Item): void => {
    subscribers.forEach((subscriber) => subscriber(toastItem))
  }

  const subscribe = (subscriber: (toastItem: ToasterT.Item) => void) => {
    subscribers.push(subscriber)
    return () => {
      const index = subscribers.indexOf(subscriber)
      if (index !== -1) {
        subscribers.splice(index, 1)
      }
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

  const add = (
    message: JSX.Element | ToasterT.AddOptions,
    options?: ToasterT.AddOptions,
  ): string | number => {
    let resolvedOptions: ToasterT.AddOptions = options ?? {}
    let resolvedTitle: JSX.Element | (() => JSX.Element) | undefined

    if (
      typeof message === 'object' &&
      message !== null &&
      !('t' in (message as any)) &&
      ('title' in (message as any) ||
        'description' in (message as any) ||
        'variant' in (message as any) ||
        'id' in (message as any) ||
        'jsx' in (message as any))
    ) {
      resolvedOptions = { ...(message as ToasterT.AddOptions), ...options }
      resolvedTitle = resolvedOptions.title
    } else {
      resolvedTitle = (message as JSX.Element | (() => JSX.Element)) ?? resolvedOptions.title
    }

    const id = resolvedOptions.id !== undefined ? resolvedOptions.id : nextId()
    const shouldPreventDuplicate = resolvedOptions.preventDuplicate ?? defaultPreventDuplicate

    if (shouldPreventDuplicate && resolvedOptions.id === undefined) {
      const candidate: Partial<ToasterT.Item> = {
        title: resolvedTitle,
        description: resolvedOptions.description,
        variant: resolvedOptions.variant ?? 'default',
        toasterId: resolvedOptions.toasterId,
        placement: resolvedOptions.placement,
        align: resolvedOptions.align,
      }

      const existingIndex = store.findIndex((t) => !t.dismissed && isSameToastContent(t, candidate))
      if (existingIndex !== -1) {
        const existing = store[existingIndex]!
        setStore(existingIndex, 'bumpKey', (k) => (k ?? 0) + 1)
        return existing.id
      }
    }

    let publishedItem: ToasterT.Item | undefined
    const existingIndex = store.findIndex((t) => t.id === id)
    const toastItem: ToasterT.Item = {
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
      history.push({ ...publishedItem })
      publish(publishedItem)
    }

    return id
  }

  const success = (message: JSX.Element, options?: ToasterT.AddOptions) =>
    add(message, { ...options, variant: 'success' })

  const error = (message: JSX.Element, options?: ToasterT.AddOptions) =>
    add(message, { ...options, variant: 'error' })

  const warning = (message: JSX.Element, options?: ToasterT.AddOptions) =>
    add(message, { ...options, variant: 'warning' })

  const info = (message: JSX.Element, options?: ToasterT.AddOptions) =>
    add(message, { ...options, variant: 'info' })

  const loading = (message: JSX.Element, options?: ToasterT.AddOptions) =>
    add(message, {
      ...options,
      variant: 'loading',
      duration: options?.duration ?? Number.POSITIVE_INFINITY,
    })

  const custom = (
    render: (id: string | number) => JSX.Element,
    options?: ToasterT.AddOptions,
  ): string | number => {
    const id = options?.id ?? nextId()
    add(undefined, { ...options, id, jsx: () => render(id) })
    return id
  }

  const promise = <T>(
    promiseValue: Promise<T> | (() => Promise<T>),
    options: ToasterT.PromiseOptions<T>,
  ): ToasterT.PromiseReturn<T> => {
    let id: string | number | undefined

    if (options.loading !== undefined) {
      id = loading(typeof options.loading === 'function' ? options.loading() : options.loading, {
        ...options,
        description: typeof options.description !== 'function' ? options.description : undefined,
      })
    } else {
      id = options.id ?? nextId()
    }

    const actualPromise = Promise.resolve(
      typeof promiseValue === 'function' ? promiseValue() : promiseValue,
    )

    let result: ['resolve', T] | ['reject', unknown]

    const resolvePayload = async (variant: ToasterT.Variant, handler: unknown, param: unknown) => {
      const title = typeof handler === 'function' ? await handler(param) : handler
      const description =
        typeof options.description === 'function' ? options.description(param) : options.description

      add(title as JSX.Element, {
        ...options,
        id,
        variant,
        description,
        duration: options.duration ?? 4000,
      })
    }

    const originalPromise = actualPromise
      // oxlint-disable-next-line subf/solid-reactivity -- Promise resolution executes outside component rendering.
      .then(async (response) => {
        result = ['resolve', response]
        if (response instanceof Error) {
          if (options.error !== undefined) {
            await resolvePayload('error', options.error, response)
          }
          return
        }

        if (options.success !== undefined) {
          await resolvePayload('success', options.success, response)
        }
      })
      // oxlint-disable-next-line subf/solid-reactivity -- Promise rejection executes outside component rendering.
      .catch(async (errorValue) => {
        result = ['reject', errorValue]
        if (options.error !== undefined) {
          await resolvePayload('error', options.error, errorValue)
        }
      })
      .finally(() => {
        const onFinally = options.finally
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

    const returnId = (id ?? nextId()) as any
    return Object.assign(returnId, { unwrap })
  }

  const dismiss = (id?: string | number): void => {
    if (id !== undefined) {
      setStore((t) => t.id === id, 'dismissed', true)
    } else {
      setStore(() => true, 'dismissed', true)
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
    remove()
  }

  const getToasts = (): ToasterT.Item[] => {
    return store.filter((t) => !t.dismissed)
  }

  const getHistory = (): ToasterT.Item[] => history

  // oxlint-disable-next-line subf/solid-reactivity -- Manager callable forwards to imperative add method.
  const manager = ((message: JSX.Element | ToasterT.AddOptions, options?: ToasterT.AddOptions) =>
    add(message, options)) as ToastStore

  Object.defineProperties(manager, {
    add: { value: add, writable: true, configurable: true },
    success: { value: success, writable: true, configurable: true },
    error: { value: error, writable: true, configurable: true },
    warning: { value: warning, writable: true, configurable: true },
    info: { value: info, writable: true, configurable: true },
    loading: { value: loading, writable: true, configurable: true },
    promise: { value: promise, writable: true, configurable: true },
    custom: { value: custom, writable: true, configurable: true },
    dismiss: { value: dismiss, writable: true, configurable: true },
    remove: { value: remove, writable: true, configurable: true },
    clear: { value: clear, writable: true, configurable: true },
    getToasts: { value: getToasts, writable: true, configurable: true },
    getHistory: { value: getHistory, writable: true, configurable: true },
    subscribe: { value: subscribe, writable: true, configurable: true },
    toasts: {
      get() {
        return store
      },
      configurable: true,
    },
    preventDuplicate: {
      get() {
        return defaultPreventDuplicate
      },
      set(val: boolean) {
        defaultPreventDuplicate = val
      },
      configurable: true,
    },
  })

  return manager
}

/** Global toast singleton. */
export const toast: ToastStore = createToastStore()
