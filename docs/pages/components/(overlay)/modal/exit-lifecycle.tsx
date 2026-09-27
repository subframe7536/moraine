import { Button, Modal } from '@src'
import { createSignal } from 'solid-js'

export function ExitLifecycle() {
  const [open, setOpen] = createSignal(false)
  const [exitCount, setExitCount] = createSignal(0)

  return (
    <div class="flex gap-3 items-center">
      <Button onClick={() => setOpen(true)}>Open modal</Button>
      <p class="text-muted-foreground text-sm">Completed exits: {exitCount()}</p>
      <Modal
        open={open()}
        onOpenChange={setOpen}
        onExitComplete={() => setExitCount((count) => count + 1)}
      >
        <Modal.Portal>
          <Modal.Overlay />
          <Modal.Content ariaLabel="Exit lifecycle example">
            {({ close }) => (
              <div class="p-5 bg-card shadow-xl rounded-xl">
                <p class="mb-4 text-sm">
                  Close this modal and watch the count update after exit motion.
                </p>
                <Button onClick={close}>Close</Button>
              </div>
            )}
          </Modal.Content>
        </Modal.Portal>
      </Modal>
    </div>
  )
}
