import { FileUpload } from '@src'
import { For } from 'solid-js'

export function SelectingFiles() {
  return (
    <div class="flex flex-col gap-6 max-w-md w-full">
      <For each={['sm', 'md', 'lg'] as const}>
        {(size) => (
          <div class="flex flex-col gap-2">
            <span class="text-xs text-muted-foreground font-medium">{size}</span>
            <FileUpload
              size={size}
              multiple
              label="Drag & drop files here"
              description="Or click to browse documents and images."
            />
          </div>
        )}
      </For>
    </div>
  )
}
