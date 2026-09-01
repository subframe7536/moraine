import { Button, createForm, Select } from '@src'
import { createSignal } from 'solid-js'
import * as v from 'valibot'

const COUNTRIES = [
  { label: 'United States', value: 'us' },
  { label: 'Germany', value: 'de' },
  { label: 'Japan', value: 'jp' },
  { label: 'United Kingdom', value: 'uk' },
  { label: 'Canada', value: 'ca' },
]

export function FormIntegration() {
  const [submittedCountry, setSubmittedCountry] = createSignal('')
  const form = createForm({
    schema: v.object({
      country: v.pipe(v.string(), v.nonEmpty('Please select your country of residence.')),
    }),
    initialInput: { country: '' },
    validate: 'input',
  })

  return (
    <form.Form onSubmit={(output) => setSubmittedCountry(output.country)}>
      <div class="max-w-xl space-y-4">
        <form.Field
          name="country"
          label="Country / Region"
          description="Used for tax calculation and regional billing."
          required
        >
          <Select options={COUNTRIES} placeholder="Select a country..." />
        </form.Field>
        <div class="flex gap-3 items-center">
          <Button type="submit" variant="secondary" size="sm">
            Validate
          </Button>
          <p class="text-xs text-muted-foreground">
            Selected country: {submittedCountry() || 'none'}
          </p>
        </div>
      </div>
    </form.Form>
  )
}
