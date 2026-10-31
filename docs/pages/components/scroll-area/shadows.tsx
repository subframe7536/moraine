import { ScrollArea } from '@src'
import { For } from 'solid-js'

const entries = [
  'Reviewed the project brief.',
  'Agreed on the navigation structure.',
  'Added the first component examples.',
  'Checked keyboard interactions.',
  'Updated the shared theme tokens.',
  'Tested layouts on smaller screens.',
  'Published the accessibility notes.',
  'Prepared the next release.',
]

export function Shadows() {
  return (
    <ScrollArea shadow class="h-48" role="region" aria-label="Project activity">
      <div class="pr-3 space-y-1">
        <For each={entries}>
          {(entry, index) => (
            <div class="py-1.5 flex gap-2 items-baseline">
              <span class="text-xs text-muted-foreground shrink-0">Update {index() + 1}</span>
              <p class="text-sm">{entry}</p>
            </div>
          )}
        </For>
      </div>
    </ScrollArea>
  )
}
