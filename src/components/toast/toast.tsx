import type { JSX } from '@solidjs/web'
import { Portal, isServer } from '@solidjs/web'
import type { Component } from 'solid-js'
import { createEffect, createMemo, createSignal, For, omit, createStore } from 'solid-js'

import { useRecipe } from '../../provider'
import { useMessages } from '../../provider/locale/locale-context'
import { attachEventListener, attachEventListenerMap } from '../../shared/event-listener'
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
 * Notification host. Trigger toasts with `Toast.show`, `Toast.success`, and the other static
 * methods.
 */
function ToastRoot(props: ToastProps): JSX.Element {
  const rest = omit(
    props,
    'id',
    'placement',
    'align',
    'size',
    'type',
    'variant',
    'itemRender',
    'maxVisible',
    'duration',
    'closable',
    'progress',
    'expanded',
    'preventDuplicate',
    'gap',
    'aria-label',
    'classes',
    'styles',
    'class',
    'style',
    'translations',
  )
  const messages = useMessages('toast', defaultToastMessages, () => props.translations)
  const store = getDefaultToastStore()
  const [isWindowFocused, setIsWindowFocused] = createSignal(true)
  const [isDocumentHidden, setIsDocumentHidden] = createSignal(false)
  const [heights, setHeights] = createStore<Record<string | number, number>>({})

  const hostDefaults = createMemo<ToastHostDefaults>(() => ({
    type: props.type,
    size: props.size,
    variant: props.variant,
    placement: props.placement,
    align: props.align,
    duration: props.duration,
    closable: props.closable,
    progress: props.progress,
    preventDuplicate: props.preventDuplicate,
    classes: props.classes,
    styles: props.styles,
    translations: props.translations,
  }))
  const controller: ToastHost = {
    id: () => props.id,
    get defaults() {
      return hostDefaults()
    },
  }

  const {
    slots: { root: rootSlot },
  } = useRecipe(toastRecipe, props)

  createEffect(
    () => props.id,
    (id) => {
      const unregister = store.registry.register(controller)
      return () => {
        unregister()
        store.abandonHost(id)
      }
    },
  )

  const filteredToasts = createMemo(() => store.toasts.filter((toast) => toast.hostId === props.id))
  const hasToasts = () => filteredToasts().some((toast) => !toast.closed)

  createEffect(hasToasts, (active) => {
    if (!active) {
      return
    }
    setIsWindowFocused(document.hasFocus())
    setIsDocumentHidden(document.hidden)
    const detachWindow = attachEventListenerMap(window, {
      focus: () => setIsWindowFocused(true),
      blur: () => setIsWindowFocused(false),
    })
    const detachVisibility = attachEventListener(document, 'visibilitychange', () =>
      setIsDocumentHidden(document.hidden),
    )
    return () => {
      setIsWindowFocused(true)
      setIsDocumentHidden(false)
      detachWindow()
      detachVisibility()
    }
  })

  const possiblePositions = createMemo(() => {
    const defaultKey = `${props.placement ?? 'bottom'}-${props.align ?? 'end'}`
    const activePositions = filteredToasts().map((toast) => {
      const options = resolveToastOptions(toast.options, hostDefaults())
      return `${options.placement}-${options.align}`
    })
    return Array.from(new Set([defaultKey, ...activePositions]))
  })

  const updateHeight = (id: string | number, height: number) => {
    if (height <= 0) {
      if (heights[id] !== undefined) {
        setHeights((draft) => {
          delete draft[id]
        })
      }
      return
    }
    if (heights[id] !== height) {
      setHeights((draft) => {
        draft[id] = height
      })
    }
  }

  return (
    <Portal>
      <section
        data-slot="toast"
        role="region"
        tabindex={-1}
        {...rootSlot}
        {...rest}
        aria-live="polite"
        aria-relevant="additions text"
        aria-atomic="false"
        aria-label={props['aria-label'] ?? messages().label}
      >
        <For each={possiblePositions()}>
          {(positionKey) => (
            <ToastList
              positionKey={positionKey}
              filteredToasts={filteredToasts()}
              host={hostDefaults()}
              store={store}
              expanded={props.expanded}
              hostPaused={isDocumentHidden() || !isWindowFocused()}
              heights={heights}
              gap={props.gap ?? DEFAULT_TOAST_GAP}
              maxVisible={props.maxVisible ?? 3}
              itemRender={props.itemRender}
              onHeight={updateHeight}
            />
          )}
        </For>
      </section>
    </Portal>
  )
}

/**
 * Host for imperative notifications, not a composable toast: it has no trigger or content parts.
 * Mount `<Toast />` once; it holds no open state and renders a portaled `role="region"` live region. Open toasts from event handlers with the static
 * methods (`Toast.show`, `Toast.success`, `Toast.promise`, `Toast.update`, `Toast.close`), which
 * return a handle. Use `Toast` for temporary feedback that stays in the page and `AlertDialog`
 * when the next step should wait for an explicit choice. A call before the host is mounted
 * throws, and on the server it returns an inert handle.
 *
 * @example
 * ```tsx
 * import { Button, Toast } from 'moraine'
 *
 * <>
 *   <Button
 *     onClick={() =>
 *       Toast.success({
 *         title: 'Preferences saved',
 *         description: 'Your changes are now live.',
 *         action: {
 *           label: 'Undo',
 *           onClick: () => {
 *             Toast.info({ title: 'Reverted' })
 *           },
 *         },
 *       })
 *     }
 *   >
 *     Save
 *   </Button>
 *   <Toast placement="top" />
 * </>
 * ```
 */
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
Toast.promise = <T,>(value: Promise<T> | (() => Promise<T>), options: ToastT.PromiseOptions<T>) => {
  const handle = Toast.loading(options.loading ?? {})
  const task = new Promise<T>((resolve) => {
    resolve(typeof value === 'function' ? value() : value)
  })
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
