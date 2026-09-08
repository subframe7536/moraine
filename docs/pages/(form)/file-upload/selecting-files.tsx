import { FileUpload } from '@src'

export function SelectingFiles() {
  return (
    <div class="max-w-md w-full space-y-3">
      <FileUpload
        label="Project assets"
        description="Drag and drop documents or click to browse."
      />
    </div>
  )
}
