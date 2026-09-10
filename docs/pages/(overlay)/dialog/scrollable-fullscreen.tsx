import { Button, Dialog } from '@src'
import { For } from 'solid-js'

export function ScrollableFullscreen() {
  const SCROLLABLE_LINES = Array.from(
    { length: 24 },
    (_, index) => `Release note line ${index + 1}`,
  )

  return (
    <div class="flex flex-wrap gap-3 items-center">
      <Dialog>
        <Dialog.Trigger as={Button} variant="secondary">
          Overlay scroll dialog
        </Dialog.Trigger>
        <Dialog.Content
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
        />
      </Dialog>
      <Dialog>
        <Dialog.Trigger as={Button} variant="secondary">
          Full screen dialog
        </Dialog.Trigger>
        <Dialog.Content
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
        />
      </Dialog>
    </div>
  )
}
