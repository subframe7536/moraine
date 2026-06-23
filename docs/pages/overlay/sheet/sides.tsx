import { Button, Sheet } from '@src'
import { For } from 'solid-js'

export function Sides() {
  const SIDES = ['left', 'right', 'top', 'bottom'] as const

  return (
    <div class="flex flex-wrap gap-3 items-center">
      <For each={SIDES}>
        {(side) => (
          <Sheet
            side={side}
            title={`Sheet ${side}`}
            description={`This sheet opens from ${side}.`}
            body={<p class="text-sm text-foreground">Body content from {side} side.</p>}
          >
            <Button variant="outline" size="sm">
              {side}
            </Button>
          </Sheet>
        )}
      </For>
    </div>
  )
}
