import { FileUpload } from '@src'

export function TriggerModeNoDropzone() {
  return (
    <div class="max-w-xl">
      <FileUpload
        dropzone={false}
        label="Select file"
        description="Click to choose files."
        preview={false}
      />
    </div>
  )
}
