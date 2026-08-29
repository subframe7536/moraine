import { FormField, Input } from '@src'

export function LabelsMessages() {
  return (
    <div class="max-w-md w-full space-y-4">
      <FormField
        label="Repository name"
        description="Must be URL-friendly and unique within your organization."
        required
      >
        <Input placeholder="moraine-app" />
      </FormField>

      <FormField label="Deployment target" error="Selected cluster is currently unreachable.">
        <Input value="prod-us-east-1" />
      </FormField>
    </div>
  )
}
