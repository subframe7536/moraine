import {
  Virtualizer,
  elementScroll,
  observeElementOffset,
  observeElementRect,
} from '@tanstack/virtual-core'
import type { PartialKeys, VirtualItem, VirtualizerOptions } from '@tanstack/virtual-core'
import type { Accessor, JSX } from 'solid-js'
import {
  For,
  Show,
  batch,
  createMemo,
  createRenderEffect,
  createSignal,
  mergeProps,
  on,
  onCleanup,
  onMount,
} from 'solid-js'
import { createStore, reconcile } from 'solid-js/store'

import { attachEventListenerMap } from '../shared/event-listener'

export function scrollElementWithRtl<
  TScrollElement extends HTMLElement,
  TItemElement extends HTMLElement,
>(
  offset: number,
  { adjustments = 0, behavior }: { adjustments?: number; behavior?: ScrollBehavior },
  instance: Virtualizer<TScrollElement, TItemElement>,
): void {
  if (instance.options.horizontal && instance.options.isRtl) {
    instance.scrollElement?.scrollTo?.({
      behavior,
      left: -(offset + adjustments),
    })
    return
  }

  elementScroll(offset, { adjustments, behavior }, instance)
}

export type VirtualizerAdapterOptions<
  TItem,
  TScrollElement extends HTMLElement = HTMLElement,
  TItemElement extends HTMLElement = HTMLElement,
> = Omit<
  PartialKeys<
    VirtualizerOptions<TScrollElement, TItemElement>,
    'observeElementRect' | 'observeElementOffset' | 'scrollToFn'
  >,
  'count' | 'estimateSize' | 'getItemKey' | 'getScrollElement' | 'indexAttribute' | 'isRtl'
> & {
  /** Estimated row size before its element has been measured. */
  estimateSize: (item: TItem, index: number) => number
  /** Stable row key. The item index is used by default. */
  getItemKey?: (item: TItem, index: number) => string | number | bigint
}

export interface VirtualizerState<
  TScrollElement extends HTMLElement,
  TItemElement extends HTMLElement,
> {
  /** Low-level virtualizer instance driven by the mounted adapter. */
  readonly virtualizer: Virtualizer<TScrollElement, TItemElement>
  /** Reactive window of currently rendered rows. */
  readonly virtualItems: readonly VirtualItem[]
  /** Reactive total scroll size across every entry. */
  readonly totalSize: () => number
  /** Re-runs pending updates and syncs derived state after imperative option changes. */
  update: () => void
}

/** Scroll geometry an adapter measures from its DOM. */
export type VirtualizerLayout = Readonly<
  Partial<Pick<VirtualizerOptions<HTMLElement, HTMLElement>, LayoutOption>>
>

type LayoutOption = 'scrollMargin' | 'scrollPaddingStart' | 'scrollPaddingEnd' | 'isRtl'

/** Shared virtualizer lifecycle for adapter components such as lists and tables. */
export function createVirtualizerController<
  TItem,
  TScrollElement extends HTMLElement = HTMLElement,
  TItemElement extends HTMLElement = HTMLElement,
>(
  options: VirtualizerAdapterOptions<TItem, TScrollElement, TItemElement>,
): {
  /** Current low-level virtualizer instance, available after virtual content mounts. */
  readonly instance: Accessor<Virtualizer<TScrollElement, TItemElement> | undefined>
  /** Binds the controller to a mounted adapter component; call inside the component body. */
  attach: (props: {
    entries: () => readonly TItem[]
    scrollElement: () => TScrollElement | undefined
    /** Layout measured by the adapter. Explicit options take precedence over these values. */
    layout?: () => VirtualizerLayout
    /**
     * Item size estimate that replaces `options.estimateSize`. It is read in a tracked scope, so
     * reactive values it reads (such as host-provided column widths) refresh the sizes.
     */
    estimateSize?: (item: TItem, index: number) => number
  }) => VirtualizerState<TScrollElement, TItemElement>
} {
  const [instance, setInstance] = createSignal<Virtualizer<TScrollElement, TItemElement>>()

  return {
    instance,
    attach: (adapterProps) => {
      const [mounted, setMounted] = createSignal(false)
      const [virtualItems, setVirtualItems] = createStore<VirtualItem[]>([])
      const [totalSize, setTotalSize] = createSignal(0)
      const sync = (source: Virtualizer<TScrollElement, TItemElement>): void => {
        batch(() => {
          setVirtualItems(reconcile(source.getVirtualItems(), { key: 'index' }))
          setTotalSize(source.getTotalSize())
        })
      }
      let currentEntries: readonly TItem[] = []
      let currentKeys: VirtualItem['key'][] = []
      let currentEstimates: number[] = []
      let initialized = false
      const virtualizerOptions = mergeProps(
        {
          observeElementRect,
          observeElementOffset,
          scrollToFn: scrollElementWithRtl,
        },
        options,
        {
          get count() {
            return currentEntries.length
          },
          // `undefined` falls back to TanStack defaults inside `setOptions`.
          get scrollMargin() {
            return options.scrollMargin ?? adapterProps.layout?.().scrollMargin
          },
          get scrollPaddingStart() {
            return options.scrollPaddingStart ?? adapterProps.layout?.().scrollPaddingStart
          },
          get scrollPaddingEnd() {
            return options.scrollPaddingEnd ?? adapterProps.layout?.().scrollPaddingEnd
          },
          get isRtl() {
            return (options as { isRtl?: boolean }).isRtl ?? adapterProps.layout?.().isRtl ?? false
          },
          getScrollElement: () => (mounted() ? (adapterProps.scrollElement() ?? null) : null),
          estimateSize: (index: number) => currentEstimates[index]!,
          getItemKey: (index: number) => currentKeys[index] ?? index,
          indexAttribute: 'data-index',
          onChange: (source: Virtualizer<TScrollElement, TItemElement>, synchronous: boolean) => {
            sync(source)
            options.onChange?.(source, synchronous)
          },
        },
      ) satisfies VirtualizerOptions<TScrollElement, TItemElement>
      const virtualizer = new Virtualizer<TScrollElement, TItemElement>(virtualizerOptions)

      createRenderEffect(() => {
        const entries = adapterProps.entries()
        const nextKeys = entries.map((item, index) => options.getItemKey?.(item, index) ?? index)
        const estimateItem = adapterProps.estimateSize ?? options.estimateSize
        const nextEstimates = entries.map((item, index) => estimateItem(item, index))
        const sharedLength = Math.min(currentKeys.length, nextKeys.length)
        const layoutChanged =
          initialized &&
          (nextKeys.some((key, index) => index < sharedLength && key !== currentKeys[index]) ||
            nextEstimates.some(
              (estimate, index) =>
                index < sharedLength && !Object.is(estimate, currentEstimates[index]),
            ))

        if (initialized) {
          const nextEstimateByKey = new Map(
            nextKeys.map((key, index) => [key, nextEstimates[index]]),
          )
          currentKeys.forEach((key, index) => {
            const nextEstimate = nextEstimateByKey.get(key)
            if (nextEstimate === undefined || !Object.is(nextEstimate, currentEstimates[index])) {
              virtualizer.itemSizeCache.delete(key)
            }
          })
        }
        currentEntries = entries
        currentKeys = nextKeys
        currentEstimates = nextEstimates
        initialized = true
        virtualizerOptions.getScrollElement()
        // A new `getItemKey` identity is what makes TanStack recompute measurements: its
        // `getMeasurementOptions` memo depends on `count`, `getItemKey`, and other options but not
        // on the keys themselves. Recheck this when upgrading `@tanstack/virtual-core`.
        virtualizer.setOptions(
          layoutChanged
            ? { ...virtualizerOptions, getItemKey: (index: number) => currentKeys[index] ?? index }
            : virtualizerOptions,
        )

        if (mounted()) {
          virtualizer._willUpdate()
        }
        sync(virtualizer)
      })

      // `setOptions` snapshots getters, so re-apply options when measured layout changes.
      createRenderEffect(
        on(
          () => adapterProps.layout?.(),
          () => {
            virtualizer.setOptions(virtualizerOptions)
            if (mounted()) {
              virtualizer._willUpdate()
            }
            sync(virtualizer)
          },
          { defer: true },
        ),
      )

      onMount(() => {
        const cleanupVirtualizer = virtualizer._didMount()
        let active = true

        queueMicrotask(() => {
          if (!active) {
            return
          }

          setInstance(virtualizer)
          setMounted(true)
        })

        onCleanup(() => {
          active = false
          cleanupVirtualizer()
          setInstance((current) => (current === virtualizer ? undefined : current))
        })
      })

      return {
        virtualizer,
        virtualItems,
        totalSize,
        update: () => {
          if (mounted()) {
            virtualizer._willUpdate()
          }
          sync(virtualizer)
        },
      }
    },
  }
}

export interface VirtualRowEntry<TItem> {
  readonly index: number
  readonly item: TItem
}

/**
 * Pairs a virtual item with its entry. Returns `undefined` while the virtual window still points
 * past the end of shrunken entries, so callers never render a row for a missing item.
 */
export function createVirtualRow<TItem>(
  virtualItem: VirtualItem,
  entries: () => readonly TItem[],
): Accessor<VirtualRowEntry<TItem> | undefined> {
  const row = createMemo(
    () => {
      const current = entries()
      const index = virtualItem.index
      return index < current.length ? { index, item: current[index]! } : undefined
    },
    undefined,
    {
      equals: (prev, next) => prev?.index === next?.index && prev?.item === next?.item,
    },
  )
  return row
}

/** Registers row unmeasurement on cleanup and returns a deferred measurement ref. */
export function attachRowMeasurement<
  TScrollElement extends HTMLElement,
  TItemElement extends HTMLElement,
>(virtualizer: Virtualizer<TScrollElement, TItemElement>): (element: TItemElement) => void {
  onCleanup(() => {
    queueMicrotask(() => virtualizer.measureElement(null))
  })
  return (element: TItemElement) => {
    // Solid invokes spread refs before all following attributes are applied.
    // Defer measurement so data attributes, styles, and children affect its size.
    queueMicrotask(() => {
      if (element.isConnected) {
        virtualizer.measureElement(element)
      }
    })
  }
}

/**
 * Renders the current window: one row per virtual item, measured through the ref passed to
 * `rowProps`. Items past the end of shrunken entries render nothing.
 */
export function VirtualRows<TItem, TItemElement extends HTMLElement, TRowProps>(props: {
  virtualizer: Virtualizer<HTMLElement, TItemElement>
  virtualItems: readonly VirtualItem[]
  entries: readonly TItem[]
  render: (item: TItem, index: number, rowProps: TRowProps) => JSX.Element
  /** Builds the row attributes; it must pass `measure` on as the row `ref`. */
  rowProps: (
    row: VirtualRowEntry<TItem>,
    virtualItem: VirtualItem,
    measure: (element: TItemElement) => void,
  ) => TRowProps
}): JSX.Element {
  const renderRow = createMemo(() => props.render)

  return (
    <For each={props.virtualItems}>
      {(virtualItem) => {
        const row = createVirtualRow(virtualItem, () => props.entries)

        return (
          <Show keyed when={row()}>
            {(current) => {
              const measure = attachRowMeasurement(props.virtualizer)
              return renderRow()(
                current.item,
                current.index,
                props.rowProps(current, virtualItem, measure),
              )
            }}
          </Show>
        )
      }}
    </For>
  )
}

/** `scrollToIndex` of a controller's mounted instance; a no-op before it mounts. */
export function scrollToIndexOf<
  TScrollElement extends HTMLElement,
  TItemElement extends HTMLElement,
>(
  instance: Accessor<Virtualizer<TScrollElement, TItemElement> | undefined>,
): Virtualizer<TScrollElement, TItemElement>['scrollToIndex'] {
  return (index, scrollOptions) => instance()?.scrollToIndex(index, scrollOptions)
}

type OffsetCallback = (offset: number, isScrolling: boolean) => void

// Same check as `@tanstack/virtual-core`; servers report support so no fallback timer starts.
const SUPPORTS_SCROLLEND = typeof window === 'undefined' ? true : 'onscrollend' in window

const PASSIVE_LISTENER = { passive: true } as const

/**
 * Creates an `observeElementOffset` option that shares one set of scroll listeners per scroll
 * element. Virtualizers on the same element, such as the rows and columns of a table, then get
 * their offsets inside one `batch`, so one scroll event runs downstream computations once.
 *
 * Mirrors `observeOffset` from `@tanstack/virtual-core` 3.19.6: `scrollend` when
 * `useScrollendEvent` is set and supported, otherwise an `isScrollingResetDelay` timer, and a
 * negated horizontal offset in RTL. Recheck it when upgrading `@tanstack/virtual-core`. The first
 * virtualizer that subscribes to an element decides its `scrollend` and delay settings.
 */
export function createSharedElementOffsetObserver(): <
  TScrollElement extends HTMLElement,
  TItemElement extends HTMLElement,
>(
  instance: Virtualizer<TScrollElement, TItemElement>,
  callback: OffsetCallback,
) => (() => void) | undefined {
  interface Subscriber {
    readonly instance: Virtualizer<HTMLElement, HTMLElement>
    readonly callback: OffsetCallback
  }
  interface Listener {
    readonly subscribers: Set<Subscriber>
    readonly dispose: () => void
  }
  const listeners = new Map<HTMLElement, Listener>()

  const readOffset = (instance: Subscriber['instance'], element: HTMLElement): number => {
    const { horizontal, isRtl } = instance.options
    return horizontal ? element.scrollLeft * (isRtl ? -1 : 1) : element.scrollTop
  }

  const listen = (
    element: HTMLElement,
    targetWindow: Window & typeof globalThis,
    first: Subscriber['instance'],
  ): Listener => {
    const subscribers = new Set<Subscriber>()
    const notify = (isScrolling: boolean) =>
      batch(() => {
        for (const subscriber of subscribers) {
          subscriber.callback(readOffset(subscriber.instance, element), isScrolling)
        }
      })
    const useScrollend = first.options.useScrollendEvent && SUPPORTS_SCROLLEND
    const resetDelay = first.options.isScrollingResetDelay
    let resetTimer: number | undefined
    const onScroll = () => {
      if (!useScrollend) {
        targetWindow.clearTimeout(resetTimer)
        resetTimer = targetWindow.setTimeout(() => notify(false), resetDelay)
      }
      notify(true)
    }
    const onScrollEnd = () => notify(false)

    const detach = attachEventListenerMap(
      element,
      { scroll: onScroll, scrollend: useScrollend ? onScrollEnd : undefined },
      PASSIVE_LISTENER,
    )
    return {
      subscribers,
      dispose: () => {
        detach()
        targetWindow.clearTimeout(resetTimer)
      },
    }
  }

  return (instance, callback) => {
    const element = instance.scrollElement
    const targetWindow = instance.targetWindow
    if (!element || !targetWindow) {
      return undefined
    }
    const source = instance as unknown as Subscriber['instance']
    let listener = listeners.get(element)
    if (!listener) {
      listener = listen(element, targetWindow, source)
      listeners.set(element, listener)
    }
    const subscriber: Subscriber = { instance: source, callback }
    listener.subscribers.add(subscriber)
    const current = listener
    return () => {
      current.subscribers.delete(subscriber)
      if (current.subscribers.size === 0) {
        current.dispose()
        if (listeners.get(element) === current) {
          listeners.delete(element)
        }
      }
    }
  }
}
