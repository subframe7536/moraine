import { Button, createForm, Input } from '@src'
import { Show, createSignal } from 'solid-js'
import * as v from 'valibot'

const schema = v.object({
  email: v.pipe(v.string(), v.email('Enter a valid email address.')),
  name: v.pipe(v.string(), v.minLength(2, 'Enter at least two characters.')),
})

export function Validation() {
  const [submitted, setSubmitted] = createSignal(false)
  const form = createForm({ schema, initialInput: { email: '', name: '' } })

  return (
    <form.Form onSubmit={() => setSubmitted(true)} class="max-w-sm space-y-4">
      <form.Field name="name" label="Name" required>
        <Input placeholder="Ada Lovelace" />
      </form.Field>
      <form.Field name="email" label="Email" required>
        <Input type="email" placeholder="ada@example.com" />
      </form.Field>
      <Button type="submit">Submit</Button>
      <Show when={submitted()}>
        <p class="text-success text-sm">Form submitted.</p>
      </Show>
    </form.Form>
  )
}
