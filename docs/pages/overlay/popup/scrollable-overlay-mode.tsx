import { Button, Popup } from '@src'
import { For } from 'solid-js'

export function ScrollableOverlayMode() {
  const SCROLLABLE_LINES = Array.from({ length: 48 }, (_, index) => `Popup line ${index + 1}`)

  return (
    <Popup
      scrollable
      content={
        <div class="p-4 b-1 b-border rounded-xl bg-background ring-1 ring-foreground/10 shadow-md">
          <h3 class="text-sm font-semibold">Scrollable Popup</h3>
          <div class="mt-2 space-y-1">
            <For each={SCROLLABLE_LINES}>
              {(line) => <p class="text-sm text-foreground">{line}</p>}
            </For>
          </div>
        </div>
      }
    >
      <Button variant="outline">Open scrollable popup</Button>
    </Popup>
  )
}
