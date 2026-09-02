import { Button, Modal } from '@src'

export function ModalComposition() {
  return (
    <Modal>
      <Modal.Trigger as={Button}>Open Modal Surface</Modal.Trigger>
      <Modal.Content overlay ariaLabel="Custom Surface">
        {(context) => (
          <div class="p-6 b-(1 border) rounded-xl bg-background max-w-sm w-full shadow-xl space-y-4">
            <h3 class="text-base font-semibold">Custom Surface</h3>
            <p class="text-xs text-muted-foreground">
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
    </Modal>
  )
}
