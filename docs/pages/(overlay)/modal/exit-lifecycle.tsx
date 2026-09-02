import { Button, Modal } from '@src'
import { createSignal } from 'solid-js'

export function ExitLifecycle() {
  const [open, setOpen] = createSignal(false)
  const [exitCount, setExitCount] = createSignal(0)

  return (
    <div class="flex gap-3 items-center">
      <Button onClick={() => setOpen(true)}>Open modal</Button>
      <p class="text-sm text-muted-foreground">Completed exits: {exitCount()}</p>
      <Modal
        open={open()}
        onOpenChange={setOpen}
        onExitComplete={() => setExitCount((count) => count + 1)}
      >
        <Modal.Content overlay ariaLabel="Exit lifecycle example">
          {({ close }) => (
            <div class="p-5 rounded-xl bg-card shadow-xl">
              <p class="text-sm mb-4">
                Close this modal and watch the count update after exit motion.
              </p>
              <Button onClick={close}>Close</Button>
            </div>
          )}
        </Modal.Content>
      </Modal>
    </div>
  )
}
