import { Button, Checkbox, createForm, Input, Select, Textarea } from '@src'
import { Show, createSignal } from 'solid-js'
import * as v from 'valibot'

const schema = v.object({
  name: v.pipe(v.string(), v.nonEmpty('A project name is required.')),
  description: v.pipe(v.string(), v.nonEmpty('A project description is required.')),
  visibility: v.pipe(v.string(), v.nonEmpty('Please select visibility.')),
  terms: v.pipe(v.boolean(), v.literal(true, 'You must accept the terms and conditions.')),
})

export function MixedFields() {
  const [submitted, setSubmitted] = createSignal(false)
  const form = createForm({
    schema,
    initialInput: { name: '', description: '', visibility: '', terms: false },
  })

  return (
    <form.Form onSubmit={() => setSubmitted(true)} class="max-w-sm space-y-4">
      <form.Field name="name" label="Project name" required>
        <Input placeholder="Documentation refresh" />
      </form.Field>
      <form.Field name="description" label="Description" required>
        <Textarea placeholder="Project description" />
      </form.Field>
      <form.Field name="visibility" label="Visibility" required>
        <Select
          placeholder="Select visibility"
          options={[
            { label: 'Private', value: 'private' },
            { label: 'Team', value: 'team' },
          ]}
        />
      </form.Field>
      <form.Field name="terms" required>
        <Checkbox label="I accept the terms and conditions" />
      </form.Field>
      <Button type="submit">Create project</Button>
      <Show when={submitted()}>
        <p class="text-success text-sm">Project created.</p>
      </Show>
    </form.Form>
  )
}
