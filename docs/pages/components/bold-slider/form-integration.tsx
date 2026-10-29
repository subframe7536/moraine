import { BoldSlider, Button, createForm } from '@src'
import * as v from 'valibot'

export function FormIntegration() {
  const form = createForm({
    schema: v.object({
      brightness: v.pipe(v.number(), v.minValue(20, 'Brightness must be at least 20%.')),
    }),
    initialInput: { brightness: 60 },
    validate: 'input',
  })

  return (
    <form.Form>
      <div class="max-w-sm space-y-4">
        <form.Field name="brightness" label="Brightness" description="Keep it at least 20%.">
          <BoldSlider defaultValue={60} step={5} formatValue={(value) => `${value}%`} />
        </form.Field>
        <Button type="submit" variant="soft" tone="neutral" size="sm">
          Validate
        </Button>
      </div>
    </form.Form>
  )
}
