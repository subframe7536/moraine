import {
  Virtualizer,
  elementScroll,
  observeElementOffset,
  observeElementRect,
} from '@tanstack/virtual-core'
import type { PartialKeys, VirtualItem, VirtualizerOptions } from '@tanstack/virtual-core'
import type { Accessor, Component, JSX } from 'solid-js'
import {
  For,
  Show,
  createMemo,
  createRenderEffect,
  createSignal,
  mergeProps,
  onCleanup,
  onMount,
} from 'solid-js'
import { createStore, reconcile } from 'solid-js/store'

export type ListVirtualizerOptions<
  TItem,
  TScrollElement extends HTMLElement = HTMLElement,
  TItemElement extends HTMLElement = HTMLElement,
> = Omit<
  PartialKeys<
    VirtualizerOptions<TScrollElement, TItemElement>,
    'observeElementRect' | 'observeElementOffset' | 'scrollToFn'
  >,
  'count' | 'estimateSize' | 'getItemKey' | 'getScrollElement' | 'indexAttribute'
> & {
  /** Estimated row size before its element has been measured. */
  estimateSize: (item: TItem, index: number) => number
  /** Stable row key. The item index is used by default. */
  getItemKey?: (item: TItem, index: number) => string | number | bigint
}

export type VirtualRenderProps<
  TItem,
  TScrollElement extends HTMLElement = HTMLElement,
  TItemElement extends HTMLElement = HTMLElement,
> = {
  /** Complete reactive collection, including structural entries such as group labels. */
  readonly entries: readonly TItem[]
  /** Current scroll container, or undefined while it is not mounted. */
  readonly scrollElement: TScrollElement | undefined
  /** Renders an item and forwards optional attributes to its final row element. */
  render: (item: TItem, index: number, props?: RowProps<TItemElement>) => JSX.Element
}

export type RowProps<TItemElement extends HTMLElement = HTMLElement> = Omit<
  JSX.HTMLAttributes<TItemElement>,
  'ref'
> & {
  ref?: (element: TItemElement) => void
  'data-index'?: number | string
}

export type ListVirtualizerReturn<
  TItem,
  TScrollElement extends HTMLElement = HTMLElement,
  TItemElement extends HTMLElement = HTMLElement,
> = {
  /** Current low-level virtualizer instance, available after virtual content mounts. */
  readonly instance: Accessor<Virtualizer<TScrollElement, TItemElement> | undefined>
  /** Component passed directly to a List-compatible `virtualRender` prop. */
  readonly virtualRender: Component<VirtualRenderProps<TItem, TScrollElement, TItemElement>>
  scrollToIndex: Virtualizer<TScrollElement, TItemElement>['scrollToIndex']
}

/** Creates a ready-to-use virtual renderer for List and List-based components. */
export function useListVirtualizer<
  TItem,
  TScrollElement extends HTMLElement = HTMLElement,
  TItemElement extends HTMLElement = HTMLElement,
>(
  options: ListVirtualizerOptions<TItem, TScrollElement, TItemElement>,
): ListVirtualizerReturn<TItem, TScrollElement, TItemElement> {
  const [instance, setInstance] = createSignal<Virtualizer<TScrollElement, TItemElement>>()

  const virtualRender: Component<VirtualRenderProps<TItem, TScrollElement, TItemElement>> = (
    props,
  ) => {
    const renderRow = props.render
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
        scrollToFn: elementScroll,
      },
      options,
      {
        get count() {
          return currentEntries.length
        },
        getScrollElement: () => (mounted() ? (props.scrollElement ?? null) : null),
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
      const entries = props.entries
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

      currentEntries = entries
      currentKeys = nextKeys
      currentEstimates = nextEstimates
      initialized = true
      virtualizerOptions.getScrollElement()
      virtualizer.setOptions(virtualizerOptions)

      if (layoutChanged) {
        const measuredElements = [...virtualizer.elementsCache.values()]
        virtualizer.measure()
        queueMicrotask(() => {
          virtualizer.measureElement(null)
          for (const element of measuredElements) {
            if (element.isConnected) {
              virtualizer.measureElement(element)
            }
          }
        })
      }

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

    const contentStyle = (): JSX.CSSProperties =>
      options.horizontal
        ? {
            height: '100%',
            position: 'relative',
            width: `${totalSize()}px`,
          }
        : {
            height: `${totalSize()}px`,
            position: 'relative',
            width: '100%',
          }

    const rowStyle = (virtualItem: VirtualItem): JSX.CSSProperties =>
      options.horizontal
        ? {
            height: '100%',
            left: '0',
            position: 'absolute',
            top: '0',
            get transform() {
              return `translateX(${virtualItem.start - virtualizer.options.scrollMargin}px)`
            },
          }
        : {
            left: '0',
            position: 'absolute',
            top: '0',
            get transform() {
              return `translateY(${virtualItem.start - virtualizer.options.scrollMargin}px)`
            },
            width: '100%',
          }

    return (
      <div style={contentStyle()}>
        <For each={virtualItems}>
          {(virtualItem) => {
            const row = createMemo(() => ({
              index: virtualItem.index,
              item: props.entries[virtualItem.index]!,
            }))

            return (
              <Show keyed when={row()}>
                {(current) => {
                  onCleanup(() => {
                    queueMicrotask(() => virtualizer.measureElement(null))
                  })

                  return renderRow(current.item, current.index, {
                    'data-index': current.index,
                    ref: (element) => {
                      // Solid invokes spread refs before all following attributes are applied.
                      // Defer measurement so data attributes, styles, and children affect its size.
                      queueMicrotask(() => {
                        if (element.isConnected) {
                          virtualizer.measureElement(element)
                        }
                      })
                    },
                    style: rowStyle(virtualItem),
                  })
                }}
              </Show>
            )
          }}
        </For>
      </div>
    )
  }

  return {
    instance,
    virtualRender,
    scrollToIndex: (index, scrollOptions) => instance()?.scrollToIndex(index, scrollOptions),
  }
}
