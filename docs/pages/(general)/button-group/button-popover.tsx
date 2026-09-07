import { Button, ButtonGroup, Icon, Popover } from '@src'

export function ButtonPopover() {
  return (
    <ButtonGroup aria-label="Document actions">
      <Button leading="i-lucide:save">Save document</Button>
      <Popover>
        <Popover.Trigger as={Button} size="icon-md" aria-label="Open save options">
          <Icon name="i-lucide:chevron-down" />
        </Popover.Trigger>
        <Popover.Content
          content={
            <div class="p-3 space-y-1">
              <p class="text-sm font-medium">Save options</p>
              <p class="text-xs text-muted-foreground">Choose where to save this document.</p>
            </div>
          }
        />
      </Popover>
    </ButtonGroup>
  )
}
