import { MultiSelect } from '@src'
import type { MultiSelectT } from '@src'

export function MaxCountMaxTagCount() {
  const FRUIT_OPTIONS: MultiSelectT.Item[] = [
    { label: 'Apple', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Cherry', value: 'cherry' },
    { label: 'Date', value: 'date' },
    { label: 'Elderberry', value: 'elderberry', disabled: true },
    { label: 'Forest', value: 'forest', icon: 'i-lucide:braces' },
  ]

  return (
    <div class="gap-4 grid w-[42rem] sm:grid-cols-2">
      <div class="space-y-1">
        <label class="text-xs text-muted-foreground block">maxCount=2</label>
        <MultiSelect options={FRUIT_OPTIONS} maxCount={2} placeholder="Pick up to 2..." />
      </div>
      <div class="space-y-1">
        <label class="text-xs text-muted-foreground block">maxTagCount=1 (value has 3)</label>
        <MultiSelect
          options={FRUIT_OPTIONS}
          defaultValue={['apple', 'banana', 'cherry']}
          maxTagCount={1}
          placeholder="Pick..."
        />
      </div>
    </div>
  )
}
