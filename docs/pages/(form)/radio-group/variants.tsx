import { FormField, RadioGroup } from '@src'

export function Variants() {
  const ITEMS = [
    { value: 'starter', label: 'Starter', description: 'For personal projects' },
    { value: 'pro', label: 'Pro', description: 'For teams and scaling' },
    { value: 'enterprise', label: 'Enterprise', description: 'For regulated workloads' },
  ]

  return (
    <div class="gap-4 grid lg:grid-cols-3 sm:grid-cols-2">
      <div class="p-4 b-(1 border) rounded-lg">
        <FormField label="List">
          <RadioGroup items={ITEMS} defaultValue="starter" />
        </FormField>
      </div>
      <div class="p-4 b-(1 border) rounded-lg">
        <FormField label="Card">
          <RadioGroup items={ITEMS} variant="card" defaultValue="pro" />
        </FormField>
      </div>
      <div class="p-4 b-(1 border) rounded-lg">
        <FormField label="Table">
          <RadioGroup
            items={ITEMS}
            variant="table"
            orientation="vertical"
            defaultValue="enterprise"
          />
        </FormField>
      </div>
    </div>
  )
}
