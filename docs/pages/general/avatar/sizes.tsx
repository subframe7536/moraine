import { Avatar } from '@src'
import type { AvatarT } from '@src'
import { For } from 'solid-js'

type AvatarSize = Exclude<AvatarT.Variant['size'], undefined>

export function Sizes() {
  const SIZES: AvatarSize[] = ['xs', 'sm', 'md', 'lg', 'xl']

  return (
    <div class="flex flex-wrap gap-4 items-end">
      <For each={SIZES}>
        {(size) => (
          <div class="flex flex-col gap-2 items-center">
            <Avatar size={size} items={[{ text: 'MR' }]} />
            <span class="text-xs text-muted-foreground font-mono">{size}</span>
          </div>
        )}
      </For>
    </div>
  )
}
