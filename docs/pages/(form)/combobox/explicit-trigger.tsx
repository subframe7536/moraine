import { Combobox } from '@src'
import type { ComboboxT } from '@src'

const ITEMS: ComboboxT.Item[] = [
  { label: 'Development', value: 'dev' },
  { label: 'Design', value: 'design' },
  { label: 'Marketing', value: 'marketing' },
  { label: 'Product', value: 'product' },
]

export function ExplicitTrigger() {
  return (
    <div class="max-w-md w-full space-y-4">
      <div class="space-y-1.5">
        <label class="text-muted-foreground font-medium block text-xs">
          Default (Only typing or chevron button toggles popup)
        </label>
        <Combobox items={ITEMS} openOnControlClick={false} placeholder="Click chevron to open..." />
      </div>

      <div class="space-y-1.5">
        <label class="text-muted-foreground font-medium block text-xs">
          Open on control click (Click anywhere inside field to open)
        </label>
        <Combobox
          items={ITEMS}
          openOnControlClick={true}
          placeholder="Click anywhere in the field..."
        />
      </div>
    </div>
  )
}
