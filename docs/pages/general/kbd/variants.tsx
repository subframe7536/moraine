import { Kbd } from '@src'
import { For } from 'solid-js'

export function Variants() {
  const VARIANTS = ['outline', 'default', 'invert'] as const

  return (
    <div class="flex flex-wrap gap-3 items-center">
      <For each={VARIANTS}>{(variant) => <Kbd variant={variant} value={[variant]} />}</For>
    </div>
  )
}
