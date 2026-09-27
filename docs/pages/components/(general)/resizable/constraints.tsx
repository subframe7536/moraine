import { Icon, Resizable } from '@src'

export function Constraints() {
  return (
    <div class="border border-border/60 bg-card/30 h-64 w-full shadow-xs overflow-hidden rounded-xl">
      <Resizable defaultValue={['32%', '68%']}>
        <Resizable.Panel
          min="25%"
          max="45%"
          class="p-3 bg-muted/20 flex flex-col min-w-0 justify-between"
        >
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-foreground font-semibold flex gap-1.5 items-center text-xs">
                <Icon name="i-lucide:sliders" class="text-muted-foreground size-3.5" />
                Inspector
              </span>
              <span class="text-[10px] text-muted-foreground font-mono px-1.5 py-0.5 rounded bg-muted">
                25% – 45%
              </span>
            </div>

            <div class="space-y-2 text-xs">
              <div class="p-2 border border-border/40 bg-background/60 space-y-1 rounded-lg">
                <div class="text-[11px] text-muted-foreground">Canvas Grid</div>
                <div class="text-foreground font-medium text-xs">8px Baseline (Fluid)</div>
              </div>
              <div class="p-2 border border-border/40 bg-background/60 space-y-1 rounded-lg">
                <div class="text-[11px] text-muted-foreground">Color Profile</div>
                <div class="text-foreground font-medium text-xs">Display P3 (Wide Gamut)</div>
              </div>
            </div>
          </div>

          <div class="text-[11px] text-muted-foreground/80 flex gap-1 items-center">
            <Icon name="i-lucide:info" class="shrink-0 size-3" />
            <span class="truncate">Boundary stops dragging at limits.</span>
          </div>
        </Resizable.Panel>

        <Resizable.Handle />

        <Resizable.Panel min="35%" class="p-4 bg-background/50 flex flex-col justify-between">
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground font-medium flex gap-1.5 items-center text-xs">
                <Icon name="i-lucide:file-text" class="size-3.5" />
                design-tokens.json
              </span>
              <span class="text-[10px] text-muted-foreground">Viewport: min 35%</span>
            </div>
            <div class="text-muted-foreground font-mono p-3 border border-border/50 bg-muted/10 space-y-1 text-xs rounded-lg">
              <div>{'{'}</div>
              <div class="text-emerald-600 pl-4 dark:text-emerald-400">
                "spacing-unit": "0.25rem",
              </div>
              <div class="text-blue-600 pl-4 dark:text-blue-400">"radius-panel": "0.75rem",</div>
              <div class="text-purple-600 pl-4 dark:text-purple-400">"handle-hit-area": "6px"</div>
              <div>{'}'}</div>
            </div>
          </div>

          <div class="text-muted-foreground pt-2 border-t border-border/40 flex items-center justify-between text-xs">
            <span>Drag the separator to verify min and max limits.</span>
            <span class="text-[11px] font-mono">68% active</span>
          </div>
        </Resizable.Panel>
      </Resizable>
    </div>
  )
}
