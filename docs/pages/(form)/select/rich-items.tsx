import { Select } from '@src'
import type { SelectT } from '@src'

const PLANS: SelectT.Item[] = [
  {
    label: 'Starter',
    value: 'starter',
    icon: 'i-lucide:sparkles',
    description: 'Up to 3 members · Free forever',
  },
  {
    label: 'Professional',
    value: 'pro',
    icon: 'i-lucide:zap',
    description: '$19/mo · Ideal for growing teams',
  },
  {
    label: 'Team',
    value: 'team',
    icon: 'i-lucide:rocket',
    description: '$49/mo · Advanced collaboration tools',
  },
  {
    label: 'Enterprise',
    value: 'enterprise',
    icon: 'i-lucide:shield-check',
    description: 'Custom pricing · Dedicated support & SLA',
  },
]

export function RichItems() {
  return (
    <div class="max-w-sm w-full space-y-2">
      <label class="text-muted-foreground font-medium block text-xs">Subscription Plan</label>
      <Select items={PLANS} defaultValue="pro" placeholder="Choose your plan..." />
    </div>
  )
}
