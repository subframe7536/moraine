import { Button, Input, Modal, InputGroup, Icon, Field } from '@src'

export function Basic() {
  return (
    <Modal>
      <Modal.Trigger as={Button} leading="i-lucide:user-plus">
        Invite Teammate
      </Modal.Trigger>
      <Modal.Overlay />
      <Modal.Content ariaLabel="Invite Teammate">
        {(context) => (
          <div class="p-4 b-(1 border) rounded-2xl bg-card flex flex-col gap-4">
            <div>
              <h3 class="text-base text-foreground font-semibold">Invite to Workspace</h3>
              <p class="text-xs text-muted-foreground">
                Collaborators will receive an email invitation to join your workspace.
              </p>
            </div>

            <Field label="Colleague Email">
              <InputGroup>
                <InputGroup.Leading>
                  <Icon name="i-lucide:mail" />
                </InputGroup.Leading>
                <Input placeholder="colleague@company.com" />
              </InputGroup>
            </Field>

            <div class="pt-2 border-t border-border flex gap-2 justify-end">
              <Modal.Close as={Button} variant="outline">
                Cancel
              </Modal.Close>
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
