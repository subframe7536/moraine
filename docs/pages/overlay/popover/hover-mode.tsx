import { Button, Popover } from '@src'

export function HoverMode() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Popover
        mode="hover"
        openDelay={180}
        closeDelay={120}
        content={
          <div class="space-y-1">
            <p class="text-sm font-medium">Hover Card</p>
            <p class="text-xs text-muted-foreground">
              This popover opens on hover and closes after delay.
            </p>
          </div>
        }
      >
        <Button variant="outline">Hover me</Button>
      </Popover>
    </div>
  )
}
