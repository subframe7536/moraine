import { createVirtualizer } from '@tanstack/solid-virtual'
import { For } from 'solid-js'

const ITEMS = Array.from({ length: 10_000 }, (_, index) => ({
  id: index + 1,
  label: `Result ${index + 1}`,
}))

export function Virtualization() {
  let scrollElement: HTMLDivElement | undefined

  const virtualizer = createVirtualizer<HTMLDivElement, HTMLDivElement>({
    count: ITEMS.length,
    getScrollElement: () => scrollElement ?? null,
    estimateSize: () => 36,
    getItemKey: (index) => ITEMS[index]?.id ?? index,
    overscan: 8,
  })

  return (
    <div
      ref={(e) => (scrollElement = e)}
      role="list"
      aria-label="Virtual results"
      class="border border-border rounded-md h-72 w-full overflow-y-auto"
    >
      <div class="w-full relative" style={{ height: `${virtualizer.getTotalSize()}px` }}>
        <For each={virtualizer.getVirtualItems()}>
          {(virtualRow) => {
            const item = ITEMS[virtualRow.index]!

            return (
              <div
                ref={(element) => {
                  element.dataset.index = String(virtualRow.index)
                  virtualizer.measureElement(element)
                }}
                role="listitem"
                class="w-full left-0 top-0 absolute"
                style={{ transform: `translateY(${virtualRow.start}px)` }}
              >
                <div class="px-3 border-b border-border flex h-9 items-center">{item.label}</div>
              </div>
            )
          }}
        </For>
      </div>
    </div>
  )
}
