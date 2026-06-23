import { InputNumber } from '@src'
import { For } from 'solid-js'

export function Variants() {
  const VARIANTS = ['outline', 'subtle', 'ghost', 'none'] as const

  return (
    <div class="flex flex-wrap gap-6 items-start">
      <For each={VARIANTS}>
        {(variant) => (
          <div class="space-y-1">
            <label class="text-xs text-muted-foreground block">{variant}</label>
            <InputNumber variant={variant} defaultValue={3} />
          </div>
        )}
      </For>
    </div>
  )
}
