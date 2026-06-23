import { Separator } from '@src'
import { For } from 'solid-js'

export function Types() {
  const TYPES = ['solid', 'dashed', 'dotted'] as const

  return (
    <div class="w-xl space-y-4">
      <For each={TYPES}>
        {(type) => (
          <div class="space-y-2">
            <p class="text-xs text-muted-foreground tracking-wider uppercase">{type}</p>
            <Separator type={type} />
          </div>
        )}
      </For>
    </div>
  )
}
