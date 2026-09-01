import { Button, createForm, Textarea } from '@src'
import { createSignal } from 'solid-js'
import * as v from 'valibot'

export function FormIntegration() {
  const [submittedFeedback, setSubmittedFeedback] = createSignal('')
  const form = createForm({
    schema: v.object({
      feedback: v.pipe(
        v.string(),
        v.minLength(10, 'Feedback must be at least 10 characters long.'),
      ),
    }),
    initialInput: { feedback: '' },
    validate: 'input',
  })

  return (
    <form.Form onSubmit={(output) => setSubmittedFeedback(output.feedback)}>
      <div class="max-w-xl space-y-4">
        <form.Field
          name="feedback"
          label="Product Feedback"
          description="Tell us what features or fixes you'd like to see next."
          required
        >
          <Textarea placeholder="Write your detailed feedback here..." rows={4} autoResize />
        </form.Field>
        <div class="flex gap-3 items-center">
          <Button type="submit" variant="secondary" size="sm">
            Send Feedback
          </Button>
          <p class="text-xs text-muted-foreground">
            Characters submitted: {submittedFeedback().length}
          </p>
        </div>
      </div>
    </form.Form>
  )
}
