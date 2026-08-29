import { Select } from '@src'
import type { SelectT } from '@src'

export function States() {
  const FRUIT_OPTIONS: SelectT.Item[] = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Cherry', value: 'cherry' },
    { label: 'Date', value: 'date' },
    { label: 'Elderberry', value: 'elderberry', disabled: true },
    { label: 'Forest', value: 'forest', icon: 'i-lucide:braces' },
  ]

  return (
    <div class="max-w-sm space-y-3">
      <Select options={FRUIT_OPTIONS} disabled value="apple" placeholder="Disabled selection" />
      <Select
        options={FRUIT_OPTIONS}
        defaultValue="banana"
        placeholder="An option can also be disabled"
      />
    </div>
  )
}
