import { Icon } from '@src'
import { Button } from '@src/elements/button/button.tsx'
import type { ButtonT } from '@src/elements/button/button.tsx'
import { For } from 'solid-js'

export function IconButtons() {
  const ICON_SIZES: NonNullable<ButtonT.Variant['size']>[] = ['icon-sm', 'icon-md', 'icon-lg']

  return (
    <div class="flex flex-wrap gap-4 items-center">
      <For each={ICON_SIZES}>
        {(size) => (
          <div class="flex gap-1.5 items-center">
            <Button size={size} variant="outline" aria-label={`Decrease, ${size} button`}>
              <Icon name="i-lucide:minus" />
            </Button>
            <Button size={size} variant="outline" aria-label={`Increase, ${size} button`}>
              <Icon name="i-lucide:plus" />
            </Button>
          </div>
        )}
      </For>
    </div>
  )
}
