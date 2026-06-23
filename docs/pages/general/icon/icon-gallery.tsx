import { Icon } from '@src'
import { For } from 'solid-js'

export function IconGallery() {
  const ICON_NAMES = [
    'i-lucide-search',
    'i-lucide-home',
    'i-lucide-settings',
    'i-lucide-user',
    'i-lucide-star',
    'i-lucide-heart',
    'i-lucide-bell',
    'i-lucide-mail',
    'i-lucide-calendar',
    'i-lucide-folder',
    'i-lucide-file',
    'i-lucide-trash',
  ]

  return (
    <div class="gap-4 grid grid-cols-4 sm:grid-cols-6">
      <For each={ICON_NAMES}>
        {(name) => (
          <div class="p-3 b-1 b-border border-border rounded-lg flex flex-col gap-2 items-center">
            <Icon name={name} size={24} />
            <span class="text-[10px] text-muted-foreground truncate">
              {name.replace('i-lucide-', '')}
            </span>
          </div>
        )}
      </For>
    </div>
  )
}
