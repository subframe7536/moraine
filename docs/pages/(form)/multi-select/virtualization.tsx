import { MultiSelect } from '@src'
import type { MultiSelectT } from '@src'
import { useListVirtualizer } from '@src/utils.ts'

const OPTIONS: MultiSelectT.Item<string>[] = Array.from({ length: 10_000 }, (_, index) => ({
  value: `option-${index}`,
  label: `Option ${index + 1}`,
}))

export function Virtualization() {
  const virtualizer = useListVirtualizer<
    MultiSelectT.VirtualEntry<string>,
    HTMLDivElement,
    HTMLDivElement
  >({
    estimateSize: (entry) => (entry.type === 'label' ? 30 : 32),
    getItemKey: (entry) => entry.key,
    overscan: 8,
  })

  return (
    <div class="w-80">
      <MultiSelect
        options={OPTIONS}
        placeholder="Pick from 10,000 options..."
        virtualRender={virtualizer.virtualRender}
        scrollToItem={(_, entryIndex) => virtualizer.scrollToIndex(entryIndex)}
        classes={{ listbox: 'h-80 max-h-80' }}
      />
    </div>
  )
}
