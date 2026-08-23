import { CheckboxGroup } from '@src'
import { createSignal } from 'solid-js'

export function ControlledDisabledItems() {
  const ITEMS = [
    { value: 'alpha', label: 'Alpha', description: 'Primary rollout channel' },
    { value: 'beta', label: 'Beta', description: 'Early access channel' },
    { value: 'stable', label: 'Stable', description: 'Production channel' },
  ]

  const [value, setValue] = createSignal<string[]>(['beta'])

  return (
    <div class="max-w-2xl space-y-3">
      <CheckboxGroup
        legend="Controlled channels"
        variant="table"
        orientation="horizontal"
        items={[
          ...ITEMS,
          { value: 'legacy', label: 'Legacy', description: 'Frozen channel', disabled: true },
        ]}
        value={value()}
        onChange={setValue}
      />
      <p class="text-xs text-muted-foreground">Selected: {value().join(', ') || 'none'}</p>
    </div>
  )
}
