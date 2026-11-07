import { PinInput } from '@src'
import { createSignal, Show } from 'solid-js'

export function OtpExample() {
  const [completedCode, setCompletedCode] = createSignal('')

  return (
    <div class="flex flex-col gap-3">
      <PinInput
        length={6}
        separator={3}
        placeholder="○"
        otp
        onComplete={(code) => setCompletedCode(code)}
      />
      <Show when={completedCode()}>
        <p class="text-sm text-muted-foreground">Verification code entered: {completedCode()}</p>
      </Show>
    </div>
  )
}
