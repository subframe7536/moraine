import { FileUpload } from '@src'

export function FormBehavior() {
  return (
    <div class="max-w-md w-full space-y-4">
      <FileUpload
        disabled
        label="Disabled upload"
        description="Upload is locked during maintenance."
      />
      <FileUpload
        readOnly
        label="Read-only upload"
        description="View existing attachments without making modifications."
      />
    </div>
  )
}
