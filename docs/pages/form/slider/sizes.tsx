import { Slider } from '@src'
import { For } from 'solid-js'

export function Sizes() {
  const SIZES = ['xs', 'sm', 'md', 'lg', 'xl'] as const

  return (
    <div class="w-lg space-y-4">
      <For each={SIZES}>
        {(size) => (
          <div class="space-y-2">
            <label class="text-xs text-muted-foreground block uppercase">{size}</label>
            <Slider size={size} defaultValue={35} />
          </div>
        )}
      </For>
    </div>
  )
}
