import { Icon } from '@src'
import { For } from 'solid-js'

export function IconSizes() {
  const ICON_SIZES = [12, 16, 20, 24, 32, 48]

  return (
    <div class="flex flex-wrap gap-6 items-end">
      <For each={ICON_SIZES}>
        {(size) => (
          <div class="flex flex-col gap-1 items-center">
            <Icon name="i-lucide-star" size={size} />
            <span class="text-[10px] text-muted-foreground">{size}px</span>
          </div>
        )}
      </For>
    </div>
  )
}
