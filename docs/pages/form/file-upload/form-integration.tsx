import { Button, FileUpload, Form, FormField } from '@src'
import type { FileUploadT } from '@src'
import { createSignal } from 'solid-js'

export function FormIntegration() {
  const [formState, setFormState] = createSignal({
    attachment: null as File | null,
  })

  const updateFormAttachment = (value: FileUploadValue) => {
    const next = Array.isArray(value) ? (value[0] ?? null) : value
    setFormState((prev) => ({ ...prev, attachment: next }))
  }

  type FileUploadValue = FileUploadT.Value

  return (
    <Form
      state={formState()}
      validate={(state) => {
        if (!state?.attachment) {
          return [{ name: 'attachment', message: 'Please upload one attachment.' }]
        }

        return []
      }}
    >
      <div class="max-w-xl space-y-4">
        <FormField
          name="attachment"
          label="Attachment"
          description="Upload at least one file before submit."
          required
        >
          <FileUpload id="demo-attachment-upload" onValueChange={updateFormAttachment} />
        </FormField>
        <div class="flex gap-3 items-center">
          <Button type="submit" variant="secondary" size="sm">
            Validate
          </Button>
          <p class="text-xs text-muted-foreground">
            Current attachment: {formState().attachment?.name ?? 'none'}
          </p>
        </div>
      </div>
    </Form>
  )
}
