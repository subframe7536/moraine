import { FileUpload } from '@src'
import type { FileUploadT } from '@src'
import { createSignal } from 'solid-js'

export function SingleUpload() {
  type FileUploadValue = FileUploadT.Value

  function fileNames(value: FileUploadValue): string {
    if (value === null) {
      return 'none'
    }

    if (Array.isArray(value)) {
      return value.length > 0 ? value.map((file) => file.name).join(', ') : 'none'
    }

    return value.name
  }

  const [singleValue, setSingleValue] = createSignal<FileUploadValue>(null)

  return (
    <div class="max-w-xl space-y-3">
      <FileUpload
        label="Upload one file"
        description="PNG, JPG, PDF up to your browser limit."
        accept="image/*,.pdf"
        onValueChange={setSingleValue}
      />
      <p class="text-xs text-muted-foreground">Selected file: {fileNames(singleValue())}</p>
    </div>
  )
}
