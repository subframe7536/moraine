import { Button, createForm, Form, FormField, Input } from '@src'
import { createSignal, Show } from 'solid-js'
import * as v from 'valibot'

const schema = v.object({
  username: v.pipe(v.string(), v.nonEmpty('Username is required')),
})

export function BasicForm() {
  const [submitted, setSubmitted] = createSignal<string | null>(null)
  const form = createForm({ schema, initialInput: { username: '' } })

  return (
    <div class="max-w-md w-full space-y-4">
      <Form
        of={form}
        onSubmit={(values) => {
          setSubmitted(values.username)
        }}
        class="space-y-4"
      >
        <FormField<typeof schema> name="username" label="Username" required>
          <Input placeholder="Enter username" />
        </FormField>
        <Button type="submit">Save Profile</Button>
      </Form>
      <Show when={submitted()}>
        <p class="text-xs text-muted-foreground">
          Profile saved for user: <span class="text-foreground font-medium">{submitted()}</span>
        </p>
      </Show>
    </div>
  )
}
