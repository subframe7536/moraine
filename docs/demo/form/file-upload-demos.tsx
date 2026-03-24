import { createSignal } from 'solid-js'

import { Button, FileUpload, Form, FormField } from '../../../src'
import type { FileUploadT } from '../../../src'
import { DemoPage } from '../../components/demo-page'
import { DemoSection } from '../../components/demo-section'

function SingleUpload() {
  function fileNames(value: FileUploadValue): string {
    if (value === null) {
      return 'none'
    }

    if (Array.isArray(value)) {
      return value.length > 0 ? value.map((file) => file.name).join(', ') : 'none'
    }

    return value.name
  }

  const [singleValue, setSingleValue] = createSignal<FileUploadValue>(null)

  type FileUploadValue = FileUploadT.Value

  return (
    <div class="max-w-xl space-y-3">
      <FileUpload
        label="Upload one file"
        description="PNG, JPG, PDF up to your browser limit."
        accept="image/*,.pdf"
        onValueChange={setSingleValue}
      />
      <p class="text-xs text-muted-foreground">Selected file: {fileNames(singleValue())}</p>
    </div>
  )
}

function MultipleMaxFiles() {
  function fileCount(value: FileUploadValue): number {
    if (value === null) {
      return 0
    }

    if (Array.isArray(value)) {
      return value.length
    }

    return 1
  }

  function fileNames(value: FileUploadValue): string {
    if (value === null) {
      return 'none'
    }

    if (Array.isArray(value)) {
      return value.length > 0 ? value.map((file) => file.name).join(', ') : 'none'
    }

    return value.name
  }

  const [multiValue, setMultiValue] = createSignal<FileUploadValue>([])

  const [rejectedCount, setRejectedCount] = createSignal(0)

  type FileUploadValue = FileUploadT.Value

  return (
    <div class="max-w-xl space-y-3">
      <FileUpload
        multiple
        maxFiles={3}
        accept="image/*,.pdf"
        label="Upload up to 3 files"
        description="Drop or select multiple files."
        onValueChange={setMultiValue}
        onFileReject={(files) => setRejectedCount(files.length)}
        highlight
      />
      <p class="text-xs text-muted-foreground">Selected count: {fileCount(multiValue())}</p>
      <p class="text-xs text-muted-foreground">Selected names: {fileNames(multiValue())}</p>
      <p class="text-xs text-muted-foreground">Last reject batch size: {rejectedCount()}</p>
    </div>
  )
}

function TriggerModeNoDropzone() {
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

function FormIntegration() {
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

export default () => {
  return (
    <DemoPage componentKey="file-upload">
      <DemoSection
        title="Single Upload"
        description="Basic single-file mode with a live readout from onValueChange."
        demo={SingleUpload}
      />

      <DemoSection
        title="Multiple + Max Files"
        description="Append files across selections, reject overflow, and show selected names."
        demo={MultipleMaxFiles}
      />

      <DemoSection
        title="Trigger Mode (No Dropzone)"
        description="Use button-style trigger behavior by disabling dropzone interaction."
        demo={TriggerModeNoDropzone}
      />

      <DemoSection
        title="Form Integration"
        description="Submit to validate a required attachment with Form + FormField."
        demo={FormIntegration}
      />
    </DemoPage>
  )
}
