import { Badge } from '@src'
import type { BadgeT } from '@src'
import { For } from 'solid-js'

export function Variants() {
  const VARIANTS: BadgeVariantName[] = ['default', 'outline', 'solid']

  type BadgeVariantName = Exclude<BadgeT.Variant['variant'], undefined>

  return (
    <div class="flex flex-wrap gap-3 items-center">
      <For each={VARIANTS}>{(variant) => <Badge variant={variant}>{variant}</Badge>}</For>
    </div>
  )
}
