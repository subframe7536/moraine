import { FormField, RadioGroup } from '@src'
import { createSignal } from 'solid-js'

export function ControlledDisabled() {
  const ITEMS = [
    { value: 'starter', label: 'Starter', description: 'For personal projects' },
    { value: 'pro', label: 'Pro', description: 'For teams and scaling' },
    { value: 'enterprise', label: 'Enterprise', description: 'For regulated workloads' },
  ]

  const [value, setValue] = createSignal('pro')

  return (
    <div class="max-w-xl space-y-3">
      <FormField label="Plan selector">
        <RadioGroup
          items={[
            ...ITEMS,
            {
              value: 'legacy',
              label: 'Legacy',
              description: 'No longer available',
              disabled: true,
            },
          ]}
          value={value()}
          onChange={setValue}
          variant="table"
          orientation="horizontal"
        />
      </FormField>
      <p class="text-xs text-muted-foreground">Current plan: {value()}</p>
    </div>
  )
}
