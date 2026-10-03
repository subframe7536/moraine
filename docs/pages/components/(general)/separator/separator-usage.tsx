import { Separator } from '@src'

export function SeparatorUsage() {
  return (
    <div class="max-w-md w-full space-y-4">
      <div>
        <h4 class="text-sm font-medium">Moraine UI</h4>
        <p class="text-xs text-muted-foreground">Accessible SolidJS component system.</p>
      </div>
      <Separator />
      <div class="text-xs flex gap-4 h-5 items-center">
        <span>Docs</span>
        <Separator orientation="vertical" />
        <span>Source</span>
        <Separator orientation="vertical" />
        <span>Releases</span>
      </div>
    </div>
  )
}
