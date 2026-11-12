import { NumberInput } from '@src'
import { createSignal } from 'solid-js'

export function LongPress() {
  const [repeatValue, setRepeatValue] = createSignal(12)
  const [singleStepValue, setSingleStepValue] = createSignal(12)

  return (
    <div class="max-w-xs space-y-4">
      <div class="space-y-2">
        <NumberInput
          value={repeatValue()}
          onRawValueChange={(value) => {
            if (value !== undefined) {
              setRepeatValue(value)
            }
          }}
          minValue={0}
          maxValue={99}
          step={1}
          variant="subtle"
        />
        <p class="text-xs text-muted-foreground">
          Hold <span class="font-medium">+</span> or <span class="font-medium">−</span> to repeat.
          Current value: {repeatValue()}
        </p>
      </div>

      <div class="space-y-2">
        <NumberInput
          value={singleStepValue()}
          repeat={false}
          onRawValueChange={(value) => {
            if (value !== undefined) {
              setSingleStepValue(value)
            }
          }}
          minValue={0}
          maxValue={99}
          step={1}
          variant="subtle"
        />
        <p class="text-xs text-muted-foreground">
          Set <code>repeat=false</code> to keep press-and-hold at a single step. Current value:{' '}
          {singleStepValue()}
        </p>
      </div>
    </div>
  )
}
