import type { JSX, ValidComponent } from 'solid-js'
import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  onCleanup,
  splitProps,
} from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Icon } from '../../elements/icon/index.ts'
import { HiddenInput } from '../../shared/hidden-input.tsx'
import { resolveComponentStyle, useMoraineDesign } from '../../shared/provider/index.ts'
import { callHandler, callRef, useId } from '../../shared/utils.ts'
import { useFormField } from '../form/form-context.ts'
import { useFormReset } from '../shared/use-form-reset.ts'

import type { FileUploadProps, FileUploadT } from './file-upload.types.ts'

export * from './file-upload.types.ts'

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

function isAcceptedFileType(file: File, accept?: string): boolean {
  if (!accept || accept === '*') {
    return true
  }

  const rules = accept
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)

  if (rules.length === 0) {
    return true
  }

  const fileName = file.name.toLowerCase()
  const fileType = file.type.toLowerCase()
  const baseType = fileType.split('/')[0] ?? ''

  return rules.some((rule) => {
    if (rule === '*') {
      return true
    }

    if (rule.startsWith('.')) {
      return fileName.endsWith(rule)
    }

    if (rule.endsWith('/*')) {
      return baseType === rule.split('/')[0]
    }

    return fileType === rule
  })
}

function createObjectUrl(file: File): string | undefined {
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return undefined
  }

  return URL.createObjectURL(file)
}

function revokeObjectUrl(url: string): void {
  if (typeof URL === 'undefined' || typeof URL.revokeObjectURL !== 'function') {
    return
  }

  URL.revokeObjectURL(url)
}

function isFileDragEvent(event: DragEvent): boolean {
  if (!event.dataTransfer) {
    return Boolean(event.target && 'files' in event.target)
  }

  return Array.from(event.dataTransfer.types).some(
    (type) => type === 'Files' || type === 'application/x-moz-file',
  )
}

function createFileList(files: File[]): FileList | undefined {
  if (typeof DataTransfer === 'undefined') {
    return undefined
  }

  try {
    const transfer = new DataTransfer()

    for (const file of files) {
      transfer.items.add(file)
    }

    return transfer.files
  } catch {
    return undefined
  }
}

function syncNativeInputFiles(input: HTMLInputElement | undefined, files: File[]): boolean {
  if (!input) {
    return false
  }

  const fileList = createFileList(files)
  if (fileList) {
    try {
      input.files = fileList
      const assignedFiles = Array.from(input.files ?? [])

      return (
        assignedFiles.length === files.length &&
        assignedFiles.every((file, index) => file === files[index])
      )
    } catch {
      // Some browsers reject FileList assignment; preserve the component state and leave the native input unchanged.
    }
  }

  if (files.length === 0) {
    input.value = ''
    return true
  }

  return false
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return '0B'
  }

  const unit = 1024
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const power = Math.floor(Math.log(bytes) / Math.log(unit))
  const value = bytes / unit ** power
  const precision = power === 0 ? 0 : 1

  return `${value.toFixed(precision)}${units[power]}`
}

function createRejection(file: File, error: FileUploadT.Error): FileUploadT.Rejection {
  return {
    file,
    errors: [error],
  }
}

function getFileIdentity(file: File): string {
  return [file.name, file.size, file.type, file.lastModified].join('\0')
}

function filterAcceptedFiles(
  files: File[],
  options: {
    accept: string | undefined
    existingFiles: File[]
    minSize: number | undefined
    maxSize: number | undefined
  },
): {
  accepted: File[]
  rejected: FileUploadT.Rejection[]
} {
  const accepted: File[] = []
  const rejected: FileUploadT.Rejection[] = []
  const seenFiles = new Set(options.existingFiles.map(getFileIdentity))

  for (const file of files) {
    const errors: FileUploadT.Error[] = []

    if (!isAcceptedFileType(file, options.accept)) {
      errors.push('FILE_INVALID_TYPE')
    }

    if (options.minSize !== undefined && file.size < options.minSize) {
      errors.push('FILE_TOO_SMALL')
    } else if (options.maxSize !== undefined && file.size > options.maxSize) {
      errors.push('FILE_TOO_LARGE')
    }

    if (errors.length > 0) {
      rejected.push({ file, errors })
      continue
    }

    const fileIdentity = getFileIdentity(file)
    if (seenFiles.has(fileIdentity)) {
      rejected.push(createRejection(file, 'FILE_DUPLICATE'))
      continue
    }

    seenFiles.add(fileIdentity)
    accepted.push(file)
  }

  return { accepted, rejected }
}

function constrainMultipleFiles(
  accepted: File[],
  currentCount: number,
  maxFiles: number,
): {
  accepted: File[]
  rejected: FileUploadT.Rejection[]
} {
  const rejected: FileUploadT.Rejection[] = []
  const remainingSlots = Number.isFinite(maxFiles)
    ? Math.max(0, maxFiles - currentCount)
    : Number.POSITIVE_INFINITY

  if (remainingSlots === 0) {
    for (const file of accepted) {
      rejected.push(createRejection(file, 'TOO_MANY_FILES'))
    }

    return { accepted: [], rejected }
  }

  if (!Number.isFinite(remainingSlots) || accepted.length <= remainingSlots) {
    return { accepted, rejected }
  }

  const boundedAccepted = accepted.slice(0, remainingSlots)
  const overflow = accepted.slice(remainingSlots)

  for (const file of overflow) {
    rejected.push(createRejection(file, 'TOO_MANY_FILES'))
  }

  return { accepted: boundedAccepted, rejected }
}

function constrainSingleFile(accepted: File[]): {
  accepted: File[]
  rejected: FileUploadT.Rejection[]
} {
  if (accepted.length <= 1) {
    return { accepted, rejected: [] }
  }

  const rejected = accepted.slice(1).map((file) => createRejection(file, 'TOO_MANY_FILES'))

  return { accepted: [accepted[0]!], rejected }
}

/** Drag-and-drop file upload component with progress tracking and file list management. */
export function FileUpload<T extends ValidComponent = 'div'>(
  props: FileUploadProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props, [
    'as',
    'id',
    'name',
    'required',
    'disabled',
    'readOnly',
    'inputRef',
    'onClick',
    'onKeyDown',
    'onDragOver',
    'onDragLeave',
    'onDrop',
    'accept',
    'multiple',
    'dropzone',
    'preview',
    'label',
    'description',
    'icon',
    'fileIcon',
    'maxFiles',
    'minSize',
    'maxSize',
    'onValueChange',
    'onFileReject',
    'size',
    'classes',
    'styles',
    'class',
    'style',
  ])

  const design = useMoraineDesign()
  const fileUploadDesign = () => design().fileUpload

  const merged = mergeProps(
    {
      as: 'div' as T,
      accept: '*',
      multiple: false,
      dropzone: true,
      preview: true,
      icon: 'icon-upload' as const,
      fileIcon: 'icon-file' as const,
    },
    () => fileUploadDesign()?.defaultVariants,
    local,
  )
  const label = createMemo(() => merged.label)
  const description = createMemo(() => merged.description)
  const dropzone = createMemo(() => merged.dropzone)
  const preview = createMemo(() => merged.preview)
  const readOnly = createMemo(() => Boolean(merged.readOnly))

  const generatedId = useId(() => merged.id, 'file-upload')
  const field = useFormField(
    () => ({
      id: merged.id,
      name: merged.name,
      size: merged.size,
      disabled: merged.disabled,
      required: local.required,
      readOnly: readOnly(),
    }),
    () => ({
      defaultId: generatedId(),
      defaultSize: 'md',
      initialValue: merged.multiple ? [] : null,
    }),
  )

  const resolved = resolveComponentStyle({
    design: {
      get classes() {
        return fileUploadDesign()?.recipe({
          size: field.size(),
          dropzone: dropzone(),
        })
      },
    },
    get instance() {
      return {
        class: local.class,
        classes: local.classes,
        style: local.style,
        styles: local.styles,
      }
    },
    state: {
      get classes() {
        return { control: field.disabled() ? 'bg-muted/32' : undefined }
      },
    },
  })

  let hiddenInputEl: HTMLInputElement | undefined

  const [selectedFiles, setSelectedFiles] = createSignal<File[]>([])
  const [dragging, setDragging] = createSignal(false)
  const [previewUrls, setPreviewUrls] = createSignal<Map<File, string>>(new Map())

  const labelId = createMemo(() => `${field.id()}-label`)
  const descriptionId = createMemo(() => (description() ? `${field.id()}-description` : undefined))
  const controlAriaAttrs = createMemo(() => {
    const attrs = { ...field.ariaAttrs() }
    const describedBy = [attrs['aria-describedby'], descriptionId()].filter(Boolean).join(' ')

    if (describedBy) {
      attrs['aria-describedby'] = describedBy
    }
    if (!attrs['aria-labelledby']) {
      if (label()) {
        attrs['aria-labelledby'] = labelId()
      } else {
        attrs['aria-label'] = 'File upload'
      }
    }

    return attrs
  })

  const resolvedMaxFiles = createMemo(() => {
    if (merged.maxFiles !== undefined) {
      return merged.maxFiles
    }

    return merged.multiple ? Number.POSITIVE_INFINITY : 1
  })

  function resolveValue(files: File[]): FileUploadT.Value {
    if (merged.multiple) {
      return [...files]
    }

    return files[0] ?? null
  }

  function emitValueChange(files: File[]): void {
    const nextValue = resolveValue(files)

    field.setFormValue(nextValue)
    merged.onValueChange?.(nextValue)
    field.emit('change')
    field.emit('input')
  }

  function commitSelectedFiles(files: File[]): void {
    setSelectedFiles(files)
    syncNativeInputFiles(hiddenInputEl, files)
    emitValueChange(files)
  }

  function openFileDialog(): void {
    if (field.disabled() || readOnly()) {
      return
    }

    hiddenInputEl?.click()
  }

  function processIncomingFiles(files: File[]): void {
    if (files.length === 0) {
      return
    }

    if (field.disabled() || readOnly()) {
      syncNativeInputFiles(hiddenInputEl, selectedFiles())
      return
    }

    const currentFiles = selectedFiles()
    const { accepted, rejected } = filterAcceptedFiles(files, {
      accept: merged.accept,
      existingFiles: currentFiles,
      minSize: merged.minSize,
      maxSize: merged.maxSize,
    })

    let nextFiles = currentFiles

    if (merged.multiple) {
      const bounded = constrainMultipleFiles(accepted, currentFiles.length, resolvedMaxFiles())
      rejected.push(...bounded.rejected)

      if (bounded.accepted.length > 0) {
        nextFiles = [...currentFiles, ...bounded.accepted]
      }
    } else {
      const bounded =
        resolvedMaxFiles() < 1
          ? constrainMultipleFiles(accepted, 0, 0)
          : constrainSingleFile(accepted)
      rejected.push(...bounded.rejected)

      if (bounded.accepted.length > 0) {
        nextFiles = [bounded.accepted[0]!]
      }
    }

    if (nextFiles !== currentFiles) {
      commitSelectedFiles(nextFiles)
    } else {
      syncNativeInputFiles(hiddenInputEl, currentFiles)
    }

    if (rejected.length > 0) {
      merged.onFileReject?.(rejected)
    }
  }

  function removeFileAt(index: number): void {
    if (field.disabled() || readOnly()) {
      return
    }

    const currentFiles = selectedFiles()
    if (!currentFiles[index]) {
      return
    }

    const nextFiles = currentFiles.filter((_, fileIndex) => fileIndex !== index)
    commitSelectedFiles(nextFiles)
  }

  function FileRemoveButton(props: { file: File; index: number }): JSX.Element {
    return (
      <button
        type="button"
        aria-label={`Remove ${props.file.name}`}
        data-slot="fileRemove"
        {...resolved.slotClassAndStyle('fileRemove')}
        disabled={field.disabled() || readOnly()}
        onClick={() => {
          removeFileAt(props.index)
        }}
      >
        <Icon name="icon-close" />
      </button>
    )
  }

  createEffect(() => {
    const files = selectedFiles()
    const previewsEnabled = preview()

    setPreviewUrls((previous) => {
      const next = new Map(previous)

      for (const [file, url] of previous.entries()) {
        if (!previewsEnabled || !files.includes(file) || !isImageFile(file)) {
          revokeObjectUrl(url)
          next.delete(file)
        }
      }

      if (!previewsEnabled) {
        return next
      }

      for (const file of files) {
        if (!isImageFile(file) || next.has(file)) {
          continue
        }

        const url = createObjectUrl(file)
        if (url) {
          next.set(file, url)
        }
      }

      return next
    })
  })

  createEffect(() => {
    if (selectedFiles().length > 0) {
      return
    }

    if (hiddenInputEl) {
      hiddenInputEl.value = ''
    }
  })

  onCleanup(() => {
    for (const url of previewUrls().values()) {
      revokeObjectUrl(url)
    }
  })

  useFormReset(
    () => hiddenInputEl?.form,
    () => {
      setDragging(false)
      setSelectedFiles([])
      syncNativeInputFiles(hiddenInputEl, [])
      field.setFormValue(merged.multiple ? [] : null)
    },
  )

  function Content(): JSX.Element {
    return (
      <div data-slot="wrapper" {...resolved.slotClassAndStyle('wrapper')}>
        <Icon name={merged.icon} slotName="icon" {...resolved.slotClassAndStyle('icon')} />

        <Show when={label()}>
          <span id={labelId()} data-slot="label" {...resolved.slotClassAndStyle('label')}>
            {label()}
          </span>
        </Show>

        <Show when={description()}>
          <span
            id={descriptionId()}
            data-slot="description"
            {...resolved.slotClassAndStyle('description')}
          >
            {description()}
          </span>
        </Show>
      </div>
    )
  }

  const onControlClick: JSX.EventHandler<HTMLButtonElement | HTMLDivElement, MouseEvent> = (
    event,
  ) => {
    callHandler(event, merged.onClick)

    if (!event.defaultPrevented) {
      openFileDialog()
    }
  }

  const onDropzoneKeyDown: JSX.EventHandler<HTMLDivElement, KeyboardEvent> = (event) => {
    callHandler(event, merged.onKeyDown)

    if (!event.defaultPrevented && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      openFileDialog()
    }
  }

  const onDropzoneDragOver: JSX.EventHandler<HTMLDivElement, DragEvent> = (event) => {
    callHandler(event, merged.onDragOver)

    if (event.defaultPrevented || field.disabled() || readOnly() || !isFileDragEvent(event)) {
      return
    }

    event.preventDefault()
    try {
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy'
      }
    } catch {
      // Some browser engines expose a read-only dropEffect.
    }
    setDragging(true)
  }

  const onDropzoneDragLeave: JSX.EventHandler<HTMLDivElement, DragEvent> = (event) => {
    callHandler(event, merged.onDragLeave)

    if (event.defaultPrevented) {
      return
    }

    const relatedTarget = event.relatedTarget
    if (relatedTarget instanceof Node && event.currentTarget.contains(relatedTarget)) {
      return
    }

    setDragging(false)
  }

  const onDropzoneDrop: JSX.EventHandler<HTMLDivElement, DragEvent> = (event) => {
    callHandler(event, merged.onDrop)
    setDragging(false)

    if (event.defaultPrevented || field.disabled() || readOnly() || !isFileDragEvent(event)) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    const files = Array.from(event.dataTransfer?.files ?? [])
    processIncomingFiles(files)
  }

  return (
    <Dynamic
      role="group"
      aria-labelledby={field.ariaAttrs()['aria-labelledby'] ?? (label() ? labelId() : undefined)}
      aria-label={field.ariaAttrs()['aria-labelledby'] || label() ? undefined : 'File upload'}
      disabled={field.disabled()}
      data-slot="root"
      data-disabled={field.disabled() ? '' : undefined}
      data-readonly={readOnly() ? '' : undefined}
      {...(rest as Record<string, unknown>)}
      id={`${field.id()}-root`}
      component={merged.as as any}
      {...resolved.rootClassAndStyle()}
    >
      <Show
        when={dropzone()}
        fallback={
          <button
            type="button"
            data-slot="control"
            {...resolved.slotClassAndStyle('control')}
            data-invalid={field.invalid() ? '' : undefined}
            disabled={field.disabled()}
            {...controlAriaAttrs()}
            onFocus={(event) => field.emit('focus', event)}
            onBlur={(event) => field.emit('blur', event)}
            onClick={onControlClick}
          >
            <Content />
          </button>
        }
      >
        <div
          role="button"
          tabIndex={field.disabled() ? undefined : 0}
          {...controlAriaAttrs()}
          data-slot="control"
          {...resolved.slotClassAndStyle('control')}
          data-dragging={dragging() ? '' : undefined}
          data-invalid={field.invalid() ? '' : undefined}
          onFocus={(event) => field.emit('focus', event)}
          onBlur={(event) => field.emit('blur', event)}
          onClick={onControlClick}
          onKeyDown={onDropzoneKeyDown}
          onDragOver={onDropzoneDragOver}
          onDragLeave={onDropzoneDragLeave}
          onDrop={onDropzoneDrop}
        >
          <Content />
        </div>
      </Show>

      <HiddenInput
        type="file"
        id={field.id()}
        ref={(element) => {
          hiddenInputEl = element
          callRef(local.inputRef, element)
        }}
        name={field.name()}
        accept={merged.accept}
        multiple={merged.multiple}
        required={field.required()}
        disabled={field.disabled()}
        readOnly={readOnly()}
        onChange={(event) => {
          const files = Array.from(event.currentTarget.files ?? [])
          processIncomingFiles(files)
        }}
        {...controlAriaAttrs()}
      />

      <Show when={preview() && selectedFiles().length > 0}>
        <ul data-slot="files" {...resolved.slotClassAndStyle('files')}>
          <For each={selectedFiles()}>
            {(file, index) => (
              <li data-slot="file" {...resolved.slotClassAndStyle('file')}>
                <span data-slot="filePreview" {...resolved.slotClassAndStyle('filePreview')}>
                  <Show
                    when={previewUrls().get(file)}
                    fallback={<Icon name={merged.fileIcon} class={resolved.slotClass('icon')} />}
                  >
                    {(url) => <img src={url()} alt={file.name} />}
                  </Show>
                </span>

                <div data-slot="fileMeta" {...resolved.slotClassAndStyle('fileMeta')}>
                  <span data-slot="fileName" {...resolved.slotClassAndStyle('fileName')}>
                    {file.name}
                  </span>
                  <span data-slot="fileSize" {...resolved.slotClassAndStyle('fileSize')}>
                    {formatFileSize(file.size)}
                  </span>
                </div>

                <FileRemoveButton file={file} index={index()} />
              </li>
            )}
          </For>
        </ul>
      </Show>
    </Dynamic>
  )
}
