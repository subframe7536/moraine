import { Button, Dialog } from '@src'
import { createSignal } from 'solid-js'

export function ControlledLifecycle() {
  const [open, setOpen] = createSignal(false)
  const [exitCount, setExitCount] = createSignal(0)

  return (
    <div class="flex gap-3 items-center">
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open dialog
      </Button>
      <p class="text-sm text-muted-foreground">Completed exits: {exitCount()}</p>
      <Dialog
        open={open()}
        onOpenChange={setOpen}
        onExitComplete={() => setExitCount((count) => count + 1)}
      >
        <Dialog.Content
          title="Controlled dialog"
          body={
            <p class="text-sm">The parent owns visibility and observes completed exit motion.</p>
          }
          footer={<Button onClick={() => setOpen(false)}>Close</Button>}
        />
      </Dialog>
    </div>
  )
}
