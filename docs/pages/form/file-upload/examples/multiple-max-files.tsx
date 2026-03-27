import { FileUpload } from '@src'
import type { FileUploadT } from '@src'
import { createSignal } from 'solid-js'

export function MultipleMaxFiles() {
  function fileCount(value: FileUploadValue): number {
    if (value === null) {
      return 0
    }

    if (Array.isArray(value)) {
      return value.length
    }

    return 1
  }

  function fileNames(value: FileUploadValue): string {
    if (value === null) {
      return 'none'
    }

    if (Array.isArray(value)) {
      return value.length > 0 ? value.map((file) => file.name).join(', ') : 'none'
    }

    return value.name
  }

  const [multiValue, setMultiValue] = createSignal<FileUploadValue>([])

  const [rejectedCount, setRejectedCount] = createSignal(0)

  type FileUploadValue = FileUploadT.Value

  return (
    <div class="max-w-xl space-y-3">
      <FileUpload
        multiple
        maxFiles={3}
        accept="image/*,.pdf"
        label="Upload up to 3 files"
        description="Drop or select multiple files."
        onValueChange={setMultiValue}
        onFileReject={(files) => setRejectedCount(files.length)}
      />
      <p class="text-xs text-muted-foreground">Selected count: {fileCount(multiValue())}</p>
      <p class="text-xs text-muted-foreground">Selected names: {fileNames(multiValue())}</p>
      <p class="text-xs text-muted-foreground">Last reject batch size: {rejectedCount()}</p>
    </div>
  )
}
