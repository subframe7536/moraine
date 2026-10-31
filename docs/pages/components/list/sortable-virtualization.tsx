import { List } from '@src'
import { createSortable } from '@src/dnd'
import { createListVirtualizer } from '@src/virtualizer'
import { createSignal } from 'solid-js'

export function SortableVirtualization() {
  const [items, setItems] = createSignal(
    Array.from({ length: 5_000 }, (_, index) => ({ id: index + 1, label: `Track ${index + 1}` })),
  )

  type Item = ReturnType<typeof items>[number]

  const virtualizer = createListVirtualizer<Item>({
    estimateSize: () => 36,
    getItemKey: (item) => item.id,
    overscan: 8,
  })
  const sortable = createSortable()

  return (
    <List
      as="div"
      items={items()}
      virtualizer={virtualizer}
      sortable={sortable}
      onReorder={(event) => setItems(event.items)}
      role="list"
      aria-label="Playlist"
      class="border border-border rounded-md h-72 w-full overflow-y-auto"
      itemRender={(context) => (
        <div
          {...context.props}
          role="listitem"
          class="bg-background cursor-grab data-[drop-position=after]:shadow-[inset_0_-2px_0_var(--primary)] data-[drop-position=before]:shadow-[inset_0_2px_0_var(--primary)] data-dragging:shadow-lg"
        >
          <div class="text-sm px-3 border-b border-border flex h-9 items-center">
            {context.item.label}
          </div>
        </div>
      )}
    />
  )
}
