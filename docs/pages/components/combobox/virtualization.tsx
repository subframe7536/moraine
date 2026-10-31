import { Combobox } from '@src'
import type { ComboboxT } from '@src'
import { createListVirtualizer } from '@src/virtualizer'

const ITEMS: ComboboxT.Item<string>[] = Array.from({ length: 10_000 }, (_, index) => ({
  value: `option-${index}`,
  label: `Option ${index + 1}`,
}))

export function Virtualization() {
  const virtualizer = createListVirtualizer<ComboboxT.Row<ComboboxT.Item<string>>>({
    estimateSize: (entry) => (entry.type === 'label' ? 30 : 32),
    getItemKey: (entry) => entry.key,
    overscan: 8,
  })

  return (
    <div class="max-w-xs w-full">
      <Combobox
        items={ITEMS}
        placeholder="Search 10,000 options..."
        leadingIcon="i-lucide:search"
        openOnControlClick
        virtualizer={virtualizer}
      />
    </div>
  )
}
