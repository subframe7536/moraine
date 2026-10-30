import { Select } from '@src'
import type { SelectT } from '@src'
import { createListVirtualizer } from '@src/virtualizer'

const ITEMS: SelectT.Item<string>[] = Array.from({ length: 10_000 }, (_, index) => ({
  value: `option-${index}`,
  label: `Option ${index + 1}`,
}))

export function Virtualization() {
  const virtualizer = createListVirtualizer<SelectT.Row<SelectT.Item<string>>>({
    estimateSize: (entry) => (entry.type === 'label' ? 30 : 32),
    getItemKey: (entry) => entry.key,
    overscan: 8,
  })

  return (
    <div class="max-w-xs w-full">
      <Select
        items={ITEMS}
        placeholder="Pick one of 10,000 options"
        virtualizer={virtualizer}
        classes={{ listbox: 'h-80 max-h-80' }}
      />
    </div>
  )
}
