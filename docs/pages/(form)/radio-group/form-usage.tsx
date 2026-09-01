import { RadioGroup } from '@src'

const ENV_OPTIONS = [
  { label: 'Development', value: 'dev' },
  { label: 'Staging', value: 'staging' },
  { label: 'Production', value: 'prod' },
]

export function FormUsage() {
  return (
    <div class="max-w-md w-full">
      <RadioGroup name="environment" items={ENV_OPTIONS} defaultValue="staging" />
    </div>
  )
}
