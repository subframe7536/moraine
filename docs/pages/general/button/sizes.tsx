import { Button } from '@src/elements/button/button'
import type { ButtonT } from '@src/elements/button/button'
import { For } from 'solid-js'

export function Sizes() {
  const SIZES: ButtonT.Variant['size'][] = ['xs', 'sm', 'md', 'lg', 'xl']

  return (
    <div class="flex flex-wrap gap-3 items-center">
      <For each={SIZES}>
        {(size) => (
          <Button size={size} variant="outline" leading="i-lucide:square">
            {size}
          </Button>
        )}
      </For>
    </div>
  )
}
