import { Progress } from '@src'

export function Orientations() {
  return (
    <div class="flex gap-6 w-xl items-end">
      <div class="flex-1 space-y-2">
        <p class="text-muted-foreground font-mono text-xs">horizontal</p>
        <Progress value={32} status />
      </div>

      <div class="space-y-2">
        <p class="text-muted-foreground font-mono text-xs">vertical</p>
        <div class="h-44">
          <Progress value={32} status orientation="vertical" />
        </div>
      </div>
    </div>
  )
}
