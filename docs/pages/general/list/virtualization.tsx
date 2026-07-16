import { List } from '@src'
import type { ListT } from '@src'
import { createVirtualizer } from '@tanstack/solid-virtual'
import { For } from 'solid-js'

export function Virtualization() {
  const ITEMS = Array.from({ length: 10_000 }, (_, index) => ({
    id: index + 1,
    label: `Result ${index + 1}`,
  }))

  type Item = (typeof ITEMS)[number]

  function VirtualRender(props: ListT.VirtualRenderProps<Item, HTMLElement, HTMLDivElement>) {
    const virtualizer = createVirtualizer<HTMLElement, HTMLDivElement>({
      get count() {
        return props.entries.length
      },
      getScrollElement: () => props.scrollElement ?? null,
      estimateSize: () => 36,
      getItemKey: (index) => props.entries[index]?.id ?? index,
      overscan: 8,
    })

    return (
      <div class="w-full relative" style={{ height: `${virtualizer.getTotalSize()}px` }}>
        <For each={virtualizer.getVirtualItems()}>
          {(virtualRow) =>
            props.render(props.entries[virtualRow.index]!, virtualRow.index, {
              class: 'w-full left-0 top-0 absolute',
              style: {
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              },
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
      aria-label="Virtual results"
      class="border border-border rounded-md h-72 w-full overflow-y-auto"
      itemRender={(context) => (
        <div {...context.props} role="listitem">
          <div class="px-3 border-b border-border flex h-9 items-center">{context.item.label}</div>
        </div>
      )}
    />
  )
}
