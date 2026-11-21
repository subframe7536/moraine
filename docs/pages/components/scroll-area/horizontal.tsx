import { ScrollArea } from '@src'
import { For } from 'solid-js'

const milestones = ['Planning', 'Design', 'Prototype', 'Implementation', 'Review', 'Release']

export function Horizontal() {
  return (
    <ScrollArea
      orientation="horizontal"
      fade
      class="max-w-lg w-full"
      classes={{ content: 'pb-3 flex gap-3' }}
      role="region"
      aria-label="Project milestones"
    >
      <For each={milestones}>
        {(milestone, index) => (
          <div class="py-1.5 ps-3 border-s border-border shrink-0 w-32">
            <p class="text-xs text-muted-foreground">Step {index() + 1}</p>
            <p class="text-sm font-medium mt-1">{milestone}</p>
          </div>
        )}
      </For>
    </ScrollArea>
  )
}
