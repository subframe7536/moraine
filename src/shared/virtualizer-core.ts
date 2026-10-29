import {
  Virtualizer,
  elementScroll,
  observeElementOffset,
  observeElementRect,
} from '@tanstack/virtual-core'
import type { PartialKeys, VirtualItem, VirtualizerOptions } from '@tanstack/virtual-core'
import type { Accessor } from 'solid-js'
import {
  createMemo,
  createRenderEffect,
  createSignal,
  mergeProps,
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
        setVirtualItems(reconcile(source.getVirtualItems(), { key: 'index' }))
        setTotalSize(source.getTotalSize())
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
        const nextEstimates = entries.map((item, index) => options.estimateSize(item, index))
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
