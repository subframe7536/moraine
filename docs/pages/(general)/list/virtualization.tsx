import { List } from '@src'
import { useListVirtualizer } from '@src/utils'

export function Virtualization() {
  const ITEMS = Array.from({ length: 10_000 }, (_, index) => ({
    id: index + 1,
    label: `Result ${index + 1}`,
  }))

  type Item = (typeof ITEMS)[number]

  const virtualizer = useListVirtualizer<Item, HTMLElement, HTMLDivElement>({
    estimateSize: () => 36,
    getItemKey: (item) => item.id,
    overscan: 8,
  })

  return (
    <List
      as="div"
      items={ITEMS}
      virtualRender={virtualizer.virtualRender}
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
