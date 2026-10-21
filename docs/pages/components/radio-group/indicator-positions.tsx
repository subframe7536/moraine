import { RadioGroup } from '@src'

export function IndicatorPositions() {
  return (
    <div class="max-w-md w-full">
      <RadioGroup
        items={[
          { value: 'starter', label: 'Starter', description: 'For personal projects' },
          { value: 'pro', label: 'Pro', description: 'For teams and scaling' },
          { value: 'enterprise', label: 'Enterprise', description: 'For regulated workloads' },
        ]}
        variant="card"
        indicator="end"
        defaultValue="pro"
      />
    </div>
  )
}
