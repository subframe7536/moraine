import { Badge, FileUpload } from '@src'
import type { FileUploadT } from '@src'
import { createSignal, For, Show } from 'solid-js'

export function MultipleMaxFiles() {
  type FileUploadValue = FileUploadT.Value

  const [receipts, setReceipts] = createSignal<FileUploadValue>([])
  const [rejectWarning, setRejectWarning] = createSignal<string | null>(null)

  const filesList = () => {
    const val = receipts()
    if (!val) {
      return []
    }
    return Array.isArray(val) ? val : [val]
  }

  return (
    <div class="p-4 b-(1 border) rounded-xl max-w-xl space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h4 class="text-sm font-medium">Expense receipts</h4>
          <p class="text-xs text-muted-foreground">
            Upload up to 3 receipt images or PDF documents.
          </p>
        </div>
        <Badge variant="outline">Max 3 files</Badge>
      </div>

      <FileUpload
        multiple
        maxFiles={3}
        accept="image/*,.pdf"
        label="Drop receipts here"
        description="PDF, PNG, JPG up to 10MB each"
        onValueChange={(val) => {
          setReceipts(val)
          setRejectWarning(null)
        }}
        onFileReject={(rejected) => {
          setRejectWarning(
            `Rejected ${rejected.length} file(s) exceeding the 3 file limit or invalid format.`,
          )
        }}
      />

      <Show when={rejectWarning()}>
        <p class="text-xs text-destructive">{rejectWarning()}</p>
      </Show>

      <Show when={filesList().length > 0}>
        <div class="pt-2 border-t border-border space-y-2">
          <p class="text-xs text-muted-foreground font-medium">
            Attached files ({filesList().length}/3):
          </p>
          <div class="space-y-1">
            <For each={filesList()}>
              {(file) => (
                <div class="text-xs p-2 rounded-lg bg-muted/40 flex items-center justify-between">
                  <span class="font-medium truncate">{file.name}</span>
                  <span class="text-muted-foreground font-mono">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>
    </div>
  )
}
