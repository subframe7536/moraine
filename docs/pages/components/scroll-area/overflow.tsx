import { Button, ScrollArea } from '@src'
import type { ScrollAreaT } from '@src'
import { For, Show, createSignal } from 'solid-js'

export function Overflow() {
  const [overflow, setOverflow] = createSignal<ScrollAreaT.Overflow>()
  let controller: ScrollAreaT.Controller | undefined

  return (
    <div class="max-w-sm w-full space-y-3">
      <ScrollArea
        shadow
        shadowSize={24}
        edgeThreshold={8}
        onOverflowChange={setOverflow}
        controllerRef={(value) => (controller = value)}
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
            <Button
              size="sm"
              variant="outline"
              onClick={() => controller?.scrollToEdge('y', 'start', { behavior: 'smooth' })}
            >
              Back to top
            </Button>
          }
        >
          <Button
            size="sm"
            variant="outline"
            onClick={() => controller?.scrollToEdge('y', 'end', { behavior: 'smooth' })}
          >
            Jump to latest
          </Button>
        </Show>
      </div>
    </div>
  )
}
