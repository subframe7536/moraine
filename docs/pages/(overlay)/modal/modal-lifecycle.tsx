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
        <Modal.Content overlay ariaLabel="Lifecycle Monitored">
          {(context) => (
            <div class="p-6 b-(1 border) rounded-xl bg-background max-w-sm w-full shadow-xl space-y-4">
              <h3 class="text-base font-semibold">Lifecycle Monitored</h3>
              <p class="text-xs text-muted-foreground">
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
      </Modal>
      <p class="text-xs text-muted-foreground">
        Lifecycle log: <span class="text-foreground font-mono">{log()}</span>
      </p>
    </div>
  )
}
