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
  const [submittedCountry, setSubmittedCountry] = createSignal<string | null>(null)
  const form = createForm({
    schema: v.object({
      country: v.pipe(
        v.nullable(v.string()),
        v.check(
          (value): value is string => value !== null,
          'Please select your country of residence.',
        ),
      ),
    }),
    initialInput: { country: null },
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
          <Select items={COUNTRIES} placeholder="Select a country..." />
        </form.Field>
        <div class="flex gap-3 items-center">
          <Button type="submit" variant="secondary" size="sm">
            Validate
          </Button>
          <p class="text-muted-foreground text-xs">
            Selected country: {submittedCountry() || 'none'}
          </p>
        </div>
      </div>
    </form.Form>
  )
}
