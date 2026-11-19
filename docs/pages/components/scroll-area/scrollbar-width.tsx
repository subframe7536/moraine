import { ScrollArea } from '@src'
import { For } from 'solid-js'

const entries = Array.from({ length: 12 }, (_, index) => index + 1)

export function ScrollbarWidth() {
  return (
    <div class="gap-4 grid grid-cols-2 max-w-lg w-full">
      <For each={['normal', 'thin'] as const}>
        {(width) => (
          <div class="space-y-2">
            <p class="text-sm font-medium capitalize">{width}</p>
            <ScrollArea
              scrollbarVariant="always"
              scrollbarWidth={width}
              class="border border-border rounded-md h-40"
              classes={{ content: 'px-3 pe-4' }}
              role="region"
              aria-label={`${width} scrollbar`}
            >
              <For each={entries}>{(entry) => <p class="text-sm py-1.5">Entry {entry}</p>}</For>
            </ScrollArea>
          </div>
        )}
      </For>
    </div>
  )
}
