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

      <div class="border border-border rounded-xl h-60 w-full overflow-hidden">
        <Resizable value={sizes()} onValueChange={setSizes}>
          <Resizable.Panel min={150}>
            <div class="p-4 flex flex-col h-full justify-between">
              <div class="space-y-2">
                <span class="text-xs font-semibold">Worker Logs</span>
                <p class="text-xs text-muted-foreground">
                  Sizes come from an external Solid signal that the preset buttons update.
                </p>
              </div>
              <span class="text-xs text-muted-foreground font-mono">min: 150px</span>
            </div>
          </Resizable.Panel>

          <Resizable.Handle />

          <Resizable.Panel min={150}>
            <div class="p-4 flex flex-col h-full justify-between">
              <div class="space-y-2">
                <span class="text-xs font-semibold">Telemetry Output</span>
                <p class="text-xs text-muted-foreground">
                  Own the value when you persist the split to localStorage or the URL.
                </p>
              </div>
              <span class="text-xs text-muted-foreground font-mono">min: 150px</span>
            </div>
          </Resizable.Panel>
        </Resizable>
      </div>
    </div>
  )
}
