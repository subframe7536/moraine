import type { Component, JSX } from 'solid-js'
import { createEffect, createMemo, createSignal, For, on, onCleanup, splitProps } from 'solid-js'
import { createStore, produce } from 'solid-js/store'
import { Portal, isServer } from 'solid-js/web'

import { useRecipe } from '../../provider'
import { useMessages } from '../../provider/locale/locale-context'
import { createEventListener, createEventListenerMap } from '../../shared/event-listener'
import { inertFeedbackHandle } from '../shared/overlay/feedback/handle'

import { ToastList } from './toast-list'
import { getDefaultToastStore, resolveToastOptions } from './toast-store'
import type { ToastHost, ToastHostDefaults } from './toast-store'
import { defaultToastMessages } from './toast.messages'
import { toastRecipe } from './toast.recipe'
import { DEFAULT_TOAST_GAP } from './toast.types'
import type { ToastProps, ToastT } from './toast.types'

function showToast(
  options: ToastT.Options,
  render?: JSX.Element | Component<ToastT.ItemRenderProps>,
): ToastT.Handle {
  if (isServer) {
    return inertFeedbackHandle(options.id)
  }
  return getDefaultToastStore().add(options, render)
}

function withType(type: ToastT.Variants['type'], options: ToastT.Options): ToastT.Options {
  return { ...options, type }
}

/**
 * Notification host. Trigger toasts with `Toast.show`, `Toast.success`, and the other static methods.
 */
function ToastRoot(props: ToastProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'id',
    'placement',
    'align',
    'large',
    'type',
    'invert',
    'itemRender',
    'visibleToasts',
    'duration',
    'closable',
    'progress',
    'expand',
    'preventDuplicate',
    'gap',
    'aria-label',
    'classes',
    'styles',
    'class',
    'style',
    'translations',
  ])
  const messages = useMessages('toast', defaultToastMessages, () => local.translations)
  const store = getDefaultToastStore()
  const [isWindowFocused, setIsWindowFocused] = createSignal(true)
  const [isDocumentHidden, setIsDocumentHidden] = createSignal(false)
  const [heights, setHeights] = createStore<Record<string | number, number>>({})

  const hostDefaults = createMemo<ToastHostDefaults>(() => ({
    type: local.type,
    large: local.large,
    invert: local.invert,
    placement: local.placement,
    align: local.align,
    duration: local.duration,
    closable: local.closable,
    progress: local.progress,
    preventDuplicate: local.preventDuplicate,
    classes: local.classes,
    styles: local.styles,
    translations: local.translations,
  }))
  const controller: ToastHost = {
    id: () => local.id,
    get defaults() {
      return hostDefaults()
    },
  }

  const {
    slots: { root: rootSlot },
  } = useRecipe(toastRecipe, local)

  createEffect(
    on(
      () => local.id,
      (id) => {
        const unregister = store.registry.register(controller)
        onCleanup(() => {
          unregister()
          store.abandonHost(id)
        })
      },
    ),
  )

  const filteredToasts = createMemo(() => store.toasts.filter((toast) => toast.hostId === local.id))
  const hasToasts = () => filteredToasts().some((toast) => !toast.closed)

  createEffect(
    on(hasToasts, (active) => {
      if (!active) {
        return
      }
      setIsWindowFocused(document.hasFocus())
      setIsDocumentHidden(document.hidden)
      onCleanup(() => {
        setIsWindowFocused(true)
        setIsDocumentHidden(false)
      })
      createEventListenerMap(window, {
        focus: () => setIsWindowFocused(true),
        blur: () => setIsWindowFocused(false),
      })
      createEventListener(document, 'visibilitychange', () => setIsDocumentHidden(document.hidden))
    }),
  )

  const possiblePositions = createMemo(() => {
    const defaultKey = `${local.placement ?? 'bottom'}-${local.align ?? 'end'}`
    const activePositions = filteredToasts().map((toast) => {
      const options = resolveToastOptions(toast.options, hostDefaults())
      return `${options.placement}-${options.align}`
    })
    return Array.from(new Set([defaultKey, ...activePositions]))
  })

  const updateHeight = (id: string | number, height: number) => {
    if (height <= 0) {
      if (heights[id] !== undefined) {
        setHeights(produce((draft) => delete draft[id]))
      }
      return
    }
    if (heights[id] !== height) {
      setHeights(produce((draft) => (draft[id] = height)))
    }
  }

  return (
    <Portal>
      <section
        data-slot="toast"
        role="region"
        tabIndex={-1}
        {...rootSlot}
        {...rest}
        aria-live="polite"
        aria-relevant="additions text"
        aria-atomic="false"
        aria-label={local['aria-label'] ?? messages().viewport}
      >
        <For each={possiblePositions()}>
          {(positionKey) => (
            <ToastList
              positionKey={positionKey}
              filteredToasts={filteredToasts()}
              host={hostDefaults()}
              store={store}
              expand={local.expand}
              hostPaused={isDocumentHidden() || !isWindowFocused()}
              heights={heights}
              gap={local.gap ?? DEFAULT_TOAST_GAP}
              visibleToasts={local.visibleToasts ?? 3}
              itemRender={local.itemRender}
              onHeight={updateHeight}
            />
          )}
        </For>
      </section>
    </Portal>
  )
}

export const Toast = ToastRoot as typeof ToastRoot & {
  show: (options: ToastT.Options) => ToastT.Handle
  info: (options: ToastT.Options) => ToastT.Handle
  success: (options: ToastT.Options) => ToastT.Handle
  warning: (options: ToastT.Options) => ToastT.Handle
  error: (options: ToastT.Options) => ToastT.Handle
  loading: (options: ToastT.Options) => ToastT.Handle
  promise: <T>(
    value: Promise<T> | (() => Promise<T>),
    options: ToastT.PromiseOptions<T>,
  ) => ToastT.Handle
  custom: {
    (render: Component<ToastT.ItemRenderProps>, options?: ToastT.Options): ToastT.Handle
    (render: JSX.Element, options?: ToastT.Options): ToastT.Handle
  }
  update: (id: ToastT.Id, options: ToastT.UpdateOptions) => void
  close: (id?: ToastT.Id) => void
}

Toast.show = (options) => showToast(options)
Toast.info = (options) => showToast(withType('info', options))
Toast.success = (options) => showToast(withType('success', options))
Toast.warning = (options) => showToast(withType('warning', options))
Toast.error = (options) => showToast(withType('error', options))
Toast.loading = (options) => showToast(withType('loading', options))
Toast.promise = (value, options) => {
  const handle = Toast.loading(options.loading ?? {})
  const task = Promise.resolve(typeof value === 'function' ? value() : value)
  void task.then(
    (data) => {
      const next = typeof options.success === 'function' ? options.success(data) : options.success
      if (next === undefined) {
        handle.close()
        return
      }
      handle.update({ type: 'success', ...next })
    },
    (error: unknown) => {
      const next = typeof options.error === 'function' ? options.error(error) : options.error
      if (next === undefined) {
        handle.close()
        return
      }
      handle.update({ type: 'error', ...next })
    },
  )
  return handle
}
Toast.custom = (render, options) => showToast(options ?? {}, render)
Toast.update = (id, options) => {
  if (isServer) {
    return
  }
  getDefaultToastStore().update(id, options)
}
Toast.close = (id) => {
  if (isServer) {
    return
  }
  getDefaultToastStore().close(id, 'api')
}
