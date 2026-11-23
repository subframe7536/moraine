import {
  Virtualizer,
  elementScroll,
  observeElementOffset,
  observeElementRect,
} from '@tanstack/virtual-core'
import type { Range as VirtualRange, VirtualItem, VirtualizerOptions } from '@tanstack/virtual-core'
import type { Accessor } from 'solid-js'
import {
  createRenderEffect,
  createSignal,
  createStore,
  flush,
  getOwner,
  merge,
  onCleanup,
  onSettled,
  reconcile,
} from 'solid-js'

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

/** Options shared by the list and table virtualizers. Each maps to the TanStack option of its name. */
export interface VirtualizerAdapterOptions<TItem> {
  /**
   * Estimated size in px of a row along the scroll axis (height, or width when `horizontal`), used until its element has been measured.
   * Rows are measured after they render, so a rough value is enough; a closer one reduces scrollbar jumps.
   * It is read reactively: when the estimate of an item changes, its cached measurement is discarded.
   */
  estimateSize: (item: TItem, index: number) => number
  /**
   * Returns a stable key for a row. Measured sizes are cached by key, so with stable keys they follow their items when rows are inserted, removed, or reordered.
   * @default the item index
   */
  getItemKey?: (item: TItem, index: number) => string | number | bigint
  /**
   * Space in px between adjacent rows.
   * @default 0
   */
  gap?: number
  /**
   * Number of extra rows rendered before and after the visible range, which reduces blank flashes during fast scrolling at the cost of more mounted rows.
   * It is passed to `rangeExtractor` as `range.overscan`, so a custom extractor decides whether to apply it.
   * @default 1
   */
  overscan?: number
  /**
   * Chooses which row indexes are rendered, replacing the default visible range plus `overscan`. Receives the visible range (`startIndex`, `endIndex`, `overscan`, `count`) and returns the indexes to render.
   * Use it to keep a row mounted while it is scrolled out of view, such as the row being dragged; `sortable.rangeExtractor` from `moraine/dnd` does this.
   */
  rangeExtractor?: (range: VirtualRange) => number[]
  /**
   * Space in px before the first row inside the scroll element, such as a header that scrolls with the rows. It offsets row positions and scroll-to-index targets.
   * An explicit value wins over any value the host measures from the DOM.
   * @default 0
   */
  scrollMargin?: number
  /**
   * Space in px covered at the start edge while scrolling, such as a sticky header, so `scrollToIndex` does not leave a row underneath it.
   * An explicit value wins over any value the host measures from the DOM.
   * @default 0
   */
  scrollPaddingStart?: number
  /**
   * Space in px covered at the end edge while scrolling, such as a sticky footer, so `scrollToIndex` does not leave a row underneath it.
   * An explicit value wins over any value the host measures from the DOM.
   * @default 0
   */
  scrollPaddingEnd?: number
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
  options: VirtualizerAdapterOptions<TItem>,
): {
  /** Current low-level virtualizer instance, available after virtual content mounts. */
  readonly instance: Accessor<Virtualizer<TScrollElement, TItemElement> | undefined>
  /**
   * `scrollToIndex` of the mounted instance. A call made while the adapter is attached but not yet
   * mounted is kept and replayed once the instance is published, so a host can scroll to its
   * initial entry right after mounting the content; calls with nothing attached are ignored.
   */
  scrollToIndex: Virtualizer<TScrollElement, TItemElement>['scrollToIndex']
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
  const [instance, setInstance] = createSignal<
    Virtualizer<TScrollElement, TItemElement> | undefined
  >(undefined, { ownedWrite: true })
  type ScrollRequest = Parameters<Virtualizer<TScrollElement, TItemElement>['scrollToIndex']>
  let attached = 0
  let pendingScroll: ScrollRequest | undefined

  return {
    instance,
    scrollToIndex: (...request) => {
      const current = instance()
      if (current) {
        pendingScroll = undefined
        current.scrollToIndex(...request)
      } else if (attached > 0) {
        pendingScroll = request
      }
    },
    attach: (adapterProps) => {
      attached++
      onCleanup(() => {
        attached--
        if (attached === 0) {
          pendingScroll = undefined
        }
      })
      const [mounted, setMounted] = createSignal(false, { ownedWrite: true })
      const [virtualItems, setVirtualItems] = createStore<VirtualItem[]>([])
      const [totalSize, setTotalSize] = createSignal(0, { ownedWrite: true })
      const sync = (source: Virtualizer<TScrollElement, TItemElement>): void => {
        const apply = () => {
          setVirtualItems(reconcile(source.getVirtualItems(), 'index'))
          setTotalSize(source.getTotalSize())
        }
        // Store writes throw inside owned scopes; defer those to an unowned
        // microtask. Unowned callers (scroll listeners, microtasks) flush
        // their staged writes immediately.
        if (getOwner() !== null) {
          queueMicrotask(() => flush(apply))
        } else {
          flush(apply)
        }
      }
      let currentEntries: readonly TItem[] = []
      let currentKeys: VirtualItem['key'][] = []
      let currentEstimates: number[] = []
      let initialized = false
      const virtualizerOptions = merge(
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
            return adapterProps.layout?.().isRtl ?? false
          },
          getScrollElement: () => (mounted() ? (adapterProps.scrollElement() ?? null) : null),
          estimateSize: (index: number) => currentEstimates[index]!,
          getItemKey: (index: number) => currentKeys[index] ?? index,
          indexAttribute: 'data-index',
          onChange: (source: Virtualizer<TScrollElement, TItemElement>) => {
            sync(source)
          },
        },
      ) satisfies VirtualizerOptions<TScrollElement, TItemElement>
      const virtualizer = new Virtualizer<TScrollElement, TItemElement>(virtualizerOptions)

      createRenderEffect(
        () => {
          const entries = adapterProps.entries()
          const getItemKey = options.getItemKey
          const estimateItem = adapterProps.estimateSize ?? options.estimateSize
          // Keys and estimates are computed here so reactive reads inside
          // `getItemKey` / `estimateSize` re-run the effect.
          return [
            entries,
            entries.map((item, index) => getItemKey?.(item, index) ?? index),
            entries.map((item, index) => estimateItem(item, index)),
            virtualizerOptions.getScrollElement(),
          ] as const
        },
        ([entries, nextKeys, nextEstimates]) => {
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
          // A new `getItemKey` identity is what makes TanStack recompute measurements: its
          // `getMeasurementOptions` memo depends on `count`, `getItemKey`, and other options but not
          // on the keys themselves. Recheck this when upgrading `@tanstack/virtual-core`.
          virtualizer.setOptions(
            layoutChanged
              ? {
                  ...virtualizerOptions,
                  getItemKey: (index: number) => currentKeys[index] ?? index,
                }
              : virtualizerOptions,
          )

          if (mounted()) {
            virtualizer._willUpdate()
          }
          sync(virtualizer)
        },
      )

      // `setOptions` snapshots getters, so re-apply options when measured layout changes.
      createRenderEffect(
        () => adapterProps.layout?.(),
        () => {
          virtualizer.setOptions(virtualizerOptions)
          if (mounted()) {
            virtualizer._willUpdate()
          }
          sync(virtualizer)
        },
        { defer: true },
      )

      onSettled(() => {
        const cleanupVirtualizer = virtualizer._didMount()
        let active = true

        queueMicrotask(() => {
          if (!active) {
            return
          }
          // Signal writes outside an owned scope need an explicit flush.
          flush(() => {
            setInstance(virtualizer)
            setMounted(true)
          })
          // Replay after `mounted` so the scroll element and measurements are in place.
          const request = pendingScroll
          pendingScroll = undefined
          if (request) {
            virtualizer.scrollToIndex(...request)
          }
          // The mount flush re-attached the virtualizer; publish its items
          // from this unowned frame instead of deferring another microtask.
          sync(virtualizer)
        })

        return () => {
          active = false
          cleanupVirtualizer()
          setInstance((current) => (current === virtualizer ? undefined : current))
        }
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
