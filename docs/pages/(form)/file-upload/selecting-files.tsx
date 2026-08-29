import { FileUpload } from '@src'
import { createSignal } from 'solid-js'

export function SelectingFiles() {
  const [files, setFiles] = createSignal<File | File[] | null>(null)

  return (
    <div class="max-w-md w-full space-y-3">
      <FileUpload
        label="Project assets"
        description="Drag and drop documents or click to browse."
        value={files()}
        onValueChange={setFiles}
      />
    </div>
  )
}
