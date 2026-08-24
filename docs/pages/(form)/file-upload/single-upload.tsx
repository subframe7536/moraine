import { FileUpload } from '@src'
import type { FileUploadT } from '@src'
import { createSignal, Show } from 'solid-js'

export function SingleUpload() {
  type FileUploadValue = FileUploadT.Value

  const [avatar, setAvatar] = createSignal<FileUploadValue>(null)

  const fileName = () => {
    const file = avatar()
    if (!file) {
      return null
    }
    return Array.isArray(file) ? file[0]?.name : file.name
  }

  const fileSize = () => {
    const file = avatar()
    if (!file) {
      return null
    }
    const bytes = Array.isArray(file) ? (file[0]?.size ?? 0) : file.size
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <div class="p-4 b-(1 border) rounded-xl max-w-xl space-y-4">
      <FileUpload
        label="Profile picture"
        description="Upload a high-resolution avatar. PNG, JPG, or WebP up to 5MB."
        accept="image/png,image/jpeg,image/webp"
        onValueChange={setAvatar}
      />
      <Show when={fileName()}>
        <div class="text-xs p-3 rounded-lg bg-muted/40 flex items-center justify-between">
          <span class="font-medium max-w-xs truncate">{fileName()}</span>
          <span class="text-muted-foreground font-mono">{fileSize()}</span>
        </div>
      </Show>
    </div>
  )
}
