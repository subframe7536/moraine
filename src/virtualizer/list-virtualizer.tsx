import type { JSX } from '@solidjs/web'
import type { VirtualItem, Virtualizer } from '@tanstack/virtual-core'
import type { Accessor, Component } from 'solid-js'
import { createEffect, createMemo, createSignal } from 'solid-js'

import { createVirtualizerController } from './controller'
import type { VirtualizerAdapterOptions } from './controller'
import { VirtualRows } from './virtual-rows'
import type { ListVirtualizer, VirtualRenderProps, VirtualRowProps } from './virtualizer.types'
export type ListVirtualizerOptions<TItem> = VirtualizerAdapterOptions<TItem> & {
  /**
   * Lays rows out side by side and scrolls horizontally. Sizes (`estimateSize`, `gap`, scroll padding) then apply to widths.
   * In a scroll container whose computed `direction` is `rtl`, rows start at the right edge.
   * @default false
   */
  horizontal?: boolean
}

export interface ListVirtualizerReturn<TItem> extends ListVirtualizer<TItem> {
  /** Current low-level virtualizer instance, available after virtual content mounts. */
  readonly instance: Accessor<Virtualizer<HTMLElement, HTMLElement> | undefined>
}

/**
 * Creates a virtualizer for `List`, `Tree`, `Combobox`, `MultiSelect`, and `CommandPalette`. Pass the result to the component's `virtualizer` prop.
 */
export function createListVirtualizer<TItem>(
  options: ListVirtualizerOptions<TItem>,
): ListVirtualizerReturn<TItem> {
  const controller = createVirtualizerController<TItem>(options)

  const virtualRender: Component<VirtualRenderProps<TItem>> = (props) => {
    // A right-to-left container places rows from its right edge, and its `scrollLeft` counts down
    // from 0. The direction is read once the scroll element is mounted.
    const [rtl, setRtl] = createSignal(false)
    createEffect(
      () => props.scrollElement,
      (element) => {
        if (element) {
          setRtl(getComputedStyle(element).direction === 'rtl')
        }
      },
    )
    const layout = createMemo(() => ({ isRtl: rtl() }))
    const { virtualizer, virtualItems, totalSize } = controller.attach({
      entries: () => props.entries,
      scrollElement: () => props.scrollElement,
      layout,
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

    // Store arrays are shallow: `<For>` rows hold raw records whose fields
    // `reconcile` mutates in place, so `virtualItem.start` never notifies.
    // Reading the slot through the store keeps the style binding tracked.
    const rowStart = (virtualItem: VirtualItem): number =>
      virtualItems.find((item) => item === virtualItem)?.start ?? virtualItem.start

    // Reads run inside the tracked `style` getter of the row props, so
    // positions and direction stay reactive.
    const rowStyle = (virtualItem: VirtualItem): JSX.CSSProperties => {
      const offset = rowStart(virtualItem) - virtualizer.options.scrollMargin
      const isRtl = rtl()
      return virtualizer.options.horizontal
        ? {
            height: '100%',
            position: 'absolute',
            right: isRtl ? '0' : undefined,
            top: '0',
            transform: `translateX(${isRtl ? -offset : offset}px)`,
            left: isRtl ? undefined : '0',
          }
        : {
            left: '0',
            position: 'absolute',
            top: '0',
            transform: `translateY(${offset}px)`,
            width: '100%',
          }
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
            // Style-object keys apply eagerly; the `style` prop itself must be
            // a getter so position changes re-derive the object tracked.
            get style() {
              return rowStyle(virtualItem)
            },
          })}
        />
      </div>
    )
  }

  return {
    instance: controller.instance,
    virtualRender,
    scrollToIndex: controller.scrollToIndex,
  }
}
