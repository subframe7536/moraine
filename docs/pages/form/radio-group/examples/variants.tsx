import { RadioGroup } from '@src'

export function Variants() {
  const ITEMS = [
    { value: 'starter', label: 'Starter', description: 'For personal projects' },
    { value: 'pro', label: 'Pro', description: 'For teams and scaling' },
    { value: 'enterprise', label: 'Enterprise', description: 'For regulated workloads' },
  ]

  return (
    <div class="gap-4 grid lg:grid-cols-3 sm:grid-cols-2">
      <div class="p-4 b-(1 border) rounded-lg">
        <RadioGroup legend="List" items={ITEMS} defaultValue="starter" />
      </div>
      <div class="p-4 b-(1 border) rounded-lg">
        <RadioGroup legend="Card" items={ITEMS} variant="card" defaultValue="pro" />
      </div>
      <div class="p-4 b-(1 border) rounded-lg">
        <RadioGroup
          legend="Table"
          items={ITEMS}
          variant="table"
          orientation="vertical"
          defaultValue="enterprise"
        />
      </div>
    </div>
  )
}
