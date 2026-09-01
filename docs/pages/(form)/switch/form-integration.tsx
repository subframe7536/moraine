import { Button, createForm, Switch } from '@src'
import { createSignal } from 'solid-js'
import * as v from 'valibot'

export function FormIntegration() {
  const [submittedAutoRenew, setSubmittedAutoRenew] = createSignal(true)
  const form = createForm({
    schema: v.object({
      autoRenew: v.boolean(),
    }),
    initialInput: { autoRenew: true },
    validate: 'input',
  })

  return (
    <form.Form onSubmit={(output) => setSubmittedAutoRenew(output.autoRenew)}>
      <div class="max-w-xl space-y-4">
        <form.Field
          name="autoRenew"
          label="Subscription Settings"
          description="Automatically renew monthly billing at the end of the billing cycle."
        >
          <Switch label="Enable monthly auto-renewal" />
        </form.Field>
        <div class="flex gap-3 items-center">
          <Button type="submit" variant="secondary" size="sm">
            Save Preferences
          </Button>
          <p class="text-xs text-muted-foreground">
            Auto-renew: {submittedAutoRenew() ? 'Enabled' : 'Disabled'}
          </p>
        </div>
      </div>
    </form.Form>
  )
}
