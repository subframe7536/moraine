import { List } from '@src'
import { useListVirtualizer } from '@src/utils'
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

  const virtualizer = useListVirtualizer<Item, HTMLElement, HTMLDivElement>({
    estimateSize: () => 96,
    getItemKey: (item) => item.id,
    gap: 8,
    overscan: 8,
  })

  return (
    <List
      as="div"
      items={ITEMS}
      virtualRender={virtualizer.virtualRender}
      role="list"
      aria-label="Variable-height results"
      class="border border-border rounded-md h-80 w-full overflow-y-auto"
      itemRender={(context) => (
        <div {...context.props} role="listitem">
          <div class="px-3 py-2 border border-border rounded-md">
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
