import { List } from '@src'
import type { ListT } from '@src'
import { createVirtualizer } from '@tanstack/solid-virtual'
import { For, Show } from 'solid-js'

const ITEMS = Array.from({ length: 10_000 }, (_, index) => ({
  id: index + 1,
  label: `Result ${index + 1}`,
}))

export function Virtualization() {
  function virtualRender(
    context: ListT.VirtualRenderContext<(typeof ITEMS)[number], HTMLElement, HTMLDivElement>,
  ) {
    const virtualizer = createVirtualizer<HTMLElement, HTMLDivElement>({
      get count() {
        return context.entries.length
      },
      getScrollElement: () => context.scrollElement ?? null,
      estimateSize: () => 36,
      getItemKey: (index) => context.entries[index]?.id ?? index,
      overscan: 8,
    })

    return (
      <div class="w-full relative" style={{ height: `${virtualizer.getTotalSize()}px` }}>
        <For each={virtualizer.getVirtualItems()}>
          {(virtualRow) => (
            <Show when={context.entries[virtualRow.index]}>
              {(item) =>
                context.render(item(), virtualRow.index, {
                  ref: (element) => virtualizer.measureElement(element),
                  'data-index': virtualRow.index,
                  class: 'absolute left-0 top-0 w-full',
                  style: { transform: `translateY(${virtualRow.start}px)` },
                })
              }
            </Show>
          )}
        </For>
      </div>
    )
  }

  return (
    <List<(typeof ITEMS)[number], 'div', HTMLDivElement>
      as="div"
      role="list"
      aria-label="Virtual results"
      items={ITEMS}
      virtualRender={virtualRender}
      class="border border-border rounded-md h-72 overflow-y-auto"
      itemRender={(context) => (
        <div
          {...context.props}
          role="listitem"
          class={context.props?.class}
          style={context.props?.style}
        >
          <div class="px-3 border-b border-border flex h-9 items-center">{context.item.label}</div>
        </div>
      )}
    />
  )
}
