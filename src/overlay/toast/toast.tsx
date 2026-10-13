import type { JSX } from 'solid-js'
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  onCleanup,
  Show,
  splitProps,
} from 'solid-js'
import { Portal } from 'solid-js/web'

import { createStyles } from '../../provider'
import { useMessages } from '../../provider/locale/locale-context'
import { createEventListener, createEventListenerMap } from '../../shared/event-listener'
import type { OverlayAlign } from '../../theme/style-types'

import { ToastItem } from './toast-item'
import { getDefaultToastStore, matchesHostId } from './toast-store'
import type { ToastStore } from './toast-store'
import { defaultToastMessages } from './toast.messages'
import { toastDataAttributes, toastRecipe } from './toast.recipe'
import { DEFAULT_TOAST_GAP } from './toast.types'
import type { ToastItemRecord, ToastProps, ToastT } from './toast.types'

function hostStore(store: ToastStore | undefined): ToastStore {
  return store ?? getDefaultToastStore()
}

/**
 * Notification host. Trigger toasts with `Toast.show`, `Toast.success`, and other static methods.
 */
function ToastRoot(props: ToastProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'id',
    'placement',
    'align',
    'large',
    'type',
    'itemRender',
    'visibleToasts',
    'duration',
    'close',
    'showProgress',
    'expand',
    'preventDuplicate',
    'invert',
    'gap',
    'aria-label',
    'store',
    'classes',
    'styles',
    'class',
    'style',
  ])

  const messages = useMessages('toast', defaultToastMessages)
  const store = () => hostStore(local.store)
  const [isWindowFocused, setIsWindowFocused] = createSignal(true)
  const [isDocumentHidden, setIsDocumentHidden] = createSignal(false)
  const [heights, setHeights] = createSignal<Record<string | number, number>>({})

  const resolved = createStyles(toastRecipe, props, {
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
      () => [local.id, local.preventDuplicate] as const,
      ([id, val]) => {
        if (val === undefined) {
          return
        }
        store().setHostPreventDuplicate?.(id, val)
        onCleanup(() => {
          store().setHostPreventDuplicate?.(id, undefined)
        })
      },
    ),
  )

  createEffect(
    on(
      () => local.id,
      (id) => {
        store().registerHost?.(id)
        onCleanup(() => {
          store().unregisterHost?.(id)
        })
      },
    ),
  )

  const filteredToasts = createMemo(() => {
    return store().toasts.filter((t) => matchesHostId(t, local.id))
  })

  const activeToasts = createMemo(() => filteredToasts().filter((t) => !t.closed))

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
    const activePositions = filteredToasts()
      .filter((t) => t.variants?.placement || t.variants?.align)
      .map(
        (t) =>
          `${t.variants?.placement ?? defaultPlacement()}-${t.variants?.align ?? defaultAlign()}`,
      )

    return Array.from(new Set([defaultKey(), ...activePositions]))
  })

  const updateHeight = (id: string | number, h: number) => {
    setHeights((prev) => {
      if (h <= 0) {
        const next = { ...prev }
        delete next[id]
        return next
      }
      return { ...prev, [id]: h }
    })
  }

  const gapSize = () => local.gap ?? DEFAULT_TOAST_GAP
  const hostPaused = () => isDocumentHidden() || !isWindowFocused()

  const viewportAriaLabel = () =>
    local['aria-label'] ??
    (typeof messages().viewport === 'function'
      ? (messages().viewport as unknown as () => string)()
      : messages().viewport)

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
        {...resolved.slots.root}
      >
        <For each={possiblePositions()}>
          {(positionKey) => (
            <ToastList
              positionKey={positionKey}
              filteredToasts={filteredToasts}
              defaultPlacement={defaultPlacement}
              defaultAlign={defaultAlign}
              expand={local.expand}
              hostPaused={hostPaused}
              heights={heights}
              gapSize={gapSize}
              visibleToasts={local.visibleToasts ?? 3}
              close={local.close}
              showProgress={local.showProgress}
              invert={local.invert}
              large={local.large}
              itemRender={local.itemRender}
              classes={local.classes}
              styles={local.styles}
              duration={local.duration}
              onHeight={updateHeight}
              onClose={(id) => store().close(id)}
              onBump={(listener) => store().onBump(listener)}
            />
          )}
        </For>
      </section>
    </Portal>
  )
}

interface ToastListProps {
  positionKey: string
  filteredToasts: () => ToastItemRecord[]
  defaultPlacement: () => ToastT.Placement
  defaultAlign: () => OverlayAlign
  expand?: boolean
  hostPaused: () => boolean
  heights: () => Record<string | number, number>
  gapSize: () => number
  visibleToasts: number
  close?: ToastT.Action | JSX.Element
  showProgress?: boolean
  invert?: boolean | null
  large?: boolean | null
  itemRender?: (props: ToastT.ItemRenderProps) => JSX.Element
  classes?: ToastT.Classes
  styles?: ToastT.Styles
  duration?: number
  onHeight: (id: string | number, height: number) => void
  onClose: (id: string | number) => void
  onBump?: (listener: (id: string | number) => void) => () => void
}

function ToastList(props: ToastListProps): JSX.Element {
  const [isHovered, setIsHovered] = createSignal(false)
  const [isInteracting, setIsInteracting] = createSignal(false)

  const placement = () => props.positionKey.split('-')[0] as ToastT.Placement
  const align = () => props.positionKey.split('-')[1] as OverlayAlign

  const activeGroupToasts = createMemo(() => {
    return props.filteredToasts().filter((t) => {
      const p = t.variants?.placement ?? props.defaultPlacement()
      const a = t.variants?.align ?? props.defaultAlign()
      return `${p}-${a}` === props.positionKey
    })
  })

  const layoutExpanded = () => Boolean(props.expand) || isHovered()
  const timerPaused = () => isHovered() || isInteracting() || props.hostPaused()

  const frontmostHeight = createMemo(() => {
    const currentHeights = props.heights()
    for (const t of activeGroupToasts()) {
      const h = currentHeights[t.id]
      if (h && h > 0) {
        return h
      }
    }
    return 0
  })

  // Expanded Y offset per index: prefix sum of earlier heights plus gaps, computed once per group.
  const offsets = createMemo(() => {
    const currentHeights = props.heights()
    const gap = props.gapSize()
    const result: number[] = []
    let total = 0
    for (const t of activeGroupToasts()) {
      result.push(total)
      total += (currentHeights[t.id] ?? 0) + gap
    }
    return result
  })

  const listHeight = createMemo(() => {
    const toasts = activeGroupToasts()
    if (toasts.length === 0) {
      return 0
    }
    const count = Math.min(toasts.length, props.visibleToasts)
    const gap = props.gapSize()
    const frontH = frontmostHeight() || 58

    if (!layoutExpanded()) {
      return frontH + (count > 1 ? (count - 1) * gap : 0)
    }

    let totalH = 0
    for (let i = 0; i < count; i++) {
      const t = toasts[i]
      const h = (t ? props.heights()[t.id] : 0) || frontH
      totalH += h
    }
    return totalH + (count > 1 ? (count - 1) * gap : 0)
  })

  const resolved = createStyles(
    toastRecipe,
    {},
    {
      slot: 'list',
      varsSlot: 'list',
      contextVariants: () => ({
        placement: placement(),
        align: align(),
      }),
      contextSlots: () => ({
        classes: props.classes,
        styles: props.styles,
      }),
      own: () => ({
        list: {
          style: { height: listHeight() > 0 ? `${listHeight()}px` : 'auto' },
        },
      }),
      vars: () => ({
        '--toast-gap': `${props.gapSize()}px`,
      }),
    },
  )

  return (
    <Show when={activeGroupToasts().length > 0}>
      <ul
        data-slot="toast-list"
        tabIndex={-1}
        {...toastDataAttributes.list({ expanded: layoutExpanded })}
        {...resolved.slots.list}
        onMouseEnter={() => {
          setIsHovered(true)
        }}
        onMouseMove={() => {
          setIsHovered(true)
        }}
        onMouseLeave={() => {
          setIsHovered(false)
        }}
        onPointerDown={(event) => {
          if (event.target !== event.currentTarget) {
            setIsInteracting(true)
          }
        }}
        onPointerUp={() => setIsInteracting(false)}
      >
        <For each={activeGroupToasts()}>
          {(item, index) => (
            <ToastItem
              toast={item}
              index={index()}
              toastsCount={activeGroupToasts().length}
              visibleToasts={props.visibleToasts}
              offsetY={offsets()[index()] ?? 0}
              expanded={layoutExpanded()}
              paused={timerPaused()}
              placement={placement()}
              align={align()}
              close={props.close}
              showProgress={props.showProgress}
              invert={props.invert}
              large={props.large}
              itemRender={props.itemRender}
              classes={props.classes}
              styles={props.styles}
              gap={props.gapSize()}
              duration={props.duration}
              onHeight={props.onHeight}
              onClose={props.onClose}
              onBump={props.onBump}
            />
          )}
        </For>
      </ul>
    </Show>
  )
}

export const Toast = ToastRoot as typeof ToastRoot &
  ToastStore & {
    success: (options: ToastT.InitOptions) => string | number
    error: (options: ToastT.InitOptions) => string | number
    warning: (options: ToastT.InitOptions) => string | number
    info: (options: ToastT.InitOptions) => string | number
  }

Toast.add = (options) => getDefaultToastStore().add(options)
Toast.success = (options) =>
  getDefaultToastStore().add({ ...options, variants: { type: 'success', ...options.variants } })
Toast.error = (options) =>
  getDefaultToastStore().add({ ...options, variants: { type: 'error', ...options.variants } })
Toast.warning = (options) =>
  getDefaultToastStore().add({ ...options, variants: { type: 'warning', ...options.variants } })
Toast.info = (options) =>
  getDefaultToastStore().add({ ...options, variants: { type: 'info', ...options.variants } })
Toast.loading = (options) => getDefaultToastStore().loading(options)
Toast.promise = (promiseValue, options) => getDefaultToastStore().promise(promiseValue, options)
Toast.custom = (render, options) => getDefaultToastStore().custom(render, options)
Toast.update = (id, options) => getDefaultToastStore().update(id, options)
Toast.close = (id) => getDefaultToastStore().close(id)
Toast.onBump = (listener) => getDefaultToastStore().onBump(listener)

Object.defineProperties(Toast, {
  toasts: {
    configurable: true,
    get: () => getDefaultToastStore().toasts,
  },
  preventDuplicate: {
    configurable: true,
    get: () => getDefaultToastStore().preventDuplicate,
    set: (value: ToastT.PreventDuplicate) => {
      getDefaultToastStore().preventDuplicate = value
    },
  },
})
