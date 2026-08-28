import { Button, ButtonGroup, Icon, Popover } from '@src'

export function ButtonPopover() {
  return (
    <ButtonGroup aria-label="Document actions">
      <Button leading="i-lucide:save">Save document</Button>
      <Popover
        content={
          <div class="space-y-1 p-3">
            <p class="text-sm font-medium">Save options</p>
            <p class="text-xs text-muted-foreground">Choose where to save this document.</p>
          </div>
        }
      >
        {(props) => (
          <Button {...props} size="icon-md" aria-label="Open save options">
            <Icon name="i-lucide:chevron-down" />
          </Button>
        )}
      </Popover>
    </ButtonGroup>
  )
}
