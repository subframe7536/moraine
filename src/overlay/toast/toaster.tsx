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
import type { OverlayAlign } from '../../theme/style-types'

import { Toast } from './toast'
import { toast } from './toast-store'
import {
  getToastPlacementClass,
  TOAST_VIEWPORT_BASE_CLASS,
  toastListDataAttributes,
} from './toaster.recipe'
import type { ToasterProps, ToasterT } from './toaster.types'

function matchesToasterId(item: ToasterT.Item, toasterId?: string): boolean {
  if (toasterId) {
    return item.toasterId === toasterId
  }
  return !item.toasterId
}

/**
 * All-in-one turn-key Toaster container.
 */
export function Toaster(props: ToasterProps): JSX.Element {
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
    'classes',
    'styles',
    'class',
    'style',
  ])

  const cn = useCn()
  const [isExpanded, setIsExpanded] = createSignal(false)
  const [isHovered, setIsHovered] = createSignal(false)
  const [isInteracting, setIsInteracting] = createSignal(false)
  const [isWindowFocused, setIsWindowFocused] = createSignal(true)
  const [isDocumentHidden, setIsDocumentHidden] = createSignal(false)
  const [heights, setHeights] = createSignal<Record<string | number, number>>({})

  // Prevent duplicate syncing
  createEffect(
    on(
      () => local.preventDuplicate,
      (val) => {
        if (val !== undefined) {
          toast.setToasterPreventDuplicate?.(local.id, val)
        }
      },
    ),
  )

  onCleanup(() => {
    if (local.preventDuplicate !== undefined) {
      toast.setToasterPreventDuplicate?.(local.id, undefined)
    }
  })

  const hotkeys = () => local.hotkey ?? ['F6']
  const hotkeyLabel = () => hotkeys().join('+')

  // Window listeners & global keyboard shortcuts
  onMount(() => {
    createEventListenerMap(window, {
      focus: () => setIsWindowFocused(true),
      blur: () => setIsWindowFocused(false),
      pointerup: () => setIsInteracting(false),
      keydown: (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsExpanded(false)
          return
        }

        const matchHotkey = hotkeys().some((k) => event.key === k || event.code === k)
        if (matchHotkey) {
          event.preventDefault()
          setIsExpanded(true)
          const firstToast = document.querySelector<HTMLElement>('[data-slot="toast"]')
          firstToast?.focus()
        }
      },
    })
    createEventListener(document, 'visibilitychange', () => setIsDocumentHidden(document.hidden))
  })

  const filteredToasts = createMemo(() => {
    return toast.toasts.filter((t) => matchesToasterId(t, local.id))
  })

  // Collapse if down to 0 or 1 toast
  createEffect(
    on(
      () => filteredToasts().length,
      (len) => {
        if (len <= 1) {
          setIsExpanded(false)
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

  const expandedState = () => local.expand || isExpanded()
  const gapSize = () => local.gap ?? 14

  return (
    <Portal>
      <section
        role="region"
        tabIndex={-1}
        {...rest}
        aria-label={
          local['aria-label'] ?? local.regionAriaLabel ?? `Notifications (${hotkeyLabel()})`
        }
        class="pointer-events-none inset-0 fixed z-floating"
      >
        <For each={possiblePositions()}>
          {(positionKey) => {
            const [placement, align] = positionKey.split('-') as [ToasterT.Placement, OverlayAlign]

            const activeGroupToasts = createMemo(() => {
              return filteredToasts().filter((t) => {
                const p = t.placement ?? defaultPlacement()
                const a = t.align ?? defaultAlign()
                return `${p}-${a}` === positionKey
              })
            })

            const frontmostHeight = () => {
              const toasts = activeGroupToasts()
              for (const t of toasts) {
                const h = heights()[t.id]
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
              const count = Math.min(toasts.length, local.visibleToasts ?? 3)
              const gap = gapSize()
              const frontH = frontmostHeight() || 58

              if (!expandedState()) {
                return frontH + (count > 1 ? (count - 1) * gap : 0)
              }

              let totalH = 0
              for (let i = 0; i < count; i++) {
                const t = toasts[i]
                const h = (t ? heights()[t.id] : 0) || frontH
                totalH += h
              }
              return totalH + (count > 1 ? (count - 1) * gap : 0)
            })

            const listDataAttrs = toastListDataAttributes({
              expanded: expandedState,
            })

            return (
              <ul
                tabIndex={-1}
                {...listDataAttrs}
                class={cn(
                  TOAST_VIEWPORT_BASE_CLASS,
                  activeGroupToasts().length > 0 ? 'pointer-events-auto' : 'pointer-events-none',
                  getToastPlacementClass(placement, align),
                  local.class,
                )}
                style={{
                  ...local.style,
                  width: '384px',
                  height: listHeight() > 0 ? `${listHeight()}px` : 'auto',
                  '--toast-frontmost-height': `${frontmostHeight()}px`,
                }}
                onMouseEnter={() => {
                  setIsHovered(true)
                  setIsExpanded(true)
                }}
                onMouseMove={() => {
                  setIsHovered(true)
                  setIsExpanded(true)
                }}
                onMouseLeave={() => {
                  setIsHovered(false)
                  if (!isInteracting() && !local.expand) {
                    setIsExpanded(false)
                  }
                }}
                onPointerDown={(event) => {
                  const toastTarget =
                    event.target instanceof Element
                      ? event.target.closest('[data-slot="toast"]')
                      : null
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
                          totalH += heights()[prevItem.id] ?? 0
                        }
                      }
                      return totalH + i * gapSize()
                    })

                    return (
                      <Toast
                        toast={item}
                        index={index()}
                        toastsCount={activeGroupToasts().length}
                        visibleToasts={local.visibleToasts ?? 3}
                        frontmostHeight={frontmostHeight()}
                        offsetY={offsetY()}
                        expanded={expandedState()}
                        hovered={isHovered()}
                        interacting={isInteracting()}
                        windowFocused={isWindowFocused()}
                        documentHidden={isDocumentHidden()}
                        placement={placement}
                        align={align}
                        closeButton={local.closeButton}
                        closeButtonAriaLabel={local.closeButtonAriaLabel}
                        showProgress={local.showProgress}
                        invert={local.invert}
                        gap={gapSize()}
                        duration={local.duration}
                        onHeight={updateHeight}
                        onDismiss={toast.dismiss}
                        onRemove={toast.remove}
                      />
                    )
                  }}
                </For>
              </ul>
            )
          }}
        </For>
      </section>
    </Portal>
  )
}

// Mirror methods on Toaster component
Toaster.add = ((...args: any[]) => (toast.add as any)(...args)) as typeof toast.add
Toaster.success = ((...args: any[]) => (toast.success as any)(...args)) as typeof toast.success
Toaster.error = ((...args: any[]) => (toast.error as any)(...args)) as typeof toast.error
Toaster.warning = ((...args: any[]) => (toast.warning as any)(...args)) as typeof toast.warning
Toaster.info = ((...args: any[]) => (toast.info as any)(...args)) as typeof toast.info
Toaster.loading = ((...args: any[]) => (toast.loading as any)(...args)) as typeof toast.loading
Toaster.promise = ((...args: any[]) => (toast.promise as any)(...args)) as typeof toast.promise
Toaster.custom = ((...args: any[]) => (toast.custom as any)(...args)) as typeof toast.custom
Toaster.dismiss = ((...args: any[]) => (toast.dismiss as any)(...args)) as typeof toast.dismiss
Toaster.remove = ((...args: any[]) => (toast.remove as any)(...args)) as typeof toast.remove
Toaster.clear = (() => toast.clear()) as typeof toast.clear
