import { Button, ButtonGroup, Icon, Popover } from '@src'

export function ButtonPopover() {
  return (
    <ButtonGroup aria-label="Document actions">
      <Button leading="i-lucide:save">Save document</Button>
      <Popover>
        <Popover.Trigger as={Button} size="icon-md" aria-label="Open save options">
          <Icon name="i-lucide:chevron-down" />
        </Popover.Trigger>
        <Popover.Content>
          <div class="p-3 space-y-1">
            <p class="font-medium text-sm">Save options</p>
            <p class="text-muted-foreground text-xs">Choose where to save this document.</p>
          </div>
        </Popover.Content>
      </Popover>
    </ButtonGroup>
  )
}
