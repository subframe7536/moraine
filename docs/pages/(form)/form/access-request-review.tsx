import { Button, CheckboxGroup, createForm, Form, FormField, Input, Switch, Textarea } from '@src'
import { Show, createSignal } from 'solid-js'
import * as v from 'valibot'

const AccessRequestSchema = v.object({
  requester: v.pipe(v.string(), v.nonEmpty('Requester is required.')),
  reason: v.pipe(v.string(), v.nonEmpty('Business reason is required.')),
  temporary: v.boolean(),
  scopes: v.pipe(v.array(v.string()), v.nonEmpty('Select at least one permission scope.')),
  reviewers: v.pipe(v.array(v.string()), v.nonEmpty('Select at least one reviewer.')),
})

export function AccessRequestReview() {
  const [submittedRequest, setSubmittedRequest] = createSignal<string>()
  const form = createForm({
    schema: AccessRequestSchema,
    initialInput: {
      requester: '',
      reason: '',
      temporary: true,
      scopes: ['repo:read'],
      reviewers: ['security'],
    },
  })

  return (
    <Form
      of={form}
      onSubmit={(output) => setSubmittedRequest(`Request submitted for ${output.requester}.`)}
      class="mx-auto max-w-2xl w-full space-y-4"
    >
      <FormField<typeof AccessRequestSchema> name="requester" label="Requester" required>
        <Input placeholder="alex.chen" />
      </FormField>

      <FormField<typeof AccessRequestSchema> name="reason" label="Business Reason" required>
        <Textarea
          placeholder="Need short-term access for production incident mitigation."
          rows={3}
        />
      </FormField>

      <FormField<typeof AccessRequestSchema>
        name="temporary"
        label="Temporary Access"
        description="Enable automatic expiry for this permission grant."
      >
        <Switch />
      </FormField>

      <FormField<typeof AccessRequestSchema> name="scopes" label="Requested Scopes" required>
        <CheckboxGroup
          items={[
            { value: 'repo:read', label: 'Repository Read', description: 'View code and PRs' },
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
          variant="card"
        />
      </FormField>

      <FormField<typeof AccessRequestSchema> name="reviewers" label="Required Reviewers" required>
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
            { value: 'manager', label: 'Line Manager', description: 'Business ownership approval' },
          ]}
        />
      </FormField>

      <Button type="submit">Submit Access Request</Button>
      <Show when={submittedRequest()}>
        {(message) => <p class="text-success text-sm">{message()}</p>}
      </Show>
    </Form>
  )
}
