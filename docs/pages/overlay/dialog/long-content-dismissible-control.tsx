import { Button, Dialog } from '@src'
import { For, createSignal } from 'solid-js'

export function LongContentDismissibleControl() {
  const SCROLLABLE_LINES = Array.from(
    { length: 100 },
    (_, index) => `Release note line ${index + 1}`,
  )

  const [preventedCloseCount, setPreventedCloseCount] = createSignal(0)

  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Dialog
        scrollable
        title="Release Notes"
        description="Long content scrolls with the overlay."
        body={
          <div class="space-y-1">
            <For each={SCROLLABLE_LINES}>
              {(line) => <p class="text-sm text-foreground">{line}</p>}
            </For>
          </div>
        }
      >
        {(props) => (
          <Button {...props} variant="secondary">
            Overlay scroll dialog
          </Button>
        )}
      </Dialog>
      <Dialog
        fullscreen
        title="Release Notes"
        description="Full screen dialog content."
        body={
          <div class="space-y-1">
            <For each={SCROLLABLE_LINES}>
              {(line) => <p class="text-sm text-foreground">{line}</p>}
            </For>
          </div>
        }
      >
        {(props) => (
          <Button {...props} variant="secondary">
            Full screen dialog
          </Button>
        )}
      </Dialog>

      <Dialog
        dismissible={false}
        onClosePrevent={() => setPreventedCloseCount((value) => value + 1)}
        title="Persistent dialog"
        body={
          <p class="text-sm text-foreground">
            Prevented close attempts: <span class="font-medium">{preventedCloseCount()}</span>
          </p>
        }
      >
        {(props) => (
          <Button {...props} variant="outline">
            Dismiss blocked
          </Button>
        )}
      </Dialog>
    </div>
  )
}
