import { FormField, InputNumber } from '@src'
import { createSignal } from 'solid-js'

export function Boundaries() {
  const [value, setValue] = createSignal(5)

  return (
    <div class="max-w-xs w-full space-y-3">
      <FormField label="Quantity (0 - 10)">
        <InputNumber
          value={value()}
          onRawValueChange={(v) => {
            if (Number.isFinite(v)) {
              setValue(v)
            }
          }}
          minValue={0}
          maxValue={10}
        />
      </FormField>
      <p class="text-xs text-muted-foreground">
        Numeric value: <span class="text-foreground font-mono">{value()}</span>
      </p>
    </div>
  )
}
