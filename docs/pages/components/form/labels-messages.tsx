import { createForm, Input } from '@src'
import * as v from 'valibot'

export function LabelsMessages() {
  const form = createForm({
    schema: v.object({
      repoName: v.string(),
      deploymentTarget: v.string(),
    }),
    initialInput: { repoName: '', deploymentTarget: 'prod-us-east-1' },
  })

  return (
    <div class="max-w-md w-full space-y-4">
      <form.Field
        name="repoName"
        label="Repository name"
        description="Must be URL-friendly and unique within your organization."
        required
      >
        <Input placeholder="moraine-app" />
      </form.Field>

      <form.Field
        name="deploymentTarget"
        label="Deployment target"
        error="Selected cluster is currently unreachable."
      >
        <Input />
      </form.Field>
    </div>
  )
}
