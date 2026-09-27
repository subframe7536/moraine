import { Button, createForm, Input } from '@src'
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
      <form.Form onSubmit={handleSubmit} class="space-y-4">
        <form.Field name="email" label="Contact Email" required>
          <Input placeholder="admin@example.com" />
        </form.Field>
        <div class="flex gap-2">
          <Button type="submit" loading={form.isSubmitting}>
            Submit Changes
          </Button>
          <Button type="reset" variant="outline">
            Reset
          </Button>
        </div>
      </form.Form>
    </div>
  )
}
