import { Button, Modal } from '@src'

export function ModalComposition() {
  return (
    <Modal>
      <Modal.Trigger as={Button}>Open Modal Surface</Modal.Trigger>
      <Modal.Portal>
        <Modal.Overlay />
        <Modal.Content ariaLabel="Custom Surface">
          {(context) => (
            <div class="p-4 b-(1 border) bg-background space-y-4 rounded-xl">
              <h3 class="font-semibold text-base">Custom Surface</h3>
              <p class="text-muted-foreground text-xs">
                Modal coordinates overlay, focus trap, and portal rendering.
              </p>
              <div class="flex justify-end">
                <Button size="xs" onClick={context.close}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal.Content>
      </Modal.Portal>
    </Modal>
  )
}
