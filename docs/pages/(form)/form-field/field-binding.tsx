import { createForm, Form, FormField, Input } from '@src'
import * as v from 'valibot'

const schema = v.object({
  fullName: v.string(),
})

export function FieldBinding() {
  const form = createForm({
    schema,
    initialInput: { fullName: 'Alex Rivera' },
  })

  return (
    <div class="max-w-md w-full">
      <Form of={form}>
        <FormField<typeof schema>
          name="fullName"
          label="Full Name"
          description="Your legal name as it appears on documents."
        >
          <Input placeholder="Alex Rivera" />
        </FormField>
      </Form>
    </div>
  )
}
