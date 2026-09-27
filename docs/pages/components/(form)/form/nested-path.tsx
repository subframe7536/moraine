import { Button, createForm, Input } from '@src'
import * as v from 'valibot'

export function NestedPath() {
  const form = createForm({
    schema: v.object({
      profile: v.object({
        name: v.pipe(v.string(), v.nonEmpty('Name is required.')),
        email: v.pipe(v.string(), v.email('Valid email is required.')),
      }),
    }),
    initialInput: { profile: { name: '', email: '' } },
  })

  return (
    <form.Form class="mx-auto max-w-xl w-full space-y-4">
      <form.Field name={['profile', 'name']} label="Profile Name" required>
        <Input placeholder="Moraine Team" />
      </form.Field>

      <form.Field name={['profile', 'email']} label="Profile Email" required>
        <Input type="email" placeholder="team@acme.dev" />
      </form.Field>

      <Button type="submit">Save Profile</Button>
    </form.Form>
  )
}
