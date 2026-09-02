import { Button, Input, Modal } from '@src'

export function Basic() {
  return (
    <Modal>
      <Modal.Trigger as={Button} leading="i-lucide:user-plus">
        Invite Teammate
      </Modal.Trigger>
      <Modal.Content overlay ariaLabel="Invite Teammate">
        {(context) => (
          <div class="p-6 b-(1 border) rounded-2xl bg-card flex flex-col gap-4 max-w-md w-full shadow-xl">
            <div>
              <h3 class="text-base text-foreground font-semibold">Invite to Workspace</h3>
              <p class="text-xs text-muted-foreground">
                Collaborators will receive an email invitation to join your workspace.
              </p>
            </div>

            <div class="space-y-1">
              <label class="text-xs text-muted-foreground font-medium">Colleague Email</label>
              <Input placeholder="colleague@company.com" leading="i-lucide:mail" />
            </div>

            <div class="pt-2 border-t border-border flex gap-2 justify-end">
              <Button variant="outline" onClick={context.close}>
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  context.close()
                }}
              >
                Send Invite
              </Button>
            </div>
          </div>
        )}
      </Modal.Content>
    </Modal>
  )
}
