import { Button, BaseDialog } from '@src'
import { createSignal } from 'solid-js'
export function Controlled() {
  const [open, setOpen] = createSignal(false)

  return (
    <div class="flex flex-wrap gap-3">
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open controlled modal
      </Button>
      <BaseDialog open={open()} onOpenChange={setOpen}>
        <BaseDialog.Portal>
          <BaseDialog.Overlay />
          <BaseDialog.Content aria-label="Controlled modal">
            {(context) => (
              <div class="p-4 gap-4 grid">
                <p class="text-sm text-foreground">
                  The parent owns the open state through onOpenChange.
                </p>
                <Button class="justify-self-end" onClick={context.close}>
                  Close
                </Button>
              </div>
            )}
          </BaseDialog.Content>
        </BaseDialog.Portal>
      </BaseDialog>
    </div>
  )
}
