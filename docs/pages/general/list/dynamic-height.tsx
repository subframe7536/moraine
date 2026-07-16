import { List } from '@src'
import type { ListT } from '@src'
import { createVirtualizer } from '@tanstack/solid-virtual'
import { For } from 'solid-js'

export function DynamicHeight() {
  const ITEMS = Array.from({ length: 1_000 }, (_, index) => ({
    id: index + 1,
    label: `Result ${index + 1}`,
    details: Array.from(
      { length: (index % 4) + 1 },
      (_, detailIndex) => `Detail line ${detailIndex + 1} for result ${index + 1}.`,
    ),
  }))

  type Item = (typeof ITEMS)[number]

  function VirtualRender(props: ListT.VirtualRenderProps<Item, HTMLElement, HTMLDivElement>) {
    const virtualizer = createVirtualizer<HTMLElement, HTMLDivElement>({
      get count() {
        return props.entries.length
      },
      getScrollElement: () => props.scrollElement ?? null,
      estimateSize: () => 112,
      getItemKey: (index) => props.entries[index]?.id ?? index,
      overscan: 8,
    })

    return (
      <div class="w-full relative" style={{ height: `${virtualizer.getTotalSize()}px` }}>
        <For each={virtualizer.getVirtualItems()}>
          {(virtualRow) =>
            props.render(props.entries[virtualRow.index]!, virtualRow.index, {
              'data-index': virtualRow.index,
              ref: (element) => {
                queueMicrotask(() => {
                  if (element.isConnected) {
                    virtualizer.measureElement(element)
                  }
                })
              },
              class: 'w-full left-0 top-0 absolute',
              style: { transform: `translateY(${virtualRow.start}px)` },
            })
          }
        </For>
      </div>
    )
  }

  return (
    <List
      as="div"
      items={ITEMS}
      virtualRender={VirtualRender}
      role="list"
      aria-label="Variable-height results"
      class="border border-border rounded-md h-80 w-full overflow-y-auto"
      itemRender={(context) => (
        <div {...context.props} role="listitem">
          <div class="px-3 py-2 border-b border-border">
            <div class="font-medium">{context.item.label}</div>
            <div class="text-sm text-muted-foreground">
              <For each={context.item.details}>
                {(detail) => <span class="block">{detail}</span>}
              </For>
            </div>
          </div>
        </div>
      )}
    />
  )
}
