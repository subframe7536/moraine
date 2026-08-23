import { Input } from '@src'
import { For } from 'solid-js'

export function InputVariants() {
  const VARIANTS = ['outline', 'subtle', 'ghost', 'none'] as const

  return (
    <div class="gap-3 grid lg:grid-cols-3 sm:grid-cols-2">
      <For each={VARIANTS}>{(variant) => <Input variant={variant} placeholder={variant} />}</For>
    </div>
  )
}
