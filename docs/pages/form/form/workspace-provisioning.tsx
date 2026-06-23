import { Button, Form, FormField, Input, RadioGroup, Select, Switch } from '@src'
import { createSignal } from 'solid-js'

export function WorkspaceProvisioning() {
  const [workspaceState, setWorkspaceState] = createSignal({
    workspaceName: '',
    ownerEmail: '',
    role: 'developer' as string | null,
    environment: 'staging',
    enableAudit: true,
  })

  const updateWorkspace = (field: string, value: string | boolean | null) => {
    setWorkspaceState((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Form
      state={workspaceState()}
      validate={(state) => {
        const errors: { name: string; message: string }[] = []

        if (!state?.workspaceName?.trim()) {
          errors.push({ name: 'workspaceName', message: 'Workspace name is required.' })
        }

        if (!state?.ownerEmail?.trim()) {
          errors.push({ name: 'ownerEmail', message: 'Owner email is required.' })
        } else if (!state.ownerEmail.includes('@')) {
          errors.push({ name: 'ownerEmail', message: 'Enter a valid owner email.' })
        }

        if (!state?.role) {
          errors.push({ name: 'role', message: 'Select a default role.' })
        }

        return errors
      }}
      classes={{ root: 'mx-auto max-w-2xl w-full space-y-4' }}
    >
      <FormField name="workspaceName" label="Workspace Name" required>
        <Input
          value={workspaceState().workspaceName}
          onValueChange={(v) => updateWorkspace('workspaceName', String(v))}
          placeholder="acme-platform"
        />
      </FormField>

      <FormField name="ownerEmail" label="Owner Email" required>
        <Input
          type="email"
          value={workspaceState().ownerEmail}
          onValueChange={(v) => updateWorkspace('ownerEmail', String(v))}
          placeholder="owner@acme.dev"
        />
      </FormField>

      <FormField name="role" label="Default Team Role" required>
        <Select
          options={[
            { label: 'Developer', value: 'developer' },
            { label: 'Designer', value: 'designer' },
            { label: 'Manager', value: 'manager' },
          ]}
          value={workspaceState().role}
          onChange={(v) => updateWorkspace('role', v as string | null)}
          placeholder="Select role"
        />
      </FormField>

      <FormField name="environment" label="Initial Deployment Target" required>
        <RadioGroup
          items={[
            {
              value: 'staging',
              label: 'Staging',
              description: 'Pre-production verification',
            },
            {
              value: 'production',
              label: 'Production',
              description: 'Public traffic rollout',
            },
          ]}
          variant="table"
          value={workspaceState().environment}
          onChange={(v) => updateWorkspace('environment', String(v))}
        />
      </FormField>

      <FormField
        name="enableAudit"
        label="Audit Logging"
        description="Enable immutable audit trail for permissions and deploy actions."
      >
        <Switch
          checked={workspaceState().enableAudit}
          onChange={(v) => updateWorkspace('enableAudit', Boolean(v))}
          checkedIcon="i-lucide-shield-check"
          uncheckedIcon="i-lucide-shield"
        />
      </FormField>

      <Button type="submit">Create Workspace</Button>
    </Form>
  )
}
