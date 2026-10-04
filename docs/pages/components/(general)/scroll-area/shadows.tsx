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
    <div class="gap-6 grid w-full sm:grid-cols-2">
      <For each={[false, true]}>
        {(shadow) => (
          <div class="space-y-3">
            <p class="text-sm font-medium">{shadow ? 'Shadows enabled' : 'Native scrolling'}</p>
            <ScrollArea
              shadow={shadow}
              class="pr-3 h-48 space-y-1"
              role="region"
              aria-label={shadow ? 'Activity with edge shadows' : 'Activity without edge shadows'}
            >
              <For each={entries}>
                {(entry, index) => (
                  <div class="py-1.5 flex gap-2 items-baseline">
                    <span class="text-xs text-muted-foreground shrink-0">Update {index() + 1}</span>
                    <p class="text-sm">{entry}</p>
                  </div>
                )}
              </For>
            </ScrollArea>
          </div>
        )}
      </For>
    </div>
  )
}
