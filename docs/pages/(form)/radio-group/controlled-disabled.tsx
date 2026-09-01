import { RadioGroup } from '@src'
import { createSignal } from 'solid-js'

export function ControlledDisabled() {
  const [value, setValue] = createSignal('pro')

  return (
    <div class="max-w-xl space-y-3">
      <RadioGroup
        items={[
          {
            value: 'starter',
            label: 'Starter (Legacy)',
            description: 'For personal projects',
            disabled: true,
          },
          { value: 'pro', label: 'Pro', description: 'For teams and scaling' },
          { value: 'enterprise', label: 'Enterprise', description: 'For regulated workloads' },
        ]}
        value={value()}
        onChange={setValue}
        variant="table"
        orientation="horizontal"
      />
      <p class="text-xs text-muted-foreground">Current plan: {value()}</p>
    </div>
  )
}
