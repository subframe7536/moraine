import { FileUpload } from '@src'
import type { FileUploadT } from '@src'

export interface FileUploadPlaygroundProps {
  size?: FileUploadT.Variant['size']
  disabled?: boolean
  dropzone?: boolean
}

export function FileUploadPlayground(props: FileUploadPlaygroundProps) {
  return (
    <div class="max-w-full w-80">
      <FileUpload
        label="Upload documents"
        description="Drag & drop PDF, PNG, or JPG up to 10MB"
        size={props.size ?? 'md'}
        disabled={props.disabled ?? false}
        dropzone={props.dropzone ?? true}
      />
    </div>
  )
}
