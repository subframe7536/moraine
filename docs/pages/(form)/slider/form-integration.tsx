import { Button, createForm, Form, FormField, Slider } from '@src'
import type { SliderT } from '@src'
import { createSignal, untrack } from 'solid-js'
import * as v from 'valibot'

export function FormIntegration() {
  const [formState, setFormState] = createSignal({
    volume: 10,
  })

  const updateFormVolume = (nextValue: SliderT.Value) => {
    const next = Array.isArray(nextValue) ? (nextValue[0] ?? 0) : nextValue
    setFormState((prev) => ({ ...prev, volume: next }))
  }
  const form = createForm({
    schema: v.object({ volume: v.pipe(v.number(), v.minValue(20, 'Volume must be at least 20.')) }),
    initialInput: untrack(formState),
    validate: 'input',
  })

  return (
    <Form of={form}>
      <div class="max-w-xl space-y-4">
        <FormField name="volume" label="Volume" description="Keep it at least 20.">
          <Slider value={formState().volume} onValueChange={updateFormVolume} />
        </FormField>
        <div class="flex gap-3 items-center">
          <Button type="submit" variant="secondary" size="sm">
            Validate
          </Button>
          <p class="text-xs text-muted-foreground">Current volume: {formState().volume}</p>
        </div>
      </div>
    </Form>
  )
}
