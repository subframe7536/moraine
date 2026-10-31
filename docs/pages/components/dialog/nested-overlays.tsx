import { Button, Dialog, Popover } from '@src'

export function NestedOverlays() {
  return (
    <Dialog>
      <Dialog.Trigger as={Button} variant="outline">
        Open nested overlays
      </Dialog.Trigger>
      <Dialog.Content
        title="Workspace settings"
        description="Review help before confirming your workspace changes."
      >
        <Dialog.Footer>
          <div class="flex flex-wrap gap-3">
            <Popover>
              <Popover.Trigger as={Button} variant="outline">
                View settings help
              </Popover.Trigger>
              <Popover.Content aria-label="Settings help">
                <div class="p-3">Changes apply to this workspace only.</div>
              </Popover.Content>
            </Popover>
            <Dialog>
              <Dialog.Trigger as={Button}>Confirm workspace changes</Dialog.Trigger>
              <Dialog.Content
                title="Confirm changes"
                description="Escape closes this confirmation before closing workspace settings."
              >
                <Dialog.Footer>
                  <Dialog.Close as={Button} variant="outline">
                    Return to settings
                  </Dialog.Close>
                </Dialog.Footer>
              </Dialog.Content>
            </Dialog>
          </div>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  )
}
