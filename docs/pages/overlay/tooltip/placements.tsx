import { Button, Tooltip } from '@src'
import { For } from 'solid-js'

export function Placements() {
  const PLACEMENTS = ['top', 'right', 'bottom', 'left'] as const

  return (
    <div class="flex flex-wrap gap-4 items-center">
      <For each={PLACEMENTS}>
        {(placement) => (
          <Tooltip text={`Tooltip on ${placement}`} placement={placement}>
            <Button variant="outline">{placement}</Button>
          </Tooltip>
        )}
      </For>
    </div>
  )
}
