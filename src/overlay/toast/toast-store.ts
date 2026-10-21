import type { Component, JSX } from 'solid-js'
import { createStore, produce } from 'solid-js/store'

import type { FeedbackCloseReason } from '../base/feedback/feedback.types'
import { createCloseResult } from '../base/feedback/handle'
import { createHostRegistry } from '../base/feedback/host-registry'
import type { FeedbackHost, HostRegistry } from '../base/feedback/host-registry'
import { mergeDefined, pickDefined } from '../base/feedback/merge-defined'

import type { ToastT } from './toast.types'

export interface ToastHostDefaults {
  type?: ToastT.Variants['type'] | null
  large?: ToastT.Variants['large'] | null
  invert?: ToastT.Variants['invert'] | null
  placement?: ToastT.Variants['placement'] | null
  align?: ToastT.Variants['align'] | null
  duration?: number
  closable?: boolean
  progress?: boolean
  preventDuplicate?: boolean
  class?: ToastT.Options['class']
  classes?: ToastT.Classes
  style?: ToastT.Options['style']
  styles?: ToastT.Styles
}

export interface ToastHost extends FeedbackHost {
  readonly defaults: ToastHostDefaults
}

export interface ToastRecord {
  id: ToastT.Id
  hostId: string | undefined
  options: ToastT.Options
  render?: JSX.Element | Component<ToastT.ItemRenderProps>
  closed?: boolean
}

interface ToastSession {
  handle: ToastT.Handle
  settle: (reason: FeedbackCloseReason) => boolean
  onClose?: (reason: FeedbackCloseReason) => void
}

function mergeSlots<T extends object>(
  fallback: T | undefined,
  override: T | undefined,
): T | undefined {
  if (fallback === undefined) {
    return override
  }
  if (override === undefined) {
    return fallback
  }
  return mergeDefined(fallback, override)
}

export function resolveToastOptions(call: ToastT.Options, host: ToastHostDefaults): ToastT.Options {
  return {
    id: call.id,
    host: call.host,
    get title() {
      return call.title
    },
    get description() {
      return call.description
    },
    get icon() {
      return call.icon
    },
    get action() {
      return call.action
    },
    get cancel() {
      return call.cancel
    },
    onClose: call.onClose,
    type: call.type ?? host.type ?? 'default',
    large: call.large ?? host.large ?? undefined,
    invert: call.invert ?? host.invert ?? undefined,
    placement: call.placement ?? host.placement ?? 'bottom',
    align: call.align ?? host.align ?? 'end',
    duration: pickDefined(call.duration, host.duration),
    closable: pickDefined(call.closable, host.closable),
    progress: pickDefined(call.progress, host.progress),
    preventDuplicate: pickDefined(call.preventDuplicate, host.preventDuplicate),
    class: pickDefined(call.class, host.class),
    classes: mergeSlots(host.classes, call.classes),
    style: pickDefined(call.style, host.style),
    styles: mergeSlots(host.styles, call.styles),
  }
}

function isSameToastValue(first: unknown, second: unknown): boolean {
  if (typeof first === 'string' || typeof first === 'number') {
    if (typeof second === 'string' || typeof second === 'number') {
      return String(first) === String(second)
    }
    return false
  }
  return Object.is(first, second)
}

function isSameAction(
  first: ToastT.Action | boolean | undefined,
  second: ToastT.Action | boolean | undefined,
): boolean {
  if (first === second) {
    return true
  }
  if (!first || !second || typeof first === 'boolean' || typeof second === 'boolean') {
    return first === second
  }
  return (
    isSameToastValue(first.label, second.label) &&
    isSameToastValue(first.variant, second.variant) &&
    isSameToastValue(first.leading, second.leading)
  )
}

function isSameToastContent(first: ToastT.Options, second: ToastT.Options): boolean {
  return (
    isSameToastValue(first.title, second.title) &&
    isSameToastValue(first.description, second.description) &&
    (first.type ?? 'default') === (second.type ?? 'default') &&
    isSameAction(first.action, second.action) &&
    isSameAction(first.cancel, second.cancel)
  )
}

export interface ToastStore {
  readonly toasts: ToastRecord[]
  registry: HostRegistry<ToastHost>
  add: (
    options: ToastT.Options,
    render?: JSX.Element | Component<ToastT.ItemRenderProps>,
  ) => ToastT.Handle
  update: (id: ToastT.Id, options: ToastT.UpdateOptions) => void
  close: (id: ToastT.Id | undefined, reason?: FeedbackCloseReason) => void
  remove: (id: ToastT.Id) => void
  abandonHost: (hostId: string | undefined) => void
  onBump: (listener: (id: ToastT.Id) => void) => () => void
}

export function createToastStore(): ToastStore {
  const registry = createHostRegistry<ToastHost>('Toast')
  const [toasts, setToasts] = createStore<ToastRecord[]>([])
  const sessions = new Map<ToastT.Id, ToastSession>()
  const bumpListeners = new Set<(id: ToastT.Id) => void>()
  let counter = 1

  const triggerBump = (id: ToastT.Id): void => {
    bumpListeners.forEach((listener) => listener(id))
  }

  const nextId = (): number => {
    let id = counter
    while (toasts.some((item) => item.id === id)) {
      id += 1
    }
    counter = id + 1
    return id
  }

  const hostMounted = (hostId: string | undefined): boolean =>
    registry.entries().some((host) => host.id() === hostId)

  const update = (id: ToastT.Id, options: ToastT.UpdateOptions): void => {
    let found = false
    setToasts(
      produce((draft) => {
        const item = draft.find((entry) => entry.id === id)
        if (!item || item.closed) {
          return
        }
        found = true
        item.options = mergeDefined(item.options, options)
        const session = sessions.get(id)
        if (session && options.onClose) {
          session.onClose = options.onClose
        }
      }),
    )
    if (found) {
      triggerBump(id)
    }
  }

  const remove = (id: ToastT.Id): void => {
    setToasts(
      produce((draft) => {
        const index = draft.findIndex((item) => item.id === id)
        if (index !== -1) {
          draft.splice(index, 1)
        }
      }),
    )
  }

  const close = (id: ToastT.Id | undefined, reason: FeedbackCloseReason = 'api'): void => {
    const targets = toasts.filter((item) => id === undefined || item.id === id)
    for (const item of targets) {
      const session = sessions.get(item.id)
      const didSettle = session?.settle(reason) ?? false
      if (didSettle) {
        session?.onClose?.(reason)
      }
      if (!hostMounted(item.hostId)) {
        remove(item.id)
        continue
      }
      setToasts(
        produce((draft) => {
          const match = draft.find((entry) => entry.id === item.id)
          if (match && !match.closed) {
            match.closed = true
          }
        }),
      )
    }
  }

  const createHandle = (id: ToastT.Id, onClose: ToastT.Options['onClose']): ToastT.Handle => {
    const result = createCloseResult()
    const handle: ToastT.Handle = {
      id,
      update: (options) => update(id, options),
      close: () => close(id, 'api'),
      result: result.result,
    }
    sessions.set(id, { handle, settle: result.settle, onClose })
    return handle
  }

  const abandonHost = (hostId: string | undefined): void => {
    if (registry.entries().some((host) => host.id() === hostId)) {
      return
    }
    const ids = toasts.filter((item) => item.hostId === hostId).map((item) => item.id)
    for (const id of ids) {
      const session = sessions.get(id)
      if (session?.settle('api')) {
        session.onClose?.('api')
      }
      sessions.delete(id)
      remove(id)
    }
  }

  const add = (
    options: ToastT.Options,
    render?: JSX.Element | Component<ToastT.ItemRenderProps>,
  ): ToastT.Handle => {
    const host = registry.require(options.host)
    const hostId = host.id()
    const defaults = host.defaults
    const id = options.id !== undefined ? options.id : nextId()

    if (options.id !== undefined) {
      const existing = toasts.find((item) => item.id === id)
      const session = sessions.get(id)
      if (existing && session) {
        if (!existing.closed) {
          update(id, options)
          return session.handle
        }
        remove(id)
        sessions.delete(id)
      }
    }

    const prevent = options.preventDuplicate ?? defaults.preventDuplicate ?? false
    if (prevent && options.id === undefined) {
      const candidate = resolveToastOptions(options, defaults)
      const front = toasts.find((item) => {
        if (item.closed || item.hostId !== hostId) {
          return false
        }
        const resolved = resolveToastOptions(item.options, defaults)
        return resolved.placement === candidate.placement && resolved.align === candidate.align
      })
      if (front && isSameToastContent(resolveToastOptions(front.options, defaults), candidate)) {
        triggerBump(front.id)
        return sessions.get(front.id)!.handle
      }
    }

    const record: ToastRecord = {
      id,
      hostId,
      options: { ...options, id },
      render,
      closed: false,
    }
    const handle = createHandle(id, options.onClose)
    setToasts(produce((draft) => draft.unshift(record)))
    return handle
  }

  return {
    get toasts() {
      return toasts
    },
    registry,
    add,
    update,
    close,
    remove,
    abandonHost,
    onBump: (listener) => {
      bumpListeners.add(listener)
      return () => {
        bumpListeners.delete(listener)
      }
    },
  }
}

let defaultStore: ToastStore | undefined

export function getDefaultToastStore(): ToastStore {
  if (!defaultStore) {
    defaultStore = createToastStore()
  }
  return defaultStore
}
