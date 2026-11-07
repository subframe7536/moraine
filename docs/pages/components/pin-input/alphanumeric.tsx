import { Field, PinInput } from '@src'
import { createSignal, Show } from 'solid-js'

export function Alphanumeric() {
  const [code, setCode] = createSignal('')

  return (
    <div class="max-w-md space-y-3">
      <Field
        label="Backup Recovery Key"
        description="Enter your 8-character alphanumeric recovery key."
      >
        <PinInput
          validationType="alphanumeric"
          length={8}
          separator={4}
          onComplete={(val) => setCode(val)}
        />
      </Field>
      <Show when={code()}>
        <p class="text-xs text-muted-foreground font-mono">Recovery key: {code()}</p>
      </Show>
    </div>
  )
}
