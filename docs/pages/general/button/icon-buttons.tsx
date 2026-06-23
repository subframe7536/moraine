import { Icon } from '@src'
import { Button } from '@src/elements/button/button'
import type { ButtonT } from '@src/elements/button/button'
import { For } from 'solid-js'

export function IconButtons() {
  const ICON_SIZES: NonNullable<ButtonT.Variant['size']>[] = [
    'icon-xs',
    'icon-sm',
    'icon-md',
    'icon-lg',
    'icon-xl',
  ]

  return (
    <div class="flex flex-wrap gap-3 items-center">
      <For each={ICON_SIZES}>
        {(size) => (
          <Button size={size} variant="secondary" aria-label={`Icon ${size}`}>
            <Icon name="i-lucide:star" />
          </Button>
        )}
      </For>
      <Button
        variant="outline"
        leading={<div class="i-lucide:arrow-left" />}
        trailing={<div class="i-lucide:arrow-right" />}
      >
        Leading + trailing
      </Button>
    </div>
  )
}
