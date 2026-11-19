import { Button, ScrollArea } from '@src'
import type { ScrollAreaT } from '@src'
import { For, Show, createSignal } from 'solid-js'

export function Overflow() {
  const [overflow, setOverflow] = createSignal<ScrollAreaT.Overflow>()
  let viewport: HTMLDivElement | undefined
  const scrollTo = (top: number) => viewport?.scrollTo({ top, behavior: 'smooth' })

  return (
    <div class="max-w-sm w-full space-y-3">
      <ScrollArea
        shadow
        shadowSize={24}
        scrollThreshold={8}
        onOverflowChange={setOverflow}
        viewportRef={(element) => (viewport = element)}
        class="h-48 w-full"
        classes={{ content: 'pe-3 space-y-1' }}
        role="region"
        aria-label="Notifications"
      >
        <For each={Array.from({ length: 10 }, (_, index) => index + 1)}>
          {(entry) => <p class="text-sm py-1.5">Notification {entry}</p>}
        </For>
      </ScrollArea>
      <div class="flex gap-2 items-center justify-between">
        <p class="text-sm text-muted-foreground">
          More above: <output>{overflow()?.y.start ? 'yes' : 'no'}</output>, more below:{' '}
          <output>{overflow()?.y.end ? 'yes' : 'no'}</output>
        </p>
        <Show
          when={overflow()?.y.end}
          fallback={
            <Button size="sm" variant="outline" onClick={() => scrollTo(0)}>
              Back to top
            </Button>
          }
        >
          <Button size="sm" variant="outline" onClick={() => scrollTo(viewport?.scrollHeight ?? 0)}>
            Jump to latest
          </Button>
        </Show>
      </div>
    </div>
  )
}
