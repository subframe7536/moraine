import { ScrollArea } from '@src'
import { For } from 'solid-js'

const milestones = ['Planning', 'Design', 'Prototype', 'Implementation', 'Review', 'Release']

export function Horizontal() {
  return (
    <div class="w-full space-y-6">
      <For each={['ltr', 'rtl'] as const}>
        {(direction) => (
          <div class="max-w-lg w-full space-y-3">
            <p class="text-sm font-medium">
              {direction === 'ltr' ? 'Left to right' : 'Right to left'}
            </p>
            <ScrollArea
              orientation="horizontal"
              shadow
              hideScrollbar
              dir={direction}
              role="region"
              aria-label={`${direction.toUpperCase()} project milestones`}
            >
              <div class="pb-2 flex gap-3">
                <For each={milestones}>
                  {(milestone, index) => (
                    <div class="py-1.5 ps-3 border-s border-border shrink-0 w-32">
                      <p class="text-xs text-muted-foreground">Step {index() + 1}</p>
                      <p class="text-sm font-medium mt-1">{milestone}</p>
                    </div>
                  )}
                </For>
              </div>
            </ScrollArea>
          </div>
        )}
      </For>
    </div>
  )
}
