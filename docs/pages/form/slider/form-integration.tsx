import { Button, Form, FormField, Slider } from '@src'
import type { SliderT } from '@src'
import { createSignal } from 'solid-js'

export function FormIntegration() {
  const [formState, setFormState] = createSignal({
    volume: 10,
  })

  const updateFormVolume = (nextValue: SliderT.Value) => {
    const next = Array.isArray(nextValue) ? (nextValue[0] ?? 0) : nextValue
    setFormState((prev) => ({ ...prev, volume: next }))
  }

  return (
    <Form
      state={formState()}
      validateOn={['input']}
      validateOnInputDelay={0}
      validate={(state) => {
        if ((state?.volume ?? 0) < 20) {
          return [{ name: 'volume', message: 'Volume must be at least 20.' }]
        }

        return []
      }}
    >
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
