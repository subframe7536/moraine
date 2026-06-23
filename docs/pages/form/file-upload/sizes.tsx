import { FileUpload } from '@src'
import type { FileUploadT } from '@src'
import { For } from 'solid-js'

type FileUploadSize = Exclude<FileUploadT.Variant['size'], undefined>

export function Sizes() {
  const SIZES: FileUploadSize[] = ['xs', 'sm', 'md', 'lg', 'xl']

  return (
    <div class="max-w-xl space-y-3">
      <For each={SIZES}>
        {(size) => (
          <FileUpload
            size={size}
            dropzone={false}
            preview={false}
            label={`Upload (${size})`}
            description="Click to choose files."
          />
        )}
      </For>
    </div>
  )
}
