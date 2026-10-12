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
import type { ToastHostStore, ToastStore } from './toast-store'
import { defaultToastMessages } from './toast.messages'
import { toastDataAttributes, toastRecipe } from './toast.recipe'
import { DEFAULT_TOAST_GAP } from './toast.types'
import type { ToastProps, ToastT } from './toast.types'

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
    'aria-label',
    'store',
    'classes',
    'styles',
    'class',
    'style',
  ])

  const messages = useMessages('toast', defaultToastMessages)
  const store = () => hostStore(local.store)
  const [keyboardExpanded, setKeyboardExpanded] = createSignal(false)
  const [isWindowFocused, setIsWindowFocused] = createSignal(true)
  const [isDocumentHidden, setIsDocumentHidden] = createSignal(false)
  const [heights, setHeights] = createSignal<Record<string | number, number>>({})

  let viewportRef: HTMLElement | undefined
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

  // class/style bind to each stack list, not the viewport.
  const resolved = createStyles(
    toastRecipe,
    {},
    {
      slot: 'viewport',
      contextVariants: () => ({
        placement: local.placement ?? 'bottom',
        align: local.align ?? 'end',
      }),
      contextSlots: () => ({
        classes: local.classes,
        styles: local.styles,
      }),
    },
  )

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

  const hasToasts = () => activeToasts().length > 0

  // Like Base UI's ToastList: only listen for window focus/visibility and the hotkey
  // while this host has toasts, so empty hosts attach nothing and never intercept F6.
  createEffect(
    on(hasToasts, (active) => {
      if (!active) {
        return
      }
      // Re-sync on attach; state may have changed while detached.
      setIsWindowFocused(document.hasFocus())
      setIsDocumentHidden(document.hidden)
      onCleanup(() => {
        // Reset to defaults so a stale blurred/hidden state can't stick.
        setIsWindowFocused(true)
        setIsDocumentHidden(false)
      })
      createEventListenerMap(window, {
        focus: () => setIsWindowFocused(true),
        blur: () => setIsWindowFocused(false),
      })
      createEventListener(document, 'visibilitychange', () => setIsDocumentHidden(document.hidden))
      createEventListener(window, 'keydown', (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setKeyboardExpanded(false)
          restoreFocus()
          return
        }

        if (
          !matchesToastHotkey(event, hotkeys()) ||
          (viewportRef && event.target === viewportRef)
        ) {
          return
        }

        event.preventDefault()
        const active = document.activeElement
        if (!focusedViaHotkey) {
          restoreFocusEl = active instanceof HTMLElement ? active : null
        }
        focusedViaHotkey = true
        // keyboardExpanded also pauses timers.
        setKeyboardExpanded(true)
        const firstToast = viewportRef?.querySelector<HTMLElement>('[data-slot="toast"]')
        firstToast?.focus({ preventScroll: true })
      })
    }),
  )

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
  const hostPaused = () => keyboardExpanded() || isDocumentHidden() || !isWindowFocused()

  return (
    <Portal>
      <section
        ref={(el) => {
          viewportRef = el
        }}
        data-slot="toast-viewport"
        role="region"
        tabIndex={-1}
        {...rest}
        aria-live="polite"
        aria-relevant="additions text"
        aria-atomic="false"
        aria-label={local['aria-label'] ?? messages().viewport({ hotkey: hotkeyLabel() })}
        {...resolved.slots.viewport}
      >
        <For each={possiblePositions()}>
          {(positionKey) => (
            <ToastList
              positionKey={positionKey}
              filteredToasts={filteredToasts}
              defaultPlacement={defaultPlacement}
              defaultAlign={defaultAlign}
              expand={local.expand}
              keyboardExpanded={keyboardExpanded}
              hostPaused={hostPaused}
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
            />
          )}
        </For>
      </section>
    </Portal>
  )
}

interface ToastListProps {
  positionKey: string
  filteredToasts: () => ToastT.Item[]
  defaultPlacement: () => ToastT.Placement
  defaultAlign: () => OverlayAlign
  expand?: boolean
  keyboardExpanded: () => boolean
  /** Keyboard focus, hidden document, or blurred window. */
  hostPaused: () => boolean
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
}

function ToastList(props: ToastListProps): JSX.Element {
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
  const timerPaused = () => isHovered() || isInteracting() || props.hostPaused()

  const frontmostHeight = createMemo(() => {
    const heights = props.heights()
    for (const t of activeGroupToasts()) {
      const h = heights[t.id]
      if (h && h > 0) {
        return h
      }
    }
    return 0
  })

  // Expanded Y offset per index: prefix sum of earlier heights plus gaps, computed once per group.
  const offsets = createMemo(() => {
    const heights = props.heights()
    const gap = props.gapSize()
    const result: number[] = []
    let total = 0
    for (const t of activeGroupToasts()) {
      result.push(total)
      total += (heights[t.id] ?? 0) + gap
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

  const resolved = createStyles(toastRecipe, props, {
    slot: 'list',
    varsSlot: 'list',
    contextVariants: () => ({
      placement: placement(),
      align: align(),
    }),
    // Component-controlled layout style; user `styles.list` / `style` still win.
    own: () => ({
      list: {
        style: { height: listHeight() > 0 ? `${listHeight()}px` : 'auto' },
      },
    }),
    vars: () => ({
      '--toast-gap': `${props.gapSize()}px`,
    }),
  })

  // Mounted while the group has toasts, including ones still playing their exit animation.
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
          // The list only contains toast items, so any target other than the list is inside a toast.
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
          )}
        </For>
      </ul>
    </Show>
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
