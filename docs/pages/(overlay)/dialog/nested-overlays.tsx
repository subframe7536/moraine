import { Button, Dialog, Input, Popover } from '@src'

export function NestedOverlays() {
  return (
    <Dialog>
      <Dialog.Trigger as={Button} variant="outline">
        Open Workspace Settings
      </Dialog.Trigger>
      <Dialog.Content
        title="Workspace Settings"
        description="Manage your project workspace settings and dangerous actions."
        body={
          <div class="py-2 space-y-4">
            <div class="space-y-1.5">
              <label class="text-sm font-medium">Workspace Name</label>
              <Input defaultValue="Acme Production" />
            </div>

            <div class="flex gap-2 items-center">
              <span class="text-sm text-muted-foreground">Need clarification?</span>
              <Popover>
                <Popover.Trigger as={Button} variant="outline" size="sm">
                  View Help
                </Popover.Trigger>
                <Popover.Content
                  ariaLabel="Settings help"
                  content="Changes apply to this workspace only. Admin privileges are required to modify settings."
                />
              </Popover>
            </div>
          </div>
        }
        footer={
          <div class="flex w-full items-center justify-between">
            <Dialog>
              <Dialog.Trigger as={Button} variant="destructive">
                Delete Workspace
              </Dialog.Trigger>
              <Dialog.Content
                title="Delete Workspace"
                description="Are you sure you want to permanently delete this workspace? This action cannot be undone."
                footer={
                  <div class="flex gap-2 w-full justify-end">
                    <Dialog.Close as={Button} variant="outline">
                      Cancel
                    </Dialog.Close>
                    <Button variant="destructive">Confirm Delete</Button>
                  </div>
                }
              />
            </Dialog>

            <div class="flex gap-2">
              <Dialog.Close as={Button} variant="outline">
                Close
              </Dialog.Close>
              <Button>Save Changes</Button>
            </div>
          </div>
        }
      />
    </Dialog>
  )
}
