import { Button, Modal } from '@src'
import { createSignal } from 'solid-js'

export function ModalLifecycle() {
  const [open, setOpen] = createSignal(false)
  const [log, setLog] = createSignal('Idle')

  return (
    <div class="space-y-3">
      <Button onClick={() => setOpen(true)}>Open Managed Modal</Button>
      <Modal
        open={open()}
        onOpenChange={setOpen}
        onExitComplete={() => setLog('Exit transition fully completed')}
      >
        <Modal.Portal>
          <Modal.Overlay />
          <Modal.Content ariaLabel="Lifecycle Monitored">
            {(context) => (
              <div class="p-4 b-(1 border) bg-background space-y-4 rounded-xl">
                <h3 class="font-semibold text-base">Lifecycle Monitored</h3>
                <p class="text-muted-foreground text-xs">
                  Exit callbacks fire after presence transitions resolve.
                </p>
                <div class="flex justify-end">
                  <Button size="xs" onClick={context.close}>
                    Dismiss
                  </Button>
                </div>
              </div>
            )}
          </Modal.Content>
        </Modal.Portal>
      </Modal>
      <p class="text-muted-foreground text-xs">
        Lifecycle log: <span class="text-foreground font-mono">{log()}</span>
      </p>
    </div>
  )
}
