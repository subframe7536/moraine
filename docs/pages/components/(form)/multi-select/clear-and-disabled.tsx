import { MultiSelect } from '@src'
import type { MultiSelectT } from '@src'

const MODULES: MultiSelectT.Item[] = [
  { label: 'Core Runtime (Locked)', value: 'core', disabled: true },
  { label: 'Analytics Engine', value: 'analytics' },
  { label: 'Push Notifications', value: 'notifications' },
  { label: 'Search Indexer', value: 'search' },
]

export function ClearAndDisabled() {
  return (
    <div class="max-w-md w-full space-y-4">
      <div class="space-y-1.5">
        <label class="text-xs text-muted-foreground font-medium block">
          Disabled Option inside List (Core Runtime cannot be toggled)
        </label>
        <MultiSelect
          items={MODULES}
          defaultValue={['core', 'analytics']}
          search
          openOnControlClick
          placeholder="Select optional modules..."
        />
      </div>

      <div class="space-y-1.5">
        <label class="text-xs text-muted-foreground font-medium block">Disabled Component</label>
        <MultiSelect
          items={MODULES}
          disabled
          defaultValue={['analytics', 'search']}
          placeholder="Disabled"
        />
      </div>

      <div class="space-y-1.5">
        <label class="text-xs text-muted-foreground font-medium block">Read-only Component</label>
        <MultiSelect
          items={MODULES}
          readOnly
          defaultValue={['core', 'notifications']}
          placeholder="Read-only"
        />
      </div>
    </div>
  )
}
