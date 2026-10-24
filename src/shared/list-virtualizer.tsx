import type { VirtualItem, Virtualizer } from '@tanstack/virtual-core'
import type { Accessor, Component, JSX } from 'solid-js'
import { For, Show, createMemo } from 'solid-js'

import type { ListT } from '../components/list/list.types'

import { attachRowMeasurement, createVirtualizerController } from './virtualizer-core'
import type { VirtualizerAdapterOptions } from './virtualizer-core'

export type ListVirtualizerOptions<
  TItem,
  TScrollElement extends HTMLElement = HTMLElement,
  TItemElement extends HTMLElement = HTMLElement,
> = VirtualizerAdapterOptions<TItem, TScrollElement, TItemElement> & {
  /** Enables RTL horizontal placement and scrolling. Must match the scroll container's `dir`. */
  isRtl?: boolean
}

export type VirtualRenderProps<
  TItem,
  TScrollElement extends HTMLElement = HTMLElement,
  TItemElement extends HTMLElement = HTMLElement,
> = ListT.VirtualRenderProps<TItem, TScrollElement, TItemElement>

export type RowProps<TItemElement extends HTMLElement = HTMLElement> = ListT.RowProps<TItemElement>

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
export function createListVirtualizer<
  TItem,
  TScrollElement extends HTMLElement = HTMLElement,
  TItemElement extends HTMLElement = HTMLElement,
>(
  options: ListVirtualizerOptions<TItem, TScrollElement, TItemElement>,
): ListVirtualizerReturn<TItem, TScrollElement, TItemElement> {
  const controller = createVirtualizerController<TItem, TScrollElement, TItemElement>(options)

  const virtualRender: Component<VirtualRenderProps<TItem, TScrollElement, TItemElement>> = (
    props,
  ) => {
    const renderRow = createMemo(() => props.render)
    const { virtualizer, virtualItems, totalSize } = controller.attach({
      entries: () => props.entries,
      scrollElement: () => props.scrollElement,
    })

    const contentStyle = (): JSX.CSSProperties =>
      virtualizer.options.horizontal
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
      virtualizer.options.horizontal
        ? {
            height: '100%',
            position: 'absolute',
            get right() {
              return virtualizer.options.isRtl ? '0' : undefined
            },
            top: '0',
            get transform() {
              const offset = virtualItem.start - virtualizer.options.scrollMargin
              return `translateX(${virtualizer.options.isRtl ? -offset : offset}px)`
            },
            get left() {
              return virtualizer.options.isRtl ? undefined : '0'
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
            const row = createMemo(
              () => ({
                index: virtualItem.index,
                item: props.entries[virtualItem.index]!,
              }),
              undefined,
              {
                equals: (prev, next) => prev?.index === next.index && prev?.item === next.item,
              },
            )

            return (
              <Show keyed when={row()}>
                {(current) => {
                  const measure = attachRowMeasurement(virtualizer)

                  return renderRow()(current.item, current.index, {
                    'data-index': current.index,
                    ref: measure,
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
    instance: controller.instance,
    virtualRender,
    scrollToIndex: (index, scrollOptions) =>
      controller.instance()?.scrollToIndex(index, scrollOptions),
  }
}
