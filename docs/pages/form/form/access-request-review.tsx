import { Button, CheckboxGroup, Form, FormField, Input, Switch, Textarea } from '@src'
import { createSignal } from 'solid-js'

export function AccessRequestReview() {
  const [accessState, setAccessState] = createSignal({
    requester: '',
    reason: '',
    temporary: true,
    scopes: ['repo:read'],
    reviewers: ['security'],
  })

  const updateAccess = (field: string, value: string | boolean | string[]) => {
    setAccessState((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Form
      state={accessState()}
      validate={(state) => {
        const errors: { name: string; message: string }[] = []

        if (!state?.requester?.trim()) {
          errors.push({ name: 'requester', message: 'Requester is required.' })
        }

        if (!state?.reason?.trim()) {
          errors.push({ name: 'reason', message: 'Business reason is required.' })
        }

        if (!state?.scopes || state.scopes.length === 0) {
          errors.push({ name: 'scopes', message: 'Select at least one permission scope.' })
        }

        if (!state?.reviewers || state.reviewers.length === 0) {
          errors.push({ name: 'reviewers', message: 'Select at least one reviewer.' })
        }

        return errors
      }}
      classes={{ root: 'mx-auto max-w-2xl w-full space-y-4' }}
    >
      <FormField name="requester" label="Requester" required>
        <Input
          value={accessState().requester}
          onValueChange={(v) => updateAccess('requester', String(v))}
          placeholder="alex.chen"
        />
      </FormField>

      <FormField name="reason" label="Business Reason" required>
        <Textarea
          value={accessState().reason}
          onValueChange={(v) => updateAccess('reason', String(v))}
          placeholder="Need short-term access for production incident mitigation."
          rows={3}
        />
      </FormField>

      <FormField
        name="temporary"
        label="Temporary Access"
        description="Enable automatic expiry for this permission grant."
      >
        <Switch
          checked={accessState().temporary}
          onChange={(v) => updateAccess('temporary', Boolean(v))}
        />
      </FormField>

      <FormField name="scopes" label="Requested Scopes" required>
        <CheckboxGroup
          items={[
            {
              value: 'repo:read',
              label: 'Repository Read',
              description: 'View code and PRs',
            },
            {
              value: 'repo:write',
              label: 'Repository Write',
              description: 'Push and merge changes',
            },
            {
              value: 'deploy:prod',
              label: 'Production Deploy',
              description: 'Trigger release pipelines',
            },
          ]}
          value={accessState().scopes}
          onChange={(v) => updateAccess('scopes', v)}
          variant="card"
        />
      </FormField>

      <FormField name="reviewers" label="Required Reviewers" required>
        <CheckboxGroup
          items={[
            {
              value: 'security',
              label: 'Security Team',
              description: 'Permission boundary review',
            },
            {
              value: 'platform',
              label: 'Platform Team',
              description: 'Infrastructure and ops review',
            },
            {
              value: 'manager',
              label: 'Line Manager',
              description: 'Business ownership approval',
            },
          ]}
          value={accessState().reviewers}
          onChange={(v) => updateAccess('reviewers', v)}
        />
      </FormField>

      <Button type="submit">Submit Access Request</Button>
    </Form>
  )
}
