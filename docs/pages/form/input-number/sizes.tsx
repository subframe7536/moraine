import { InputNumber } from '@src'
import type { InputNumberT } from '@src'
import { For } from 'solid-js'

type InputNumberSize = Exclude<InputNumberT.Variant['size'], undefined>

export function Sizes() {
  const SIZES: InputNumberSize[] = ['xs', 'sm', 'md', 'lg', 'xl']

  return (
    <div class="max-w-md space-y-3">
      <For each={SIZES}>
        {(size) => (
          <div class="space-y-1">
            <p class="text-xs text-muted-foreground font-mono">{size}</p>
            <InputNumber size={size} defaultValue={3} />
          </div>
        )}
      </For>
    </div>
  )
}
