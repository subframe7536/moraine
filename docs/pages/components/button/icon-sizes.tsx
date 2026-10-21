import { Button } from '@src'
import { For } from 'solid-js'

const SIZES = ['icon-xs', 'icon-sm', 'icon-md', 'icon-lg', 'icon-xl'] as const

export function IconSizes() {
  return (
    <div class="flex flex-wrap gap-3 items-center">
      <For each={SIZES}>
        {(size) => (
          <Button variant="outline" size={size} leading="i-lucide:plus" aria-label={size} />
        )}
      </For>
    </div>
  )
}
