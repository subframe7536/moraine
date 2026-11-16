import { BoldSlider } from '@src'
import { createSignal } from 'solid-js'

const PRESETS = ['Low', 'Medium', 'High', 'Ultra']

export function QualitySlider() {
  const [value, setValue] = createSignal(2)

  return (
    <div class="max-w-md w-full">
      <BoldSlider
        textLabel="Quality"
        value={value()}
        onValueChange={setValue}
        min={0}
        max={3}
        step={1}
        marker
        valueLabel={(level) => PRESETS[level] ?? String(level)}
      />
    </div>
  )
}
