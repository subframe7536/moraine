import { Button, Dialog, Popover } from '@src'

export function NestedOverlays() {
  return (
    <Dialog>
      <Dialog.Trigger as={Button} variant="outline">
        Open nested overlays
      </Dialog.Trigger>
      <Dialog.Content title="Workspace settings">
        <div class="flex flex-wrap gap-3">
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
            <Dialog.Content title="Confirm changes">
              <p>Escape closes this confirmation before closing workspace settings.</p>
              <Dialog.Close as={Button}>Return to settings</Dialog.Close>
            </Dialog.Content>
          </Dialog>
        </div>
      </Dialog.Content>
    </Dialog>
  )
}
