import { InputNumber } from '@src'
import { createSignal } from 'solid-js'

export function KeyboardStepping() {
  const [value, setValue] = createSignal(4)

  return (
    <div class="max-w-sm space-y-3">
      <InputNumber
        aria-label="Retry delay in seconds"
        rawValue={value()}
        minValue={0}
        maxValue={60}
        step={0.5}
        largeStep={5}
        onRawValueChange={setValue}
      />
      <p class="text-sm text-muted-foreground">Current delay: {value()} seconds</p>
      <p class="text-xs text-muted-foreground">
        Arrow keys change by 0.5, PageUp/PageDown by 5, and Home/End jump to 0 or 60.
      </p>
    </div>
  )
}
