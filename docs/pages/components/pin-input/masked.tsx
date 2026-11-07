import { Field, PinInput } from '@src'
import { createSignal, Show } from 'solid-js'

export function Masked() {
  const [pin, setPin] = createSignal('')

  return (
    <div class="max-w-sm space-y-3">
      <Field
        label="Transaction PIN"
        description="Enter your 4-digit security PIN for confirmation."
      >
        <PinInput type="number" length={4} mask onComplete={(val) => setPin(val)} />
      </Field>
      <Show when={pin()}>
        <p class="text-xs text-muted-foreground">PIN entered ({pin().length} digits)</p>
      </Show>
    </div>
  )
}
