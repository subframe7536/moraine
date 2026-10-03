import { Button, Resizable } from '@src'
import { createMemo, createSignal } from 'solid-js'

export function Controlled() {
  const [sizes, setSizes] = createSignal<number[]>([280, 520])

  const percentages = createMemo(() => {
    const total = sizes().reduce((a, b) => a + b, 0) || 1
    return sizes().map((size) => `${Math.round((size / total) * 100)}%`)
  })

  return (
    <div class="space-y-3">
      <div class="flex flex-wrap gap-2 items-center justify-between">
        <div class="flex gap-1.5 items-center">
          <Button variant="outline" size="xs" onClick={() => setSizes([200, 600])}>
            25 / 75
          </Button>
          <Button variant="outline" size="xs" onClick={() => setSizes([400, 400])}>
            50 / 50
          </Button>
          <Button variant="outline" size="xs" onClick={() => setSizes([600, 200])}>
            75 / 25
          </Button>
        </div>
        <div class="text-xs text-muted-foreground font-mono">
          Left: {Math.round(sizes()[0] ?? 0)}px ({percentages()[0]}) | Right:{' '}
          {Math.round(sizes()[1] ?? 0)}px ({percentages()[1]})
        </div>
      </div>

      <div class="border border-border/60 rounded-xl bg-card/30 h-60 w-full shadow-xs overflow-hidden">
        <Resizable value={sizes()} onChange={setSizes}>
          <Resizable.Panel min={150} class="p-4 bg-muted/20 flex flex-col justify-between">
            <div class="space-y-2">
              <span class="text-xs text-foreground font-semibold">Worker Logs</span>
              <p class="text-[11px] text-muted-foreground leading-relaxed">
                Controlled through external Solid signal. Size updates trigger seamless state
                synchronization.
              </p>
            </div>
            <span class="text-[10px] text-muted-foreground font-mono">min: 150px</span>
          </Resizable.Panel>

          <Resizable.Handle />

          <Resizable.Panel min={150} class="p-4 bg-background/50 flex flex-col justify-between">
            <div class="space-y-2">
              <span class="text-xs text-foreground font-semibold">Telemetry Output</span>
              <p class="text-[11px] text-muted-foreground leading-relaxed">
                Use controlled state when persisting split configuration to localStorage or URL
                parameters.
              </p>
            </div>
            <span class="text-[10px] text-muted-foreground font-mono">min: 150px</span>
          </Resizable.Panel>
        </Resizable>
      </div>
    </div>
  )
}
