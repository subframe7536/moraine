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
        <div class="flex flex-wrap gap-3 items-center">
          <Popover>
            <Popover.Trigger as={Button} variant="outline">
              View settings help
            </Popover.Trigger>
            <Popover.Content
              ariaLabel="Settings help"
              content="Changes apply to this workspace only."
            />
          </Popover>
          <Dialog>
            <Dialog.Trigger as={Button}>Confirm workspace changes</Dialog.Trigger>
            <Dialog.Content
              title="Confirm changes"
              description="Escape closes this confirmation before closing workspace settings."
              footer={
                <Dialog.Close
                  as={Button}
                  variant="outline"
                  class="px-3 py-1.5 h-auto w-auto static"
                >
                  Return to settings
                </Dialog.Close>
              }
            />
          </Dialog>
        </div>
      </Dialog.Content>
    </Dialog>
  )
}
