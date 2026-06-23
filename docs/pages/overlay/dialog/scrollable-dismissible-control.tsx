import { Button, Dialog } from '@src'
import { For, createSignal } from 'solid-js'

export function ScrollableDismissibleControl() {
  const SCROLLABLE_LINES = Array.from(
    { length: 16 },
    (_, index) => `Release note line ${index + 1}`,
  )

  const [preventedCloseCount, setPreventedCloseCount] = createSignal(0)

  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Dialog
        scrollable
        title="Release Notes"
        description="Scrollable dialog content."
        body={
          <div class="space-y-1">
            <For each={SCROLLABLE_LINES}>
              {(line) => <p class="text-sm text-foreground">{line}</p>}
            </For>
          </div>
        }
      >
        <Button variant="secondary">Scrollable dialog</Button>
      </Dialog>

      <Dialog
        defaultOpen
        dismissible={false}
        onClosePrevent={() => setPreventedCloseCount((value) => value + 1)}
        title="Persistent dialog"
        body={
          <p class="text-sm text-foreground">
            Prevented close attempts: <span class="font-medium">{preventedCloseCount()}</span>
          </p>
        }
      >
        <Button variant="outline">Dismiss blocked</Button>
      </Dialog>
    </div>
  )
}
