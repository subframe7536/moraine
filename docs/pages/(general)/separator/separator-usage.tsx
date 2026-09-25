import { Separator } from '@src'

export function SeparatorUsage() {
  return (
    <div class="max-w-md w-full space-y-4">
      <div>
        <h4 class="font-medium text-sm">Moraine UI</h4>
        <p class="text-muted-foreground text-xs">Accessible SolidJS component system.</p>
      </div>
      <Separator />
      <div class="flex gap-4 h-5 items-center text-xs">
        <span>Docs</span>
        <Separator orientation="vertical" />
        <span>Source</span>
        <Separator orientation="vertical" />
        <span>Releases</span>
      </div>
    </div>
  )
}
