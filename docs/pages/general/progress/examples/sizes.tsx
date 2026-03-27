import { Progress } from '@src'
import type { ProgressT } from '@src'
import { For } from 'solid-js'

type ProgressSize = Exclude<ProgressT.Variant['size'], undefined>

export function Sizes() {
  const SIZES: ProgressSize[] = ['xs', 'sm', 'md', 'lg', 'xl']

  return (
    <div class="w-xl space-y-3">
      <For each={SIZES}>
        {(size) => (
          <div class="flex gap-3 items-center">
            <span class="text-xs text-muted-foreground font-mono w-8">{size}</span>
            <div class="flex-1">
              <Progress value={56} size={size} />
            </div>
          </div>
        )}
      </For>
    </div>
  )
}
