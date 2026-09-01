import { Button, createForm, Input } from '@src'
import { createSignal } from 'solid-js'
import * as v from 'valibot'

export function FormIntegration() {
  const [submittedEmail, setSubmittedEmail] = createSignal('')
  const form = createForm({
    schema: v.object({
      email: v.pipe(v.string(), v.email('Please enter a valid work email address.')),
    }),
    initialInput: { email: '' },
    validate: 'input',
  })

  return (
    <form.Form onSubmit={(output) => setSubmittedEmail(output.email)}>
      <div class="max-w-xl space-y-4">
        <form.Field
          name="email"
          label="Work Email"
          description="We will send your verification link here."
          required
        >
          <Input type="email" placeholder="alex@company.com" leading="i-lucide:mail" />
        </form.Field>
        <div class="flex gap-3 items-center">
          <Button type="submit" variant="secondary" size="sm">
            Validate
          </Button>
          <p class="text-xs text-muted-foreground">Submitted: {submittedEmail() || 'none'}</p>
        </div>
      </div>
    </form.Form>
  )
}
