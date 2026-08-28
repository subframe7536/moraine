import { RadioGroup } from '@src'
import { createSignal } from 'solid-js'

const PLAN_OPTIONS = [
  { label: 'Free tier', value: 'free', description: 'For personal projects with basic features.' },
  {
    label: 'Pro tier',
    value: 'pro',
    description: 'Advanced collaboration and unlimited bandwidth.',
  },
  { label: 'Enterprise', value: 'enterprise', description: 'Dedicated support and custom SLA.' },
]

export function Selection() {
  const [plan, setPlan] = createSignal('pro')

  return (
    <div class="max-w-md w-full space-y-3">
      <RadioGroup
        label="Subscription tier"
        items={PLAN_OPTIONS}
        value={plan()}
        onChange={setPlan}
      />
      <p class="text-xs text-muted-foreground">
        Active plan: <span class="text-foreground font-medium">{plan()}</span>
      </p>
    </div>
  )
}
