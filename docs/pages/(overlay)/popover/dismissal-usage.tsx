import { Button, Popover } from '@src'

export function DismissalUsage() {
  return (
    <Popover>
      <Popover.Trigger as={Button} variant="outline" leading="i-lucide:sliders-horizontal">
        Filter
      </Popover.Trigger>
      <Popover.Content
        ariaLabel="Filter settings"
        content={
          <div class="text-xs p-3 w-48 space-y-2">
            <p class="text-foreground font-medium">Filter Settings</p>
            <p class="text-muted-foreground">Press Escape or click outside to dismiss.</p>
          </div>
        }
      />
    </Popover>
  )
}
