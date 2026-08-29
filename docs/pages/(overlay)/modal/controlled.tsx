import { Button, Modal } from '@src'
import { createSignal } from 'solid-js'

export function Controlled() {
  const [open, setOpen] = createSignal(false)

  return (
    <div class="flex flex-wrap gap-3">
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open controlled modal
      </Button>
      <Modal open={open()} onOpenChange={setOpen}>
        <Modal.Content
          overlay
          ariaLabel="Controlled modal"
          contentRender={(context) => (
            <div class="p-4 gap-4 grid">
              <p class="text-sm text-foreground">
                The parent owns the open state through onOpenChange.
              </p>
              <Button class="justify-self-end" onClick={context.close}>
                Close
              </Button>
            </div>
          )}
        />
      </Modal>
    </div>
  )
}
