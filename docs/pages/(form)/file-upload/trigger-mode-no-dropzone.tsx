import { FileUpload } from '@src'
import type { FileUploadT } from '@src'
import { createSignal, Show } from 'solid-js'

export function TriggerModeNoDropzone() {
  const [attached, setAttached] = createSignal<FileUploadT.Value>(null)

  const fileName = () => {
    const file = attached()
    if (!file) {
      return null
    }
    return Array.isArray(file) ? file[0]?.name : file.name
  }

  return (
    <div class="p-4 b-(1 border) rounded-xl max-w-md space-y-3">
      <FileUpload
        dropzone={false}
        label="Attach receipts or invoices"
        description="Click the button to select a file directly from your computer."
        onValueChange={setAttached}
      />

      <Show when={fileName()}>
        <div class="text-xs text-muted-foreground px-3 py-2 rounded-lg bg-muted/40 flex gap-2 items-center">
          <span class="i-lucide:paperclip text-primary" />
          <span>Selected: {fileName()}</span>
        </div>
      </Show>
    </div>
  )
}
