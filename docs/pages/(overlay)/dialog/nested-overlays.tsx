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
        <Dialog.Footer class="flex-wrap gap-3">
          <Popover>
            <Popover.Trigger as={Button} variant="outline">
              View settings help
            </Popover.Trigger>
            <Popover.Content ariaLabel="Settings help" class="p-3">
              Changes apply to this workspace only.
            </Popover.Content>
          </Popover>
          <Dialog>
            <Dialog.Trigger as={Button}>Confirm workspace changes</Dialog.Trigger>
            <Dialog.Content
              title="Confirm changes"
              description="Escape closes this confirmation before closing workspace settings."
            >
              <Dialog.Footer>
                <Dialog.Close
                  as={Button}
                  variant="outline"
                  class="px-3 py-1.5 h-auto w-auto static"
                >
                  Return to settings
                </Dialog.Close>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  )
}
