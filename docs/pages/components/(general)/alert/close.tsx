import { Alert, Button } from '@src'
import { createSignal } from 'solid-js'

export function CloseExample() {
  const [open, setOpen] = createSignal(true)

  return (
    <div class="flex flex-col gap-3 max-w-xl w-full">
      <div>
        <Button variant="outline" size="sm" disabled={open()} onClick={() => setOpen(true)}>
          Reopen Alert
        </Button>
      </div>
      <Alert
        open={open()}
        onOpenChange={setOpen}
        close
        type="info"
        title="Dismissible notice"
        description="You can close this alert by clicking the close button on the right."
      />
    </div>
  )
}
