import { FormField, RadioGroup } from '@src'

export function Orientations() {
  const DENSITIES = [
    { value: 'compact', label: 'Compact', description: 'Tight padding' },
    { value: 'comfortable', label: 'Comfortable', description: 'Default balance' },
    { value: 'spacious', label: 'Spacious', description: 'Generous room' },
  ]

  const ENVIRONMENTS = [
    { value: 'production', label: 'Production', description: 'Live customer traffic' },
    { value: 'staging', label: 'Staging', description: 'Pre-release testing' },
    { value: 'dev', label: 'Development', description: 'Local experiment sandbox' },
  ]

  return (
    <div class="flex flex-col gap-6 max-w-2xl">
      <FormField label="Layout Density (Horizontal List)">
        <RadioGroup items={DENSITIES} orientation="horizontal" defaultValue="comfortable" />
      </FormField>

      <FormField label="Target Environment (Horizontal Card)">
        <RadioGroup
          items={ENVIRONMENTS}
          variant="card"
          orientation="horizontal"
          defaultValue="staging"
        />
      </FormField>

      <FormField label="Cluster Role (Horizontal Table)">
        <RadioGroup
          items={ENVIRONMENTS}
          variant="table"
          orientation="horizontal"
          defaultValue="production"
        />
      </FormField>
    </div>
  )
}
