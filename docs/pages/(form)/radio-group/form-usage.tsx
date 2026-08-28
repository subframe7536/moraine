import { FormField, RadioGroup } from '@src'

const ENV_OPTIONS = [
  { label: 'Development', value: 'dev' },
  { label: 'Staging', value: 'staging' },
  { label: 'Production', value: 'prod' },
]

export function FormUsage() {
  return (
    <div class="max-w-md w-full">
      <FormField
        label="Target deployment environment"
        description="Determines secrets and API endpoints applied."
        required
      >
        <RadioGroup name="environment" items={ENV_OPTIONS} defaultValue="staging" />
      </FormField>
    </div>
  )
}
