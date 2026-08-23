import { Button, createForm, Form, FormField, Input } from '@src'
import * as v from 'valibot'

export function WithValidation() {
  const form = createForm({
    schema: v.object({ email: v.pipe(v.string(), v.email('Enter a valid email.')) }),
    initialInput: { email: '' },
  })

  return (
    <Form of={form} class="mx-auto max-w-xl w-full space-y-4">
      <FormField name="email" label="Owner Email" required>
        <Input type="email" placeholder="owner@acme.dev" />
      </FormField>

      <Button type="submit">Save</Button>
    </Form>
  )
}
