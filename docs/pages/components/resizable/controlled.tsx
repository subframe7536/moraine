import { Button, Resizable } from '@src'
import type { ResizableT } from '@src'
import { createSignal } from 'solid-js'

export function Controlled() {
  const [layout, setLayout] = createSignal<ResizableT.Layout>({ logs: 35, telemetry: 65 })

  return (
    <div class="space-y-3">
      <div class="flex flex-wrap gap-2 items-center justify-between">
        <div class="flex gap-1.5 items-center">
          <Button
            variant="outline"
            size="xs"
            onClick={() => setLayout({ logs: 25, telemetry: 75 })}
          >
            25 / 75
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={() => setLayout({ logs: 50, telemetry: 50 })}
          >
            50 / 50
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={() => setLayout({ logs: 75, telemetry: 25 })}
          >
            75 / 25
          </Button>
        </div>
        <div class="text-xs text-muted-foreground font-mono">
          Left: {Math.round(layout().logs ?? 0)}% | Right: {Math.round(layout().telemetry ?? 0)}%
        </div>
      </div>

      <div class="border border-border/60 rounded-xl bg-card/30 h-60 w-full shadow-xs overflow-hidden">
        <Resizable value={layout()} onValueChange={setLayout}>
          <Resizable.Panel id="logs" min={15} class="p-4 bg-muted/20 flex flex-col justify-between">
            <div class="space-y-2">
              <span class="text-xs text-foreground font-semibold">Worker Logs</span>
              <p class="text-[11px] text-muted-foreground leading-relaxed">
                Controlled through an external Solid signal. The layout record is keyed by panel id,
                so panels can be added or removed without losing their entries.
              </p>
            </div>
            <span class="text-[10px] text-muted-foreground font-mono">min: 15%</span>
          </Resizable.Panel>

          <Resizable.Handle />

          <Resizable.Panel
            id="telemetry"
            min={15}
            class="p-4 bg-background/50 flex flex-col justify-between"
          >
            <div class="space-y-2">
              <span class="text-xs text-foreground font-semibold">Telemetry Output</span>
              <p class="text-[11px] text-muted-foreground leading-relaxed">
                Use controlled state when persisting split configuration to localStorage or URL
                parameters.
              </p>
            </div>
            <span class="text-[10px] text-muted-foreground font-mono">min: 15%</span>
          </Resizable.Panel>
        </Resizable>
      </div>
    </div>
  )
}
