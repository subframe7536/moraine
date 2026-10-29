import { BoldSlider } from '@src'
import { createSignal } from 'solid-js'

export function BlurSlider() {
  const [value, setValue] = createSignal(32)

  return (
    <div class="max-w-md w-full">
      <BoldSlider
        label="Blur"
        value={value()}
        onValueChange={setValue}
        min={0}
        max={100}
        step={1}
        size="lg"
        formatValue={(blur) => `${blur}px`}
      />
    </div>
  )
}
