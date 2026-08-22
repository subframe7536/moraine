import { FormField, RadioGroup } from '@src'

export function Orientations() {
  const ITEMS = [
    { value: 'starter', label: 'Starter', description: 'For personal projects' },
    { value: 'pro', label: 'Pro', description: 'For teams and scaling' },
    { value: 'enterprise', label: 'Enterprise', description: 'For regulated workloads' },
  ]

  return (
    <div class="flex flex-col gap-4">
      <FormField label="Horizontal list">
        <RadioGroup items={ITEMS} orientation="horizontal" defaultValue="pro" />
      </FormField>
      <FormField label="Horizontal card">
        <RadioGroup items={ITEMS} variant="card" orientation="horizontal" defaultValue="pro" />
      </FormField>
      <FormField label="Horizontal table">
        <RadioGroup
          items={ITEMS}
          variant="table"
          orientation="horizontal"
          defaultValue="enterprise"
        />
      </FormField>
    </div>
  )
}
