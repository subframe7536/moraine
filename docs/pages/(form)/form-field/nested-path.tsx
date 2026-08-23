import { Button, createForm, Form, FormField, Input } from '@src'
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
    <Form of={form} class="mx-auto max-w-xl w-full space-y-4">
      <FormField name={['profile', 'name']} label="Profile Name" required>
        <Input placeholder="Moraine Team" />
      </FormField>

      <FormField name={['profile', 'email']} label="Profile Email" required>
        <Input type="email" placeholder="team@acme.dev" />
      </FormField>

      <Button type="submit">Save Profile</Button>
    </Form>
  )
}
