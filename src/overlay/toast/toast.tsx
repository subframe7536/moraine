import type { JSX } from 'solid-js'
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  onCleanup,
  onMount,
  splitProps,
} from 'solid-js'
import { Portal } from 'solid-js/web'

import { useCn } from '../../provider'
import { createEventListener, createEventListenerMap } from '../../shared/event-listener'
import type { Cn } from '../../theme/cn'
import type { OverlayAlign } from '../../theme/style-types'

import { ToastItem } from './toast-item'
import { getDefaultToastStore, matchesHostId } from './toast-store'
import type { ToastHostStore, ToastStore } from './toast-store'
import {
  getToastPlacementClass,
  TOAST_VIEWPORT_BASE_CLASS,
  toastListDataAttributes,
} from './toast.recipe'
import { DEFAULT_TOAST_GAP } from './toast.types'
import type { ToastProps, ToastT } from './toast.types'

const DEFAULT_TOAST_WIDTH = '384px'

const MODIFIER_PARTS: Record<string, 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey'> = {
  altKey: 'altKey',
  Alt: 'altKey',
  ctrlKey: 'ctrlKey',
  controlKey: 'ctrlKey',
  Control: 'ctrlKey',
  Ctrl: 'ctrlKey',
  metaKey: 'metaKey',
  Meta: 'metaKey',
  shiftKey: 'shiftKey',
  Shift: 'shiftKey',
}

function matchesToastHotkey(event: KeyboardEvent, hotkey: readonly string[]): boolean {
  if (hotkey.length === 0) {
    return false
  }

  const required = {
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
  }
  const keys: string[] = []

  for (const part of hotkey) {
    const modifier = MODIFIER_PARTS[part]
    if (modifier) {
      required[modifier] = true
    } else {
      keys.push(part)
    }
  }

  if (
    event.altKey !== required.altKey ||
    event.ctrlKey !== required.ctrlKey ||
    event.metaKey !== required.metaKey ||
    event.shiftKey !== required.shiftKey
  ) {
    return false
  }

  if (keys.length === 0) {
    return true
  }

  return keys.every((key) => event.key === key || event.code === key)
}

function hostStore(store: ToastStore | undefined): ToastHostStore {
  return (store as ToastHostStore | undefined) ?? getDefaultToastStore()
}

/**
 * Notification host. Trigger toasts with `Toast.show`, `Toast.success`, and the other static methods.
 */
function ToastRoot(props: ToastProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'id',
    'placement',
    'align',
    'visibleToasts',
    'duration',
    'closeButton',
    'closeButtonAriaLabel',
    'showProgress',
    'hotkey',
    'expand',
    'preventDuplicate',
    'invert',
    'gap',
    'regionAriaLabel',
    'aria-label',
    'store',
    'classes',
    'styles',
    'class',
    'style',
  ])

  const cn = useCn()
  const store = () => hostStore(local.store)
  const [keyboardExpanded, setKeyboardExpanded] = createSignal(false)
  const [isWindowFocused, setIsWindowFocused] = createSignal(true)
  const [isDocumentHidden, setIsDocumentHidden] = createSignal(false)
  const [heights, setHeights] = createSignal<Record<string | number, number>>({})

  let regionRef: HTMLElement | undefined
  let restoreFocusEl: HTMLElement | null = null
  let focusedViaHotkey = false

  const restoreFocus = () => {
    if (!focusedViaHotkey) {
      return
    }
    focusedViaHotkey = false
    restoreFocusEl?.focus?.()
    restoreFocusEl = null
  }

  createEffect(
    on(
      () => [local.id, local.preventDuplicate] as const,
      ([id, val]) => {
        if (val === undefined) {
          return
        }
        store().setHostPreventDuplicate(id, val)
        onCleanup(() => {
          store().setHostPreventDuplicate(id, undefined)
        })
      },
    ),
  )

  createEffect(
    on(
      () => local.id,
      (id) => {
        store().registerHost(id)
        onCleanup(() => {
          store().unregisterHost(id)
        })
      },
    ),
  )

  const hotkeys = () => local.hotkey ?? ['F6']
  const hotkeyLabel = () => hotkeys().join('+')

  const filteredToasts = createMemo(() => {
    return store().toasts.filter((t) => matchesHostId(t, local.id))
  })

  const activeToasts = createMemo(() => filteredToasts().filter((t) => !t.dismissed))

  onMount(() => {
    createEventListenerMap(window, {
      focus: () => setIsWindowFocused(true),
      blur: () => setIsWindowFocused(false),
      keydown: (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setKeyboardExpanded(false)
          restoreFocus()
          return
        }

        if (!matchesToastHotkey(event, hotkeys()) || activeToasts().length === 0) {
          return
        }

        event.preventDefault()
        setKeyboardExpanded(true)
        const active = document.activeElement
        restoreFocusEl = active instanceof HTMLElement ? active : null
        focusedViaHotkey = true
        const firstToast = regionRef?.querySelector<HTMLElement>('[data-slot="toast"]')
        firstToast?.focus()
      },
    })
    createEventListener(document, 'visibilitychange', () => setIsDocumentHidden(document.hidden))
  })

  createEffect(
    on(
      () => activeToasts().length,
      (len) => {
        if (len <= 1) {
          setKeyboardExpanded(false)
        }
        if (len === 0) {
          restoreFocus()
        }
      },
    ),
  )

  const defaultPlacement = () => local.placement ?? 'bottom'
  const defaultAlign = () => local.align ?? 'end'
  const defaultKey = () => `${defaultPlacement()}-${defaultAlign()}`

  const possiblePositions = createMemo(() => {
    const activePositions = filteredToasts()
      .filter((t) => t.placement || t.align)
      .map((t) => `${t.placement ?? defaultPlacement()}-${t.align ?? defaultAlign()}`)

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

  return (
    <Portal>
      <section
        ref={(el) => {
          regionRef = el
        }}
        data-slot="toast-region"
        role="region"
        tabIndex={-1}
        {...rest}
        aria-live="polite"
        aria-relevant="additions text"
        aria-atomic="false"
        aria-label={
          local['aria-label'] ?? local.regionAriaLabel ?? `Notifications (${hotkeyLabel()})`
        }
        class="pointer-events-none inset-0 fixed z-floating"
      >
        <For each={possiblePositions()}>
          {(positionKey) => (
            <ToastViewport
              positionKey={positionKey}
              filteredToasts={filteredToasts}
              defaultPlacement={defaultPlacement}
              defaultAlign={defaultAlign}
              expand={local.expand}
              keyboardExpanded={keyboardExpanded}
              isWindowFocused={isWindowFocused}
              isDocumentHidden={isDocumentHidden}
              heights={heights}
              gapSize={gapSize}
              visibleToasts={local.visibleToasts ?? 3}
              class={local.class}
              style={local.style}
              closeButton={local.closeButton}
              closeButtonAriaLabel={local.closeButtonAriaLabel}
              showProgress={local.showProgress}
              invert={local.invert}
              classes={local.classes}
              styles={local.styles}
              duration={local.duration}
              onHeight={updateHeight}
              onDismiss={(id) => store().dismiss(id)}
              onRemove={(id) => store().remove(id)}
              cn={cn}
            />
          )}
        </For>
      </section>
    </Portal>
  )
}

interface ToastViewportProps {
  positionKey: string
  filteredToasts: () => ToastT.Item[]
  defaultPlacement: () => ToastT.Placement
  defaultAlign: () => OverlayAlign
  expand?: boolean
  keyboardExpanded: () => boolean
  isWindowFocused: () => boolean
  isDocumentHidden: () => boolean
  heights: () => Record<string | number, number>
  gapSize: () => number
  visibleToasts: number
  class?: ToastProps['class']
  style?: ToastProps['style']
  closeButton?: boolean
  closeButtonAriaLabel?: string
  showProgress?: boolean
  invert?: boolean
  classes?: ToastT.Classes
  styles?: ToastT.Styles
  duration?: number
  onHeight: (id: string | number, height: number) => void
  onDismiss: (id: string | number) => void
  onRemove: (id: string | number) => void
  cn: Cn
}

function ToastViewport(props: ToastViewportProps): JSX.Element {
  const [isHovered, setIsHovered] = createSignal(false)
  const [isInteracting, setIsInteracting] = createSignal(false)

  const placement = () => props.positionKey.split('-')[0] as ToastT.Placement
  const align = () => props.positionKey.split('-')[1] as OverlayAlign

  const activeGroupToasts = createMemo(() => {
    return props.filteredToasts().filter((t) => {
      const p = t.placement ?? props.defaultPlacement()
      const a = t.align ?? props.defaultAlign()
      return `${p}-${a}` === props.positionKey
    })
  })

  const layoutExpanded = () => Boolean(props.expand) || props.keyboardExpanded() || isHovered()
  const timerPaused = () =>
    isHovered() ||
    isInteracting() ||
    props.keyboardExpanded() ||
    props.isDocumentHidden() ||
    !props.isWindowFocused()

  const frontmostHeight = () => {
    const toasts = activeGroupToasts()
    for (const t of toasts) {
      const h = props.heights()[t.id]
      if (h && h > 0) {
        return h
      }
    }
    return 0
  }

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

  const listDataAttrs = toastListDataAttributes({
    expanded: layoutExpanded,
  })

  return (
    <ul
      tabIndex={-1}
      {...listDataAttrs}
      class={props.cn(
        TOAST_VIEWPORT_BASE_CLASS,
        activeGroupToasts().length > 0 ? 'pointer-events-auto' : 'pointer-events-none',
        getToastPlacementClass(placement(), align()),
        props.class,
      )}
      style={{
        width: DEFAULT_TOAST_WIDTH,
        ...props.style,
        height: listHeight() > 0 ? `${listHeight()}px` : 'auto',
        '--toast-gap': `${props.gapSize()}px`,
        '--toast-frontmost-height': `${frontmostHeight()}px`,
      }}
      onMouseEnter={() => {
        setIsHovered(true)
      }}
      onMouseMove={() => {
        setIsHovered(true)
      }}
      onMouseLeave={() => {
        setIsHovered(false)
        if (!isInteracting()) {
          setIsInteracting(false)
        }
      }}
      onPointerDown={(event) => {
        const toastTarget =
          event.target instanceof Element ? event.target.closest('[data-slot="toast"]') : null
        if (toastTarget) {
          setIsInteracting(true)
        }
      }}
      onPointerUp={() => setIsInteracting(false)}
    >
      <For each={activeGroupToasts()}>
        {(item, index) => {
          const offsetY = createMemo(() => {
            const i = index()
            let totalH = 0
            for (let prev = 0; prev < i; prev++) {
              const prevItem = activeGroupToasts()[prev]
              if (prevItem) {
                totalH += props.heights()[prevItem.id] ?? 0
              }
            }
            return totalH + i * props.gapSize()
          })

          return (
            <ToastItem
              toast={item}
              index={index()}
              toastsCount={activeGroupToasts().length}
              visibleToasts={props.visibleToasts}
              frontmostHeight={frontmostHeight()}
              offsetY={offsetY()}
              expanded={layoutExpanded()}
              paused={timerPaused()}
              interacting={isInteracting()}
              placement={placement()}
              align={align()}
              closeButton={props.closeButton}
              closeButtonAriaLabel={props.closeButtonAriaLabel}
              showProgress={props.showProgress}
              invert={props.invert}
              classes={props.classes}
              styles={props.styles}
              gap={props.gapSize()}
              duration={props.duration}
              onHeight={props.onHeight}
              onDismiss={props.onDismiss}
              onRemove={props.onRemove}
            />
          )
        }}
      </For>
    </ul>
  )
}

export const Toast: typeof ToastRoot & ToastStore = ToastRoot as typeof ToastRoot & ToastStore

Toast.show = (message, options) => getDefaultToastStore().show(message, options)
Toast.success = (message, options) => getDefaultToastStore().success(message, options)
Toast.error = (message, options) => getDefaultToastStore().error(message, options)
Toast.warning = (message, options) => getDefaultToastStore().warning(message, options)
Toast.info = (message, options) => getDefaultToastStore().info(message, options)
Toast.loading = (message, options) => getDefaultToastStore().loading(message, options)
Toast.promise = (promiseValue, options) => getDefaultToastStore().promise(promiseValue, options)
Toast.custom = (render, options) => getDefaultToastStore().custom(render, options)
Toast.dismiss = (id) => getDefaultToastStore().dismiss(id)
Toast.remove = (id) => getDefaultToastStore().remove(id)
Toast.clear = () => getDefaultToastStore().clear()
Toast.getToasts = () => getDefaultToastStore().getToasts()
Toast.getHistory = () => getDefaultToastStore().getHistory()

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

export type { ToastStore }
