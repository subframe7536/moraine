import { FormField, Slider } from '@src'

export function KeyboardForms() {
  return (
    <div class="max-w-md w-full">
      <FormField label="Brightness level" description="Use arrow keys to adjust in 5% increments.">
        <Slider name="brightness" defaultValue={75} step={5} minValue={0} maxValue={100} />
      </FormField>
    </div>
  )
}
