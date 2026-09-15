import { Combobox } from '@src'
import type { ComboboxT } from '@src'
import { useListVirtualizer } from '@src/virtualizer'

const ITEMS: ComboboxT.Item<string>[] = Array.from({ length: 10_000 }, (_, index) => ({
  value: `option-${index}`,
  label: `Option ${index + 1}`,
}))

export function Virtualization() {
  const virtualizer = useListVirtualizer<
    ComboboxT.Row<ComboboxT.Item<string>>,
    HTMLDivElement,
    HTMLDivElement
  >({
    estimateSize: (entry) => (entry.type === 'label' ? 30 : 32),
    getItemKey: (entry) => entry.key,
    overscan: 8,
  })

  return (
    <Combobox
      class="max-w-xs"
      items={ITEMS}
      placeholder="Search 10,000 options"
      virtualRender={virtualizer.virtualRender}
      scrollToItem={(_, entryIndex) => virtualizer.scrollToIndex(entryIndex)}
      classes={{ listbox: 'h-80 max-h-80' }}
    />
  )
}
