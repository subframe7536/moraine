import { Button, Form, FormField, Input, Select, Switch, Textarea } from '@src'
import { createSignal } from 'solid-js'
import * as v from 'valibot'

export function IncidentEscalationPolicy() {
  const [incidentState, setIncidentState] = createSignal({
    policy: {
      name: '',
      severity: 'p1' as string | null,
      notifyEmail: '',
      autoRollback: true,
      summary: '',
    },
  })

  const updateIncident = (field: string, value: string | boolean | null) => {
    setIncidentState((prev) => ({
      ...prev,
      policy: {
        ...prev.policy,
        [field]: value,
      },
    }))
  }

  return (
    <Form
      state={incidentState()}
      schema={v.object({
        policy: v.object({
          name: v.pipe(v.string(), v.minLength(1, 'Policy name is required.')),
          severity: v.pipe(v.string(), v.minLength(1, 'Severity is required.')),
          notifyEmail: v.pipe(
            v.string(),
            v.minLength(1, 'Notify email is required.'),
            v.email('Enter a valid notify email.'),
          ),
          autoRollback: v.boolean(),
          summary: v.pipe(
            v.string(),
            v.minLength(12, 'Summary should explain when this policy applies.'),
          ),
        }),
      })}
      classes={{ root: 'mx-auto max-w-2xl w-full space-y-4' }}
    >
      <FormField name={['policy', 'name']} label="Policy Name" required>
        <Input
          value={incidentState().policy.name}
          onValueChange={(v) => updateIncident('name', String(v))}
          placeholder="payments-latency-spike"
        />
      </FormField>

      <FormField name={['policy', 'severity']} label="Default Severity" required>
        <Select
          options={[
            { label: 'P1 - Critical', value: 'p1' },
            { label: 'P2 - Major', value: 'p2' },
            { label: 'P3 - Minor', value: 'p3' },
          ]}
          value={incidentState().policy.severity}
          onChange={(v) => updateIncident('severity', v as string | null)}
          placeholder="Select severity"
        />
      </FormField>

      <FormField name={['policy', 'notifyEmail']} label="Escalation Email" required>
        <Input
          type="email"
          value={incidentState().policy.notifyEmail}
          onValueChange={(v) => updateIncident('notifyEmail', String(v))}
          placeholder="oncall@acme.dev"
        />
      </FormField>

      <FormField
        name={['policy', 'autoRollback']}
        label="Auto Rollback"
        description="Trigger rollback when alert duration crosses the policy threshold."
      >
        <Switch
          checked={incidentState().policy.autoRollback}
          onChange={(v) => updateIncident('autoRollback', Boolean(v))}
        />
      </FormField>

      <FormField name={['policy', 'summary']} label="Policy Summary" required>
        <Textarea
          value={incidentState().policy.summary}
          onValueChange={(v) => updateIncident('summary', String(v))}
          placeholder="Describe conditions and handoff details for incident response."
          rows={3}
        />
      </FormField>

      <Button type="submit">Save Escalation Policy</Button>
    </Form>
  )
}
