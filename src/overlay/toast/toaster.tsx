import type { JSX } from 'solid-js'
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  onCleanup,
  onMount,
  Show,
  splitProps,
} from 'solid-js'
import { Portal } from 'solid-js/web'

import { useCn } from '../../provider'
import { createEventListener } from '../../shared/event-listener'
import type { OverlayAlign, OverlayPlacement } from '../../theme/style-types'

import { ToastItem } from './toast-item'
import { toast } from './toast-store'
import { getToastPlacementClass, TOAST_VIEWPORT_BASE_CLASS } from './toaster.recipe'
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
    'classes',
    'styles',
    'class',
    'style',
  ])

  const cn = useCn()
  const [isMounted, setIsMounted] = createSignal(false)
  const [isExpanded, setIsExpanded] = createSignal(false)
  const [isHovered, setIsHovered] = createSignal(false)
  const [isWindowFocused, setIsWindowFocused] = createSignal(true)
  const [isDocumentHidden, setIsDocumentHidden] = createSignal(false)
  const [heights, setHeights] = createSignal<Record<string | number, number>>({})

  // SSR Gate 4: Defer client portal mount via microtask after initial hydration
  onMount(() => {
    queueMicrotask(() => setIsMounted(true))
  })

  // Prevent duplicate syncing
  createEffect(
    on(
      () => local.preventDuplicate,
      (val) => {
        if (val !== undefined) {
          toast.preventDuplicate = val
        }
      },
    ),
  )

  onCleanup(() => {
    toast.preventDuplicate = false
  })

  // Window blur & focus listeners
  onMount(() => {
    createEventListener(window, 'focus', () => setIsWindowFocused(true))
    createEventListener(window, 'blur', () => setIsWindowFocused(false))
    createEventListener(document, 'visibilitychange', () => setIsDocumentHidden(document.hidden))
  })

  const hotkeys = () => local.hotkey ?? ['F6']
  const hotkeyLabel = () => hotkeys().join('+')

  // Global keyboard shortcuts (F6 to focus, Escape to collapse)
  onMount(() => {
    createEventListener(window, 'keydown', (event: KeyboardEvent) => {
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
    })
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

  // Group toasts by viewport position
  interface PositionGroup {
    key: string
    placement: OverlayPlacement
    align: OverlayAlign
    items: ToasterT.Item[]
  }

  const defaultPlacement = () => local.placement ?? 'bottom'
  const defaultAlign = () => local.align ?? 'end'

  const positionGroups = createMemo(() => {
    const map = new Map<string, PositionGroup>()

    filteredToasts().forEach((t) => {
      const p = t.placement ?? defaultPlacement()
      const a = t.align ?? defaultAlign()
      const key = `${p}-${a}`

      if (!map.has(key)) {
        map.set(key, { key, placement: p, align: a, items: [] })
      }
      map.get(key)!.items.push(t)
    })

    if (map.size === 0) {
      const key = `${defaultPlacement()}-${defaultAlign()}`
      map.set(key, {
        key,
        placement: defaultPlacement(),
        align: defaultAlign(),
        items: [],
      })
    }

    return Array.from(map.values())
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
    <Show when={isMounted()}>
      {(_mounted) => (
        <Portal>
          <section
            role="region"
            aria-label={local.regionAriaLabel ?? `Notifications (${hotkeyLabel()})`}
            tabIndex={-1}
            class="pointer-events-none inset-0 fixed z-floating"
            {...rest}
          >
            <For each={positionGroups()}>
              {(group) => {
                const activeGroupToasts = createMemo(() => group.items)
                const frontmostHeight = () => {
                  const frontId = activeGroupToasts()[0]?.id
                  return frontId ? (heights()[frontId] ?? 0) : 0
                }

                return (
                  <ol
                    tabIndex={-1}
                    class={cn(
                      TOAST_VIEWPORT_BASE_CLASS,
                      getToastPlacementClass(group.placement, group.align),
                      local.class,
                    )}
                    style={{
                      ...local.style,
                      width: '384px',
                      '--toast-frontmost-height': `${frontmostHeight()}px`,
                    }}
                    onMouseEnter={() => {
                      setIsHovered(true)
                      setIsExpanded(true)
                    }}
                    onMouseLeave={() => {
                      setIsHovered(false)
                      if (!local.expand) {
                        setIsExpanded(false)
                      }
                    }}
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
                          <ToastItem
                            toast={item}
                            index={index()}
                            toastsCount={activeGroupToasts().length}
                            visibleToasts={local.visibleToasts ?? 3}
                            frontmostHeight={frontmostHeight()}
                            offsetY={offsetY()}
                            expanded={expandedState()}
                            isHovered={isHovered()}
                            isWindowFocused={isWindowFocused}
                            isDocumentHidden={isDocumentHidden}
                            placement={group.placement}
                            align={group.align}
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
                  </ol>
                )
              }}
            </For>
          </section>
        </Portal>
      )}
    </Show>
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
