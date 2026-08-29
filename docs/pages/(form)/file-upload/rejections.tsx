import { FileUpload } from '@src'
import { For, createSignal } from 'solid-js'

const REJECTION_LABELS = {
  FILE_DUPLICATE: 'already selected',
  FILE_INVALID_TYPE: 'type is not accepted',
  FILE_TOO_LARGE: 'is larger than 1 MB',
  FILE_TOO_MANY_FILES: 'exceeds the file limit',
  FILE_TOO_SMALL: 'is smaller than the minimum size',
  TOO_MANY_FILES: 'exceeds the file limit',
} as const

export function Rejections() {
  const [rejections, setRejections] = createSignal<{ name: string; reason: string }[]>([])

  return (
    <div class="max-w-lg space-y-3">
      <FileUpload
        multiple
        accept="image/png,image/jpeg"
        maxFiles={2}
        maxSize={1024 * 1024}
        label="Upload images"
        description="PNG or JPEG, up to 1 MB each (maximum two files)"
        onFileReject={(files) =>
          setRejections(
            files.map(({ file, errors }) => ({
              name: file.name,
              reason: errors.map((error) => REJECTION_LABELS[error]).join(', '),
            })),
          )
        }
      />

      <For each={rejections()}>
        {(rejection) => (
          <p class="text-sm text-destructive">
            {rejection.name}: {rejection.reason}
          </p>
        )}
      </For>
    </div>
  )
}
