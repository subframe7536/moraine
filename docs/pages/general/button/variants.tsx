import { Button } from '@src/elements/button/button'
import type { ButtonT } from '@src/elements/button/button'
import { For } from 'solid-js'

export function Variants() {
  const VARIANTS: ButtonT.Variant['variant'][] = [
    'default',
    'secondary',
    'outline',
    'ghost',
    'link',
    'destructive',
  ]

  return (
    <div class="flex flex-wrap gap-3">
      <For each={VARIANTS}>{(variant) => <Button variant={variant}>{variant}</Button>}</For>
    </div>
  )
}
