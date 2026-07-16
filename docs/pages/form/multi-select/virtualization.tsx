import { MultiSelect } from '@src'
import type { MultiSelectT } from '@src'
import { createVirtualizer } from '@tanstack/solid-virtual'
import { For, Show } from 'solid-js'

const OPTIONS: MultiSelectT.Item<string>[] = Array.from({ length: 10_000 }, (_, index) => ({
  value: `option-${index}`,
  label: `Option ${index + 1}`,
}))

export function Virtualization() {
  let scrollToIndex: ((index: number) => void) | undefined

  function VirtualRender(context: MultiSelectT.VirtualRenderProps<string>) {
    const virtualizer = createVirtualizer<HTMLDivElement, HTMLDivElement>({
      get count() {
        return context.entries.length
      },
      getScrollElement: () => context.scrollElement ?? null,
      estimateSize: () => 32,
      getItemKey: (index) => context.entries[index]?.key ?? index,
      overscan: 8,
    })
    scrollToIndex = (index) => virtualizer.scrollToIndex(index)

    return (
      <div class="w-full relative" style={{ height: `${virtualizer.getTotalSize()}px` }}>
        <For each={virtualizer.getVirtualItems()}>
          {(virtualRow) => (
            <Show when={context.entries[virtualRow.index]}>
              {(entry) =>
                context.render(entry(), virtualRow.index, {
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
    <div class="w-80">
      <MultiSelect
        options={OPTIONS}
        placeholder="Pick from 10,000 options..."
        virtualRender={VirtualRender}
        scrollToItem={(_, entryIndex) => scrollToIndex?.(entryIndex)}
        classes={{ listbox: 'h-80 max-h-80' }}
      />
    </div>
  )
}
