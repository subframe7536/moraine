import { Select } from '@src'
import type { SelectT } from '@src'
import { useListVirtualizer } from '@src/virtualizer'

const OPTIONS: SelectT.Item<string>[] = Array.from({ length: 10_000 }, (_, index) => ({
  value: `option-${index}`,
  label: `Option ${index + 1}`,
}))

export function Virtualization() {
  const virtualizer = useListVirtualizer<
    SelectT.Row<SelectT.Item<string>>,
    HTMLDivElement,
    HTMLDivElement
  >({
    estimateSize: (entry) => (entry.type === 'label' ? 30 : 32),
    getItemKey: (entry) => entry.key,
    overscan: 8,
  })

  return (
    <div class="w-80">
      <Select
        items={OPTIONS}
        placeholder="Pick one of 10,000 items..."
        virtualRender={virtualizer.virtualRender}
        scrollToItem={(_, entryIndex) => virtualizer.scrollToIndex(entryIndex)}
        classes={{ listbox: 'h-80 max-h-80' }}
      />
    </div>
  )
}
