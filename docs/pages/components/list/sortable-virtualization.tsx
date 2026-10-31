import { List } from '@src'
import { createListSortable } from '@src/dnd'
import { createListVirtualizer } from '@src/virtualizer'
import { createSignal } from 'solid-js'

export function SortableVirtualization() {
  const [items, setItems] = createSignal(
    Array.from({ length: 5_000 }, (_, index) => ({ id: index + 1, label: `Track ${index + 1}` })),
  )

  type Item = ReturnType<typeof items>[number]

  const sortable = createListSortable({
    items,
    onReorder: (event) => setItems(event.items),
  })
  const virtualizer = createListVirtualizer<Item>({
    estimateSize: () => 36,
    getItemKey: (item) => item.id,
    overscan: 8,
    // Keeps the dragged row mounted while it is scrolled out of view.
    rangeExtractor: sortable.rangeExtractor,
  })

  return (
    <sortable.Provider>
      <div class="border border-border rounded-md w-full overflow-hidden">
        <List
          as="div"
          items={items()}
          virtualizer={virtualizer}
          role="list"
          aria-label="Playlist"
          class="h-72 overflow-y-auto"
          itemRender={(context) => {
            const row = sortable.useRow(context)
            return (
              <div
                {...row.props}
                role="listitem"
                class="bg-background cursor-grab data-[dnd-dragging]:opacity-60 data-[drop-position=after]:shadow-[inset_0_-2px_0_var(--primary)] data-[drop-position=before]:shadow-[inset_0_2px_0_var(--primary)]"
              >
                <div class="text-sm px-3 border-b border-border flex h-9 items-center">
                  {context.item.label}
                </div>
              </div>
            )
          }}
        />
      </div>
    </sortable.Provider>
  )
}
