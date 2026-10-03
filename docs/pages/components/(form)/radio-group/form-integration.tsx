import { Button, createForm, RadioGroup } from '@src'
import { createSignal } from 'solid-js'
import * as v from 'valibot'

const ENV_OPTIONS = [
  { label: 'Development', value: 'dev' },
  { label: 'Staging', value: 'staging' },
  { label: 'Production', value: 'prod' },
]

export function FormIntegration() {
  const [submittedEnv, setSubmittedEnv] = createSignal('staging')
  const form = createForm({
    schema: v.object({
      environment: v.pipe(v.string(), v.nonEmpty('Please select a target environment.')),
    }),
    initialInput: { environment: 'staging' },
    validate: 'input',
  })

  return (
    <form.Form onSubmit={(output) => setSubmittedEnv(output.environment)}>
      <div class="max-w-xl space-y-4">
        <form.Field
          name="environment"
          label="Target Deployment Environment"
          description="Determines runtime configuration and secrets applied."
          required
        >
          <RadioGroup items={ENV_OPTIONS} />
        </form.Field>
        <div class="flex gap-3 items-center">
          <Button type="submit" variant="secondary" size="sm">
            Validate
          </Button>
          <p class="text-xs text-muted-foreground">Target: {submittedEnv()}</p>
        </div>
      </div>
    </form.Form>
  )
}
