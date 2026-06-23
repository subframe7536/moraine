import { Textarea } from '@src'
import type { TextareaT } from '@src'
import { For } from 'solid-js'

export function Variants() {
  const VARIANTS: TextareaVariantName[] = ['outline', 'subtle', 'ghost', 'none']

  type TextareaVariantName = Exclude<TextareaT.Variant['variant'], undefined>

  return (
    <div class="gap-3 grid lg:grid-cols-4 sm:grid-cols-2">
      <For each={VARIANTS}>
        {(variant) => <Textarea variant={variant} placeholder={`Variant: ${variant}`} rows={2} />}
      </For>
    </div>
  )
}
