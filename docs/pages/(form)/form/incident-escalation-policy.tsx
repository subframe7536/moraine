import { Button, createForm, Form, FormField, Input, Select, Switch, Textarea } from '@src'
import { Show, createSignal } from 'solid-js'
import * as v from 'valibot'

const IncidentPolicySchema = v.object({
  policy: v.object({
    name: v.pipe(v.string(), v.nonEmpty('Policy name is required.')),
    severity: v.picklist(['p1', 'p2', 'p3'], 'Severity is required.'),
    notifyEmail: v.pipe(v.string(), v.email('Enter a valid notify email.')),
    autoRollback: v.boolean(),
    summary: v.pipe(
      v.string(),
      v.minLength(12, 'Summary should explain when this policy applies.'),
    ),
  }),
})

export function IncidentEscalationPolicy() {
  const [submittedPolicy, setSubmittedPolicy] = createSignal<string>()
  const form = createForm({
    schema: IncidentPolicySchema,
    initialInput: {
      policy: {
        name: '',
        severity: 'p1',
        notifyEmail: '',
        autoRollback: true,
        summary: '',
      },
    },
  })

  return (
    <Form
      of={form}
      onSubmit={(output) => setSubmittedPolicy(`Saved ${output.policy.name}.`)}
      class="mx-auto max-w-2xl w-full space-y-4"
    >
      <FormField<typeof IncidentPolicySchema>
        name={['policy', 'name']}
        label="Policy Name"
        required
      >
        <Input placeholder="payments-latency-spike" />
      </FormField>

      <FormField<typeof IncidentPolicySchema>
        name={['policy', 'severity']}
        label="Default Severity"
        required
      >
        <Select
          options={[
            { label: 'P1 - Critical', value: 'p1' },
            { label: 'P2 - Major', value: 'p2' },
            { label: 'P3 - Minor', value: 'p3' },
          ]}
          placeholder="Select severity"
        />
      </FormField>

      <FormField<typeof IncidentPolicySchema>
        name={['policy', 'notifyEmail']}
        label="Escalation Email"
        required
      >
        <Input type="email" placeholder="oncall@acme.dev" />
      </FormField>

      <FormField<typeof IncidentPolicySchema>
        name={['policy', 'autoRollback']}
        label="Auto Rollback"
        description="Trigger rollback when alert duration crosses the policy threshold."
      >
        <Switch />
      </FormField>

      <FormField<typeof IncidentPolicySchema>
        name={['policy', 'summary']}
        label="Policy Summary"
        required
      >
        <Textarea
          placeholder="Describe conditions and handoff details for incident response."
          rows={3}
        />
      </FormField>

      <Button type="submit">Save Escalation Policy</Button>
      <Show when={submittedPolicy()}>
        {(message) => <p class="text-success text-sm">{message()}</p>}
      </Show>
    </Form>
  )
}
