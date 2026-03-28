import { Separator } from '@src'
import { For } from 'solid-js'

export function Sizes() {
  const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const

  return (
    <div class="w-xl space-y-4">
      <For each={SIZES}>
        {(size) => (
          <div class="space-y-2">
            <p class="text-xs text-muted-foreground tracking-wider uppercase">{size}</p>
            <Separator size={size} />
          </div>
        )}
      </For>
    </div>
  )
}
