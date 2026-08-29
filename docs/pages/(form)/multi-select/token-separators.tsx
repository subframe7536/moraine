import { MultiSelect } from '@src'
import type { MultiSelectT } from '@src'
import { createSignal } from 'solid-js'

export function TokenSeparators() {
  const FRUIT_OPTIONS: MultiSelectT.Item[] = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Cherry', value: 'cherry' },
    { label: 'Date', value: 'date' },
    { label: 'Elderberry', value: 'elderberry', disabled: true },
    { label: 'Forest', value: 'forest', icon: 'i-lucide:braces' },
  ]

  const [tagValues, setTagValues] = createSignal<MultiSelectT.Value[]>([])

  return (
    <div class="w-80 space-y-2">
      <MultiSelect
        search
        options={FRUIT_OPTIONS}
        value={tagValues()}
        onChange={setTagValues}
        tokenSeparators={[' ']}
        placeholder="Type text and press Space..."
      />
      <p class="text-xs text-muted-foreground">Tags: {tagValues().join(', ') || 'none'}</p>
    </div>
  )
}
