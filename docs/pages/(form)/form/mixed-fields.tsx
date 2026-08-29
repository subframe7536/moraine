import { Button, createForm, Form, FormField, Input, Select, Switch } from '@src'
import { Show, createSignal } from 'solid-js'
import * as v from 'valibot'

const schema = v.object({
  name: v.pipe(v.string(), v.nonEmpty('A project name is required.')),
  visibility: v.picklist(['private', 'team']),
  notifications: v.boolean(),
})

export function MixedFields() {
  const [submitted, setSubmitted] = createSignal(false)
  const form = createForm({
    schema,
    initialInput: { name: '', visibility: 'private', notifications: true },
  })

  return (
    <Form of={form} onSubmit={() => setSubmitted(true)} class="max-w-sm space-y-4">
      <FormField<typeof schema> name="name" label="Project name" required>
        <Input placeholder="Documentation refresh" />
      </FormField>
      <FormField<typeof schema> name="visibility" label="Visibility">
        <Select
          options={[
            { label: 'Private', value: 'private' },
            { label: 'Team', value: 'team' },
          ]}
        />
      </FormField>
      <FormField<typeof schema> name="notifications">
        <Switch label="Notify collaborators" />
      </FormField>
      <Button type="submit">Create project</Button>
      <Show when={submitted()}>
        <p class="text-success text-sm">Project created.</p>
      </Show>
    </Form>
  )
}
