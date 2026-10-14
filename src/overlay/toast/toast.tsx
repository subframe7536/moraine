import type { JSX } from 'solid-js'
import { createEffect, createMemo, createSignal, For, on, onCleanup, splitProps } from 'solid-js'
import { Portal, isServer } from 'solid-js/web'

import { useRecipe } from '../../provider'
import { useMessages } from '../../provider/locale/locale-context'
import { createEventListener, createEventListenerMap } from '../../shared/event-listener'
import { inertFeedbackHandle } from '../base/feedback/handle'

import { ToastList } from './toast-list'
import { getDefaultToastStore, resolveToastOptions } from './toast-store'
import type { ToastHost, ToastHostDefaults } from './toast-store'
import { defaultToastMessages } from './toast.messages'
import { toastRecipe } from './toast.recipe'
import { DEFAULT_TOAST_GAP } from './toast.types'
import type { ToastProps, ToastT } from './toast.types'

function showToast(options: ToastT.Options, render?: ToastT.Render): ToastT.Handle {
  if (isServer) {
    return inertFeedbackHandle(options.id)
  }
  return getDefaultToastStore().add(options, render)
}

function withType(type: ToastT.Type, options: ToastT.Options): ToastT.Options {
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
    'close',
    'progress',
    'expand',
    'preventDuplicate',
    'gap',
    'aria-label',
    'classes',
    'styles',
    'class',
    'style',
  ])
  const messages = useMessages('toast', defaultToastMessages)
  const store = getDefaultToastStore()
  const [isWindowFocused, setIsWindowFocused] = createSignal(true)
  const [isDocumentHidden, setIsDocumentHidden] = createSignal(false)
  const [heights, setHeights] = createSignal<Record<string | number, number>>({})

  const defaults = (): ToastHostDefaults => ({
    type: local.type ?? undefined,
    large: local.large,
    invert: local.invert,
    placement: local.placement ?? undefined,
    align: local.align ?? undefined,
    duration: local.duration,
    close: local.close,
    progress: local.progress,
    preventDuplicate: local.preventDuplicate,
    classes: local.classes,
    styles: local.styles,
  })
  const controller: ToastHost = {
    id: () => local.id,
    defaults,
  }

  const { slots } = useRecipe(toastRecipe, props, {
    slot: 'root',
    varsSlot: 'root',
    contextVariants: () => ({
      placement: local.placement ?? 'bottom',
      align: local.align ?? 'end',
      large: local.large ?? false,
      type: local.type ?? 'default',
    }),
    contextSlots: () => ({
      classes: local.classes,
      styles: local.styles,
    }),
  })

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
  const activeToasts = createMemo(() => filteredToasts().filter((toast) => !toast.closed))
  const hasToasts = () => activeToasts().length > 0

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

  const defaultPlacement = () => local.placement ?? 'bottom'
  const defaultAlign = () => local.align ?? 'end'
  const defaultKey = () => `${defaultPlacement()}-${defaultAlign()}`
  const possiblePositions = createMemo(() => {
    const activePositions = filteredToasts().map((toast) => {
      const options = resolveToastOptions(toast.options, defaults())
      return `${options.placement}-${options.align}`
    })
    return Array.from(new Set([defaultKey(), ...activePositions]))
  })

  const updateHeight = (id: string | number, height: number) => {
    setHeights((prev) => {
      if (height <= 0) {
        const next = { ...prev }
        delete next[id]
        return next
      }
      return { ...prev, [id]: height }
    })
  }

  const viewportAriaLabel = () => local['aria-label'] ?? messages().viewport

  return (
    <Portal>
      <section
        data-slot="toast"
        role="region"
        tabIndex={-1}
        {...rest}
        aria-live="polite"
        aria-relevant="additions text"
        aria-atomic="false"
        aria-label={viewportAriaLabel()}
        {...slots.root}
      >
        <For each={possiblePositions()}>
          {(positionKey) => (
            <ToastList
              positionKey={positionKey}
              filteredToasts={filteredToasts}
              host={defaults}
              expand={local.expand}
              hostPaused={() => isDocumentHidden() || !isWindowFocused()}
              heights={heights}
              gapSize={() => local.gap ?? DEFAULT_TOAST_GAP}
              visibleToasts={local.visibleToasts ?? 3}
              itemRender={local.itemRender}
              onHeight={updateHeight}
              requestClose={(id, reason) => store.close(id, reason)}
              onRemove={(id) => store.remove(id)}
              onUpdate={(id, options) => store.update(id, options)}
              onBump={(listener) => store.onBump(listener)}
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
  custom: (render: ToastT.Render, options?: ToastT.Options) => ToastT.Handle
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
