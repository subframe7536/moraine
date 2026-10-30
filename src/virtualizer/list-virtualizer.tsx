import type { VirtualItem, Virtualizer } from '@tanstack/virtual-core'
import type { Accessor, Component, JSX } from 'solid-js'

import type { ListVirtualizer, VirtualRenderProps, VirtualRowProps } from '../shared/virtual'

import { VirtualRows, createVirtualizerController, scrollToIndexOf } from './virtualizer-core'
import type { VirtualizerAdapterOptions } from './virtualizer-core'

export type ListVirtualizerOptions<TItem> = VirtualizerAdapterOptions<TItem> & {
  /** Enables RTL horizontal placement and scrolling. Must match the scroll container's `dir`. */
  isRtl?: boolean
}

export interface ListVirtualizerReturn<TItem> extends ListVirtualizer<TItem> {
  /** Current low-level virtualizer instance, available after virtual content mounts. */
  readonly instance: Accessor<Virtualizer<HTMLElement, HTMLElement> | undefined>
}

/**
 * Creates a virtualizer for `List`, `Tree`, `Select`, `Combobox`, `MultiSelect`, and
 * `CommandPalette`. Pass the result to the component's `virtualizer` prop.
 */
export function createListVirtualizer<TItem>(
  options: ListVirtualizerOptions<TItem>,
): ListVirtualizerReturn<TItem> {
  const controller = createVirtualizerController<TItem>(options)

  const virtualRender: Component<VirtualRenderProps<TItem>> = (props) => {
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
        <VirtualRows<TItem, HTMLElement, VirtualRowProps>
          virtualizer={virtualizer}
          virtualItems={virtualItems}
          entries={props.entries}
          render={props.render}
          rowProps={(current, virtualItem, measure) => ({
            'data-index': current.index,
            ref: measure,
            style: rowStyle(virtualItem),
          })}
        />
      </div>
    )
  }

  return {
    instance: controller.instance,
    virtualRender,
    scrollToIndex: scrollToIndexOf(controller.instance),
  }
}
