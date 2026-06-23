import { Select } from '@src'
import type { SelectT } from '@src'

export function Searchable() {
  const FRUIT_OPTIONS: SelectT.Item[] = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Cherry', value: 'cherry' },
    { label: 'Date', value: 'date' },
    { label: 'Elderberry', value: 'elderberry', disabled: true },
    { label: 'Forest', value: 'forest', icon: 'i-lucide:braces' },
  ]

  return (
    <div class="w-80">
      <Select
        options={FRUIT_OPTIONS}
        search
        leadingIcon="i-lucide-search"
        placeholder="Search fruits..."
      />
    </div>
  )
}
