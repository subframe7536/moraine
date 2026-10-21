import { Alert, Button } from '@src'
import { createSignal, Show } from 'solid-js'

export function CloseExample() {
  const [open, setOpen] = createSignal(true)

  return (
    <div class="flex flex-col gap-3 max-w-xl w-full">
      <Show when={!open()}>
        <div>
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            Reset Alert
          </Button>
        </div>
      </Show>
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
