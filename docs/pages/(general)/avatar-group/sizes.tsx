import { AvatarGroup } from '@src'
import type { AvatarGroupT } from '@src'
import { For } from 'solid-js'

type AvatarGroupSize = Exclude<AvatarGroupT.Variant['size'], undefined>

export function Sizes() {
  const SIZES: AvatarGroupSize[] = ['sm', 'md', 'lg']

  return (
    <div class="flex flex-wrap gap-4 items-end">
      <For each={SIZES}>
        {(size) => (
          <div class="flex flex-col gap-2 items-center">
            <AvatarGroup
              size={size}
              max={2}
              items={[{ text: 'A' }, { text: 'B' }, { text: 'C' }]}
            />
            <span class="text-xs text-muted-foreground font-mono">{size}</span>
          </div>
        )}
      </For>
    </div>
  )
}
