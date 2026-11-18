import { Button, BaseDialog } from '@src'

export function NoOverlay() {
  return (
    <BaseDialog>
      <BaseDialog.Trigger as={Button} variant="outline">
        Open without backdrop
      </BaseDialog.Trigger>
      <BaseDialog.Portal>
        <BaseDialog.Content aria-label="Modal without a backdrop">
          {(context) => (
            <div class="p-4 gap-4 grid">
              <p class="text-sm text-foreground">
                Omit BaseDialog.Overlay when the host surface provides context.
              </p>
              <Button class="justify-self-end" onClick={context.close}>
                Close
              </Button>
            </div>
          )}
        </BaseDialog.Content>
      </BaseDialog.Portal>
    </BaseDialog>
  )
}
