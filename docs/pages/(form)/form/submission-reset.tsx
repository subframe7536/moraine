import { Button, createForm, Form, FormField, Input } from '@src'
import * as v from 'valibot'

const schema = v.object({
  email: v.pipe(v.string(), v.email('Invalid email address')),
})

export function SubmissionReset() {
  const form = createForm({
    schema,
    initialInput: { email: 'admin@example.com' },
  })

  const handleSubmit = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  return (
    <div class="max-w-md w-full">
      <Form of={form} onSubmit={handleSubmit} class="space-y-4">
        <FormField<typeof schema> name="email" label="Contact Email" required>
          <Input placeholder="admin@example.com" />
        </FormField>
        <div class="flex gap-2">
          <Button type="submit" loading={form.isSubmitting}>
            Submit Changes
          </Button>
          <Button type="reset" variant="outline">
            Reset
          </Button>
        </div>
      </Form>
    </div>
  )
}
