import { Select } from '@src'
import type { SelectT } from '@src'

export function TriggerOnlyOpen() {
  const FRUIT_OPTIONS: SelectT.Items[] = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Cherry', value: 'cherry' },
    { label: 'Date', value: 'date' },
    { label: 'Elderberry', value: 'elderberry', disabled: true },
    { label: 'Forest', value: 'forest', icon: 'i-lucide:braces' },
  ]

  return (
    <div class="max-w-sm">
      <Select
        options={FRUIT_OPTIONS}
        openOnClick="trigger"
        placeholder="Click trigger icon to open..."
      />
    </div>
  )
}
