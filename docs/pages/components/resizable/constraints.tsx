import { Icon, Resizable } from '@src'

export function Constraints() {
  return (
    <div class="border border-border rounded-xl h-64 w-full overflow-hidden">
      <Resizable defaultValue={['32%', '68%']}>
        <Resizable.Panel min="25%" max="45%">
          <div class="p-3 flex flex-col h-full min-w-0 justify-between">
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold flex gap-1.5 items-center">
                  <Icon name="i-lucide:sliders" />
                  Inspector
                </span>
                <span class="text-xs text-muted-foreground font-mono">25% – 45%</span>
              </div>

              <div class="text-xs space-y-2">
                <div class="p-2 border border-border rounded-lg space-y-1">
                  <div class="text-muted-foreground">Canvas Grid</div>
                  <div class="font-medium">8px Baseline</div>
                </div>
                <div class="p-2 border border-border rounded-lg space-y-1">
                  <div class="text-muted-foreground">Color Profile</div>
                  <div class="font-medium">Display P3</div>
                </div>
              </div>
            </div>

            <div class="text-xs text-muted-foreground flex gap-1 items-center">
              <Icon name="i-lucide:info" />
              <span class="truncate">Dragging stops at the limits.</span>
            </div>
          </div>
        </Resizable.Panel>

        <Resizable.Handle />

        <Resizable.Panel min="35%">
          <div class="p-4 flex flex-col h-full justify-between">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs text-muted-foreground font-medium flex gap-1.5 items-center">
                  <Icon name="i-lucide:file-text" />
                  design-tokens.json
                </span>
                <span class="text-xs text-muted-foreground">Viewport: min 35%</span>
              </div>
              <div class="text-xs text-muted-foreground font-mono p-3 border border-border rounded-lg space-y-1">
                <div>{'{'}</div>
                <div class="pl-4">"spacing-unit": "0.25rem",</div>
                <div class="pl-4">"radius-panel": "0.75rem",</div>
                <div class="pl-4">"handle-hit-area": "6px"</div>
                <div>{'}'}</div>
              </div>
            </div>

            <div class="text-xs text-muted-foreground pt-2 border-t border-border flex items-center justify-between">
              <span>Drag the separator to test the min and max limits.</span>
              <span class="font-mono">68% active</span>
            </div>
          </div>
        </Resizable.Panel>
      </Resizable>
    </div>
  )
}
