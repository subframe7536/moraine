import { ScrollArea } from '@src'
import type { ScrollAreaT } from '@src'
import { For, createSignal } from 'solid-js'

export function Visibility() {
  const [overflow, setOverflow] = createSignal<Exclude<ScrollAreaT.Visibility, 'auto'>>('none')

  return (
    <div class="max-w-sm w-full space-y-3">
      <ScrollArea
        shadow
        shadowSize={24}
        offset={8}
        visibility="auto"
        onVisibilityChange={setOverflow}
        class="pr-3 h-48 w-full space-y-1"
        role="region"
        aria-label="Notifications"
      >
        <For each={Array.from({ length: 10 }, (_, index) => index + 1)}>
          {(entry) => <p class="text-sm py-1.5">Notification {entry}</p>}
        </For>
      </ScrollArea>
      <p class="text-sm text-muted-foreground">
        Overflow: <output aria-live="polite">{overflow()}</output>
      </p>
    </div>
  )
}
