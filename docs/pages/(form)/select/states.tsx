import { Select } from '@src'
import type { SelectT } from '@src'

const OPTIONS: SelectT.Item[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry (Out of stock)', value: 'cherry', disabled: true },
  { label: 'Dragonfruit', value: 'dragonfruit' },
]

export function States() {
  return (
    <div class="max-w-sm w-full space-y-4">
      <div class="space-y-1.5">
        <label class="text-xs text-muted-foreground font-medium block">Clearable</label>
        <Select items={OPTIONS} defaultValue="apple" allowClear placeholder="Can be cleared" />
      </div>

      <div class="space-y-1.5">
        <label class="text-xs text-muted-foreground font-medium block">Disabled Option</label>
        <Select items={OPTIONS} defaultValue="banana" placeholder="Cherry is disabled" />
      </div>

      <div class="space-y-1.5">
        <label class="text-xs text-muted-foreground font-medium block">Disabled Component</label>
        <Select items={OPTIONS} disabled defaultValue="apple" placeholder="Disabled selection" />
      </div>

      <div class="space-y-1.5">
        <label class="text-xs text-muted-foreground font-medium block">Read-only</label>
        <Select
          items={OPTIONS}
          readOnly
          defaultValue="dragonfruit"
          placeholder="Read-only selection"
        />
      </div>
    </div>
  )
}
