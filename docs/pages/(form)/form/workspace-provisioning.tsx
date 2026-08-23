import { Button, createForm, Form, FormField, Input, RadioGroup, Select, Switch } from '@src'
import { Show, createSignal } from 'solid-js'
import * as v from 'valibot'

const WorkspaceSchema = v.object({
  workspaceName: v.pipe(v.string(), v.nonEmpty('Workspace name is required.')),
  ownerEmail: v.pipe(v.string(), v.email('Enter a valid owner email.')),
  role: v.picklist(['developer', 'designer', 'manager'], 'Select a default role.'),
  environment: v.picklist(['staging', 'production']),
  enableAudit: v.boolean(),
})

export function WorkspaceProvisioning() {
  const [submittedWorkspace, setSubmittedWorkspace] = createSignal<string>()
  const form = createForm({
    schema: WorkspaceSchema,
    initialInput: {
      workspaceName: '',
      ownerEmail: '',
      role: 'developer',
      environment: 'staging',
      enableAudit: true,
    },
  })

  return (
    <Form
      of={form}
      onSubmit={(output) => setSubmittedWorkspace(`Created ${output.workspaceName}.`)}
      class="mx-auto max-w-2xl w-full space-y-4"
    >
      <FormField<typeof WorkspaceSchema> name="workspaceName" label="Workspace Name" required>
        <Input placeholder="acme-platform" />
      </FormField>

      <FormField<typeof WorkspaceSchema> name="ownerEmail" label="Owner Email" required>
        <Input type="email" placeholder="owner@acme.dev" />
      </FormField>

      <FormField<typeof WorkspaceSchema> name="role" label="Default Team Role" required>
        <Select
          options={[
            { label: 'Developer', value: 'developer' },
            { label: 'Designer', value: 'designer' },
            { label: 'Manager', value: 'manager' },
          ]}
          placeholder="Select role"
        />
      </FormField>

      <FormField<typeof WorkspaceSchema>
        name="environment"
        label="Initial Deployment Target"
        required
      >
        <RadioGroup
          items={[
            { value: 'staging', label: 'Staging', description: 'Pre-production verification' },
            { value: 'production', label: 'Production', description: 'Public traffic rollout' },
          ]}
          variant="table"
        />
      </FormField>

      <FormField<typeof WorkspaceSchema>
        name="enableAudit"
        label="Audit Logging"
        description="Enable immutable audit trail for permissions and deploy actions."
      >
        <Switch checkedIcon="i-lucide-shield-check" uncheckedIcon="i-lucide-shield" />
      </FormField>

      <Button type="submit">Create Workspace</Button>
      <Show when={submittedWorkspace()}>
        {(message) => <p class="text-success text-sm">{message()}</p>}
      </Show>
    </Form>
  )
}
