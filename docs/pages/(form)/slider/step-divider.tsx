import { Slider } from '@src'
import { createSignal } from 'solid-js'

export function StepDivider() {
  const [value, setValue] = createSignal(40)
  const [range, setRange] = createSignal([20, 60])

  return (
    <div class="max-w-md w-full space-y-6">
      <div class="space-y-2">
        <div class="text-xs text-muted-foreground flex justify-between">
          <span>Stepped single (step = 10)</span>
          <span class="text-foreground font-mono">{value()}</span>
        </div>
        <Slider
          value={value()}
          min={0}
          max={100}
          step={10}
          divider
          onValueChange={(val) => {
            if (typeof val === 'number') {
              setValue(val)
            }
          }}
        />
      </div>

      <div class="space-y-2">
        <div class="text-xs text-muted-foreground flex justify-between">
          <span>Stepped range with bold track (step = 20)</span>
          <span class="text-foreground font-mono">
            {range()[0]} - {range()[1]}
          </span>
        </div>
        <Slider
          defaultValue={[20, 60]}
          value={range()}
          min={0}
          max={100}
          step={20}
          divider
          variant="bold"
          onValueChange={(val) => {
            if (Array.isArray(val)) {
              setRange(val)
            }
          }}
        />
      </div>
    </div>
  )
}
