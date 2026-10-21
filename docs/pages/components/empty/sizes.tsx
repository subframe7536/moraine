import { Empty, Icon } from '@src'
import { For } from 'solid-js'

export function Sizes() {
  return (
    <div class="w-full divide-border divide-y">
      <For each={['sm', 'md', 'lg'] as const}>
        {(size) => (
          <Empty size={size}>
            <Empty.Media>
              <Icon name="i-lucide-files" class="text-muted-foreground size-6" />
            </Empty.Media>
            <Empty.Title>No files ({size})</Empty.Title>
            <Empty.Description>Uploaded files will appear here.</Empty.Description>
          </Empty>
        )}
      </For>
    </div>
  )
}
