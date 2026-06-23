import { Select } from '@src'
import type { SelectT } from '@src'
import { createSignal } from 'solid-js'

export function SingleSelect() {
  const FRUIT_OPTIONS: SelectT.Item[] = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Cherry', value: 'cherry' },
    { label: 'Date', value: 'date' },
    { label: 'Elderberry', value: 'elderberry', disabled: true },
    { label: 'Forest', value: 'forest', icon: 'i-lucide:braces' },
  ]

  const [singleValue, setSingleValue] = createSignal<SelectT.Value | null>(null)

  return (
    <div class="w-80 space-y-2">
      <Select
        options={FRUIT_OPTIONS}
        value={singleValue()}
        onChange={setSingleValue}
        placeholder="Pick a fruit..."
      />
      <p class="text-xs text-muted-foreground">Selected: {singleValue() ?? 'none'}</p>
    </div>
  )
}
