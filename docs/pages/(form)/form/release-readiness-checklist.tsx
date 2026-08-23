import {
  Button,
  Checkbox,
  CheckboxGroup,
  createForm,
  Form,
  FormField,
  Input,
  RadioGroup,
  Textarea,
} from '@src'
import { Show, createSignal } from 'solid-js'
import * as v from 'valibot'

const ReleaseReadinessSchema = v.object({
  releaseVersion: v.pipe(v.string(), v.minLength(1, 'Release version is required.')),
  channels: v.pipe(v.array(v.string()), v.nonEmpty('Select at least one release channel.')),
  approvalLevel: v.picklist(['peer', 'lead', 'qa'], 'Select an approval gate.'),
  rolloutConfirmed: v.pipe(v.boolean(), v.value(true, 'You must confirm rollback readiness.')),
  notes: v.pipe(v.string(), v.minLength(10, 'Add at least 10 characters of release notes.')),
})

export function ReleaseReadinessChecklist() {
  const [approvedRelease, setApprovedRelease] = createSignal<string>()
  const form = createForm({
    schema: ReleaseReadinessSchema,
    initialInput: {
      releaseVersion: '',
      channels: [],
      approvalLevel: 'peer',
      rolloutConfirmed: false,
      notes: '',
    },
  })
  return (
    <Form
      of={form}
      onSubmit={(output) => setApprovedRelease(`${output.releaseVersion} is ready for rollout.`)}
      class="mx-auto max-w-2xl w-full space-y-4"
    >
      <FormField<typeof ReleaseReadinessSchema>
        name="releaseVersion"
        label="Release Version"
        required
      >
        <Input placeholder="v2.14.0" />
      </FormField>

      <FormField<typeof ReleaseReadinessSchema> name="channels" label="Rollout Channels" required>
        <CheckboxGroup
          items={[
            {
              value: 'alpha',
              label: 'Alpha',
              description: 'Internal team first',
            },
            {
              value: 'beta',
              label: 'Beta',
              description: 'Limited external users',
            },
            {
              value: 'stable',
              label: 'Stable',
              description: 'Full production release',
            },
          ]}
          variant="table"
        />
      </FormField>

      <FormField<typeof ReleaseReadinessSchema> name="approvalLevel" label="Approval Gate" required>
        <RadioGroup
          items={[
            {
              value: 'peer',
              label: 'Peer Review',
              description: 'One teammate sign-off',
            },
            {
              value: 'lead',
              label: 'Tech Lead',
              description: 'Owner team approval',
            },
            {
              value: 'qa',
              label: 'QA + Lead',
              description: 'Formal release gate',
            },
          ]}
          variant="card"
        />
      </FormField>

      <FormField<typeof ReleaseReadinessSchema> name="notes" label="Release Notes" required>
        <Textarea
          placeholder="Summarize risk, migration notes, and rollback strategy..."
          rows={4}
        />
      </FormField>

      <FormField<typeof ReleaseReadinessSchema>
        name="rolloutConfirmed"
        label="Rollback Prepared"
        required
      >
        <Checkbox label="I confirmed rollback commands and owner on-call availability." />
      </FormField>

      <Button type="submit">Approve Release</Button>
      <Show when={approvedRelease()}>
        {(message) => <p class="text-success text-sm">{message()}</p>}
      </Show>
    </Form>
  )
}
