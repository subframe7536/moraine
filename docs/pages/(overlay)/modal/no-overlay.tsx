import { Button, Modal } from '@src'

export function NoOverlay() {
  return (
    <Modal>
      <Modal.Trigger as={Button} variant="outline">
        Open without backdrop
      </Modal.Trigger>
      <Modal.Content
        ariaLabel="Modal without a backdrop"
        contentRender={(context) => (
          <div class="grid gap-4 p-4">
            <p class="text-sm text-foreground">Set overlay to false when the host surface provides context.</p>
            <Button class="justify-self-end" onClick={context.close}>
              Close
            </Button>
          </div>
        )}
      />
    </Modal>
  )
}
