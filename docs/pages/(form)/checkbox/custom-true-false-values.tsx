import { Badge, Checkbox } from '@src'
import { createSignal } from 'solid-js'

export function CustomTrueFalseValues() {
  const [telemetry, setTelemetry] = createSignal<'opted-in' | 'opted-out'>('opted-in')

  return (
    <div class="p-4 b-(1 border) rounded-xl max-w-xl space-y-4">
      <div class="flex gap-4 items-center justify-between">
        <Checkbox<'opted-in', 'opted-out'>
          label="Anonymous telemetry collection"
          description="Send anonymous crash diagnostics and performance reports."
          trueValue="opted-in"
          falseValue="opted-out"
          checked={telemetry()}
          onChange={setTelemetry}
        />
        <Badge variant={telemetry() === 'opted-in' ? 'default' : 'outline'}>{telemetry()}</Badge>
      </div>

      <p class="text-xs text-muted-foreground">
        Controlled domain state is stored as <code class="font-mono">{telemetry()}</code> instead of
        a raw boolean.
      </p>
    </div>
  )
}
