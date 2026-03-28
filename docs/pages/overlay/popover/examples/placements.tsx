import { Button, Popover } from '@src'
import { For } from 'solid-js'

export function Placements() {
  const PLACEMENTS = ['top', 'right', 'bottom', 'left'] as const

  return (
    <div class="flex flex-wrap gap-3 items-center">
      <For each={PLACEMENTS}>
        {(placement) => (
          <Popover
            placement={placement}
            content={
              <div class="space-y-1">
                <p class="text-sm font-medium capitalize">{placement}</p>
                <p class="text-xs text-muted-foreground">Popover content aligned to {placement}.</p>
              </div>
            }
          >
            <Button variant="outline" size="sm">
              {placement}
            </Button>
          </Popover>
        )}
      </For>
    </div>
  )
}
