import { Icon } from '@src'
import { DEFAULT_ICON_SHORTCUTS } from '@src/theme/style/icons'
import { For } from 'solid-js'

export function IconGallery() {
  return (
    <div class="p-4 gap-3 grid grid-cols-2 lg:grid-cols-4 sm:grid-cols-3">
      <For each={DEFAULT_ICON_SHORTCUTS}>
        {([name]) => (
          <div class="p-3 border border-border rounded-lg flex flex-col gap-2 min-w-0 items-center justify-center">
            <Icon name={name} size={24} />
            <code class="text-xs text-muted-foreground text-center break-all">{name}</code>
          </div>
        )}
      </For>
    </div>
  )
}
