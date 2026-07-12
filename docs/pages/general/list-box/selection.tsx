import { ListBox } from '@src'
import type { ListBoxT } from '@src'
import { createSignal } from 'solid-js'

export function Selection() {
  const [value, setValue] = createSignal<ListBoxT.Value | ListBoxT.Value[] | null>(null)
  const ITEMS: ListBoxT.Item[] = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
  ]
  const displayValue = () => {
    const currentValue = value()
    return Array.isArray(currentValue) ? currentValue.join(', ') : (currentValue ?? 'none')
  }

  return (
    <div class="max-w-sm space-y-2">
      <ListBox selectionMode="single" items={ITEMS} value={value()} onChange={setValue} />
      <p class="text-xs text-muted-foreground">Selected: {displayValue()}</p>
    </div>
  )
}
