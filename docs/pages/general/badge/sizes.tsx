import { Badge } from '@src'
import type { BadgeT } from '@src'
import { For } from 'solid-js'

export function Sizes() {
  const SIZES: BadgeSizeName[] = ['xs', 'sm', 'md', 'lg', 'xl']

  type BadgeSizeName = Exclude<BadgeT.Variant['size'], undefined>

  return (
    <div class="font-mono flex flex-wrap gap-3 items-center">
      <For each={SIZES}>
        {(size) => (
          <Badge size={size} variant="outline">
            {size}
          </Badge>
        )}
      </For>
    </div>
  )
}
