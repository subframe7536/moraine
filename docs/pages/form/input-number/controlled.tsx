import { InputNumber } from '@src'
import { createSignal } from 'solid-js'

export function Controlled() {
  const [controlledValue, setControlledValue] = createSignal(10)

  return (
    <div class="max-w-xs space-y-2">
      <InputNumber
        value={controlledValue()}
        onRawValueChange={(v) => {
          if (Number.isFinite(v)) {
            setControlledValue(v)
          }
        }}
        minValue={0}
        maxValue={99}
        variant="subtle"
      />
      <p class="text-xs text-muted-foreground">Current value: {controlledValue()}</p>
    </div>
  )
}
