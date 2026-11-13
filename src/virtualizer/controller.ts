import {
  Virtualizer,
  elementScroll,
  observeElementOffset,
  observeElementRect,
} from '@tanstack/virtual-core'
import type { Range as VirtualRange, VirtualItem, VirtualizerOptions } from '@tanstack/virtual-core'
import type { Accessor } from 'solid-js'
import {
  batch,
  createRenderEffect,
  createSignal,
  mergeProps,
  on,
  onCleanup,
  onMount,
} from 'solid-js'
import { createStore, reconcile } from 'solid-js/store'

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
  /** Estimated row size in px before its element has been measured. */
  estimateSize: (item: TItem, index: number) => number
  /** Stable row key. The item index is used by default. */
  getItemKey?: (item: TItem, index: number) => string | number | bigint
  /** Space in px between adjacent rows. */
  gap?: number
  /** Extra rows rendered before and after the visible range. */
  overscan?: number
  /** Chooses the rendered indexes, such as a dragged row that stays mounted. */
  rangeExtractor?: (range: VirtualRange) => number[]
  /** Space in px before the first row, such as a header inside the scroll element. */
  scrollMargin?: number
  /** Space in px covered at the start edge while scrolling, such as a sticky header. */
  scrollPaddingStart?: number
  /** Space in px covered at the end edge while scrolling, such as a sticky footer. */
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
  options: VirtualizerAdapterOptions<TItem> & { readonly isRtl?: boolean },
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
  const [instance, setInstance] = createSignal<Virtualizer<TScrollElement, TItemElement>>()
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
            return options.isRtl ?? adapterProps.layout?.().isRtl ?? false
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

          batch(() => {
            setInstance(virtualizer)
            setMounted(true)
          })
          // Replay after `mounted` so the scroll element and measurements are in place.
          const request = pendingScroll
          pendingScroll = undefined
          if (request) {
            virtualizer.scrollToIndex(...request)
          }
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
