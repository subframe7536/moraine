import { ScrollArea } from '@src'
import { For } from 'solid-js'

const entries = Array.from({ length: 12 }, (_, index) => index + 1)

export function Rtl() {
  return (
    <ScrollArea
      dir="rtl"
      shadow
      class="border border-border rounded-md h-48 max-w-sm w-full"
      classes={{ content: 'px-3' }}
      role="region"
      aria-label="RTL activity"
    >
      <For each={entries}>{(entry) => <p class="text-sm py-1.5">Activity entry {entry}</p>}</For>
    </ScrollArea>
  )
}
