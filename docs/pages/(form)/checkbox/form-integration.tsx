import { Button, Checkbox, createForm } from '@src'
import { createSignal } from 'solid-js'
import * as v from 'valibot'

export function FormIntegration() {
  const [submitted, setSubmitted] = createSignal<boolean | null>(null)
  const form = createForm({
    schema: v.object({
      terms: v.pipe(v.boolean(), v.literal(true, 'You must accept the terms to proceed.')),
    }),
    initialInput: { terms: false },
    validate: 'input',
  })

  return (
    <form.Form onSubmit={(output) => setSubmitted(output.terms)}>
      <div class="max-w-xl space-y-4">
        <form.Field name="terms" description="Required for account activation." required>
          <Checkbox label="I agree to the Terms of Service and Privacy Policy" />
        </form.Field>
        <div class="flex gap-3 items-center">
          <Button type="submit" variant="secondary" size="sm">
            Validate
          </Button>
          <p class="text-xs text-muted-foreground">
            Terms accepted: {submitted() === null ? 'Pending' : submitted() ? 'Yes' : 'No'}
          </p>
        </div>
      </div>
    </form.Form>
  )
}
