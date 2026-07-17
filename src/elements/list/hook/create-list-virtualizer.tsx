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
  createComputed,
  createEffect,
  createSignal,
  mergeProps,
  onCleanup,
  onMount,
} from 'solid-js'
import { createStore, reconcile } from 'solid-js/store'

import type { ListT } from '../list'

type VirtualItemKey = string | number | bigint
type ListVirtualizerCoreOptions<
  TScrollElement extends Element,
  TItemElement extends Element,
> = PartialKeys<
  VirtualizerOptions<TScrollElement, TItemElement>,
  'observeElementRect' | 'observeElementOffset' | 'scrollToFn'
>

export namespace ListVirtualizerT {
  export type Options<
    TItem,
    TScrollElement extends HTMLElement = HTMLElement,
    TItemElement extends HTMLElement = HTMLElement,
  > = Omit<
    ListVirtualizerCoreOptions<TScrollElement, TItemElement>,
    'count' | 'estimateSize' | 'getItemKey' | 'getScrollElement' | 'indexAttribute'
  > & {
    /** Estimated row size before its element has been measured. */
    estimateSize: (item: TItem, index: number) => number
    /** Stable row key. The item index is used by default. */
    getItemKey?: (item: TItem, index: number) => VirtualItemKey
  }

  export interface Return<
    TItem,
    TScrollElement extends HTMLElement = HTMLElement,
    TItemElement extends HTMLElement = HTMLElement,
  > {
    /** Current low-level virtualizer instance, available after virtual content mounts. */
    readonly instance: Accessor<Virtualizer<TScrollElement, TItemElement> | undefined>
    /** Component passed directly to a List-compatible `virtualRender` prop. */
    readonly virtualRender: Component<ListT.VirtualRenderProps<TItem, TScrollElement, TItemElement>>
    scrollToIndex: Virtualizer<TScrollElement, TItemElement>['scrollToIndex']
  }
}

/** Creates a ready-to-use virtual renderer for List and List-based components. */
export function createListVirtualizer<
  TItem,
  TScrollElement extends HTMLElement = HTMLElement,
  TItemElement extends HTMLElement = HTMLElement,
>(
  options: ListVirtualizerT.Options<TItem, TScrollElement, TItemElement>,
): ListVirtualizerT.Return<TItem, TScrollElement, TItemElement> {
  const [instance, setInstance] = createSignal<Virtualizer<TScrollElement, TItemElement>>()

  const virtualRender: Component<ListT.VirtualRenderProps<TItem, TScrollElement, TItemElement>> = (
    props,
  ) => {
    const virtualizerOptions = mergeProps(options, {
      get count() {
        return props.entries.length
      },
      getScrollElement: () => props.scrollElement ?? null,
      estimateSize: (index: number) => options.estimateSize(props.entries[index]!, index),
      getItemKey: (index: number) => options.getItemKey?.(props.entries[index]!, index) ?? index,
      indexAttribute: 'data-index',
    })
    const resolvedOptions = mergeProps(
      {
        observeElementRect,
        observeElementOffset,
        scrollToFn: elementScroll,
      },
      virtualizerOptions,
    ) as VirtualizerOptions<TScrollElement, TItemElement>
    const virtualizer = new Virtualizer<TScrollElement, TItemElement>(resolvedOptions)
    const [virtualItems, setVirtualItems] = createStore(virtualizer.getVirtualItems())
    const [totalSize, setTotalSize] = createSignal(virtualizer.getTotalSize())
    let mounted = false // todo)) get rid of mounted

    const sync = (source: Virtualizer<TScrollElement, TItemElement>): void => {
      setVirtualItems(reconcile(source.getVirtualItems(), { key: 'index' }))
      setTotalSize(source.getTotalSize())
    }
    // todo)) inline duplicate mergeProps
    const reactiveOptions = mergeProps(resolvedOptions, {
      onChange: (source: Virtualizer<TScrollElement, TItemElement>, synchronous: boolean) => {
        if (!mounted) {
          return
        }
        source._willUpdate()
        sync(source)
        options.onChange?.(source, synchronous)
      },
    })

    // todo)) get rid of createComputed
    createComputed(() => {
      virtualizer.setOptions(reactiveOptions)
      if (mounted) {
        virtualizer._willUpdate()
      }
      sync(virtualizer)
    })

    // A scroll ref can arrive after the virtual content mounts. Track it separately
    // and only attach observers after Solid has connected the element to the DOM.
    createEffect(() => {
      virtualizerOptions.getScrollElement()
      if (mounted) {
        virtualizer._willUpdate()
        sync(virtualizer)
      }
    })

    onMount(() => {
      mounted = true
      setInstance(() => virtualizer)
      const cleanup = virtualizer._didMount()
      virtualizer._willUpdate()
      sync(virtualizer)

      onCleanup(() => {
        mounted = false
        cleanup()
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
          {(virtualItem) =>
            props.render(props.entries[virtualItem.index]!, virtualItem.index, {
              'data-index': virtualItem.index,
              ref: (element) => {
                // Solid invokes spread refs before all following attributes are applied.
                // Defer measurement so data attributes, styles, and children affect its size.
                element.dataset.index = String(virtualItem.index)
                queueMicrotask(() => {
                  if (element.isConnected) {
                    virtualizer.measureElement(element)
                  }
                })
              },
              style: rowStyle(virtualItem),
            })
          }
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
