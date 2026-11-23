import { FileUpload } from '@src'
import type { FileUploadT } from '@src'
import { For, createSignal } from 'solid-js'
const REJECTION_LABELS: Record<FileUploadT.Reason, string> = {
  duplicate: 'already selected',
  typeMismatch: 'type is not accepted',
  rangeOverflow: 'is larger than 1 MB',
  rangeUnderflow: 'is smaller than the minimum size',
  tooLong: 'exceeds the file limit',
}

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
        onValueInvalid={({ rejections }) =>
          setRejections(
            rejections.map(({ file, reasons }) => ({
              name: file.name,
              reason: reasons.map((reason) => REJECTION_LABELS[reason]).join(', '),
            })),
          )
        }
      />

      <For each={rejections()}>
        {(rejection) => (
          <p class="text-sm text-danger">
            {rejection.name}: {rejection.reason}
          </p>
        )}
      </For>
    </div>
  )
}
