import { Button, createForm, Input, InputGroup, Icon } from '@src'
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
          <InputGroup>
            <InputGroup.Leading>
              <Icon name="i-lucide:mail" />
            </InputGroup.Leading>
            <Input type="email" placeholder="alex@company.com" />
          </InputGroup>
        </form.Field>
        <div class="flex gap-3 items-center">
          <Button type="submit" variant="secondary" size="sm">
            Validate
          </Button>
          <p class="text-muted-foreground text-xs">Submitted: {submittedEmail() || 'none'}</p>
        </div>
      </div>
    </form.Form>
  )
}
