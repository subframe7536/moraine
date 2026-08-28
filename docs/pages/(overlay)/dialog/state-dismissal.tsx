import { Button, Dialog } from '@src'
import { createSignal } from 'solid-js'

export function StateDismissal() {
  const [open, setOpen] = createSignal(false)

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Open Controlled Dialog</Button>
      <Dialog
        open={open()}
        onOpenChange={setOpen}
        title="Controlled Dialog"
        description="This dialog visibility is governed by reactive SolidJS signal state."
        body={
          <p class="text-sm text-muted-foreground">
            Clicking confirm or cancel updates the signal to close the modal.
          </p>
        }
        footer={
          <div class="flex gap-2 w-full justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Confirm</Button>
          </div>
        }
      />
    </div>
  )
}
