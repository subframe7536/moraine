import { Button, Icon, Separator } from '@src'

export function Orientation() {
  return (
    <div class="text-xs p-2 b-(1 border) rounded-xl bg-card flex gap-3 max-w-xl items-center">
      <div class="font-semibold flex gap-2 items-center">
        <Icon name="i-lucide:layers" class="text-primary size-4" />
        <span>Moraine</span>
      </div>

      <Separator orientation="vertical" class="h-5" />

      <div class="text-muted-foreground flex gap-2 items-center">
        <Button variant="ghost" size="xs">
          Overview
        </Button>
        <Button variant="ghost" size="xs">
          Deployments
        </Button>
        <Button variant="ghost" size="xs">
          Settings
        </Button>
      </div>

      <Separator orientation="vertical" class="h-5" />

      <div class="ml-auto flex gap-2 items-center">
        <Icon name="i-lucide:bell" class="text-muted-foreground size-3.5" />
        <span class="text-muted-foreground font-mono">v2.4.0</span>
      </div>
    </div>
  )
}
