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

import type { IconT } from '../../elements/icon/index.ts'
import { Icon } from '../../elements/icon/index.ts'
import { HiddenInput } from '../../shared/hidden-input.tsx'
import { resolveComponentStyle, useMoraineConfig } from '../../shared/provider/index.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import { callHandler, useId } from '../../shared/utils.ts'
import { useFormField } from '../form/form-context.ts'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
} from '../shared/form-options.ts'
import { useFormReset } from '../shared/use-form-reset.ts'

import type { FileUploadVariantProps } from './file-upload.class.ts'
import { fileUploadRecipe } from './file-upload.class.ts'

type FileError =
  | 'TOO_MANY_FILES'
  | 'FILE_INVALID_TYPE'
  | 'FILE_TOO_LARGE'
  | 'FILE_TOO_SMALL'
  | 'FILE_DUPLICATE'

interface FileRejection {
  file: File
  errors: FileError[]
}

export namespace FileUploadT {
  export type Value = File | File[] | null

  export interface Slot<T = unknown> {
    /**
     * Upload component container that owns dropzone, file input, and file list.
     */
    root?: T

    /** Dropzone and picker control users interact with to select files. */
    control?: T

    /** Inner control layout for icon, label, and description. */
    wrapper?: T

    /** Upload or status icon shown inside the control. */
    icon?: T

    /** Primary instruction text for the upload control. */
    label?: T

    /** Supporting upload requirements or helper text. */
    description?: T

    /** List region that displays selected files and upload progress. */
    files?: T

    /** Row for one selected file, including preview, metadata, and remove action. */
    file?: T

    /** Preview or file-type icon area for a selected file. */
    filePreview?: T

    /** Text region for file name, size, and validation state. */
    fileMeta?: T

    /** Display name for a selected file. */
    fileName?: T

    /** File size text for a selected file. */
    fileSize?: T

    /** Button used to remove a selected file from the list. */
    fileRemove?: T
  }

  export type Variant = FileUploadVariantProps
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {}

  /**
   * Base props for the FileUpload component.
   */
  export interface Base<T extends ValidComponent = 'div'>
    extends FormIdentityOptions, FormRequiredOption, FormDisableOption, FormReadOnlyOption {
    /**
     * The HTML element or component to render as.
     * @default 'div'
     */
    as?: T

    /**
     * Click handler for the upload control.
     */
    onClick?: JSX.EventHandlerUnion<HTMLElement, MouseEvent>

    /**
     * Keyboard handler for the upload control.
     */
    onKeyDown?: JSX.EventHandlerUnion<HTMLElement, KeyboardEvent>

    /**
     * Drag-over handler for the upload dropzone.
     */
    onDragOver?: JSX.EventHandlerUnion<HTMLElement, DragEvent>

    /**
     * Drag-leave handler for the upload dropzone.
     */
    onDragLeave?: JSX.EventHandlerUnion<HTMLElement, DragEvent>

    /**
     * Drop handler for the upload dropzone.
     */
    onDrop?: JSX.EventHandlerUnion<HTMLElement, DragEvent>

    /**
     * Accepted file types (e.g., ".jpg,.png", "image/*").
     * @default '*'
     */
    accept?: string

    /**
     * Whether multiple files can be uploaded.
     * @default false
     */
    multiple?: boolean

    /**
     * Whether to enable drag and drop.
     * @default true
     */
    dropzone?: boolean

    /**
     * Whether to show file previews.
     * @default true
     */
    preview?: boolean

    /**
     * Label for the upload area.
     */
    label?: JSX.Element

    /**
     * Description text for the upload area.
     */
    description?: JSX.Element

    /**
     * Icon to show in the upload area.
     * @default 'icon-upload'
     */
    icon?: IconT.Name

    /**
     * Icon to show for individual files when no preview is available.
     * @default 'icon-file'
     */
    fileIcon?: IconT.Name

    /**
     * Maximum number of files allowed.
     */
    maxFiles?: number

    /**
     * Minimum accepted file size in bytes.
     */
    minSize?: number

    /**
     * Maximum accepted file size in bytes.
     */
    maxSize?: number

    /**
     * Callback when the selected files change.
     */
    onValueChange?: (value: Value) => void

    /**
     * Callback when files are rejected (e.g., due to type or count).
     */
    onFileReject?: (files: FileRejection[]) => void
  }

  /**
   * Props for the FileUpload component.
   */
  export type Props<T extends ValidComponent = 'div'> = BaseProps<
    T,
    Base<T>,
    Variant,
    Classes,
    Styles
  >
}

/**
 * Props for the FileUpload component.
 */
export type FileUploadProps<T extends ValidComponent = 'div'> = FileUploadT.Props<T>

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

function createRejection(file: File, error: FileError): FileRejection {
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
  rejected: FileRejection[]
} {
  const accepted: File[] = []
  const rejected: FileRejection[] = []
  const seenFiles = new Set(options.existingFiles.map(getFileIdentity))

  for (const file of files) {
    const errors: FileError[] = []

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
  rejected: FileRejection[]
} {
  const rejected: FileRejection[] = []
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
  rejected: FileRejection[]
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

  const config = useMoraineConfig()
  const provider = () => config().fileUpload

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
    () => provider()?.variants,
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

  const slots = createMemo(() =>
    fileUploadRecipe({
      size: field.size(),
      dropzone: dropzone(),
    }),
  )

  const resolved = resolveComponentStyle({
    get slots() {
      return slots()
    },
    get provider() {
      return provider()
    },
    get instance() {
      return {
        class: local.class,
        classes: local.classes,
        style: local.style,
        styles: local.styles,
      }
    },
    get stateCls() {
      return { control: field.disabled() ? 'bg-muted/32' : undefined }
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
        style={resolved.slotStyle('fileRemove')}
        class={resolved.slotClass('fileRemove')}
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
      <div
        data-slot="wrapper"
        style={resolved.slotStyle('wrapper')}
        class={resolved.slotClass('wrapper')}
      >
        <Icon
          name={merged.icon}
          slotName="icon"
          style={resolved.slotStyle('icon')}
          class={resolved.slotClass('icon')}
        />

        <Show when={label()}>
          <span
            id={labelId()}
            data-slot="label"
            style={resolved.slotStyle('label')}
            class={resolved.slotClass('label')}
          >
            {label()}
          </span>
        </Show>

        <Show when={description()}>
          <span
            id={descriptionId()}
            data-slot="description"
            style={resolved.slotStyle('description')}
            class={resolved.slotClass('description')}
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
      aria-labelledby={label() ? labelId() : undefined}
      aria-label={label() ? undefined : 'File upload'}
      disabled={field.disabled()}
      data-slot="root"
      data-disabled={field.disabled() ? '' : undefined}
      data-readonly={readOnly() ? '' : undefined}
      {...(rest as Record<string, unknown>)}
      id={`${field.id()}-root`}
      component={merged.as as any}
      style={resolved.rootStyle()}
      class={resolved.rootClass()}
    >
      <Show
        when={dropzone()}
        fallback={
          <button
            type="button"
            data-slot="control"
            style={resolved.slotStyle('control')}
            data-invalid={field.invalid() ? '' : undefined}
            class={resolved.slotClass('control')}
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
          style={resolved.slotStyle('control')}
          data-dragging={dragging() ? '' : undefined}
          data-invalid={field.invalid() ? '' : undefined}
          class={resolved.slotClass('control')}
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
        ref={(element) => (hiddenInputEl = element)}
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
        <ul
          data-slot="files"
          style={resolved.slotStyle('files')}
          class={resolved.slotClass('files')}
        >
          <For each={selectedFiles()}>
            {(file, index) => (
              <li
                data-slot="file"
                style={resolved.slotStyle('file')}
                class={resolved.slotClass('file')}
              >
                <span
                  data-slot="filePreview"
                  style={resolved.slotStyle('filePreview')}
                  class={resolved.slotClass('filePreview')}
                >
                  <Show
                    when={previewUrls().get(file)}
                    fallback={<Icon name={merged.fileIcon} class={resolved.slotClass('icon')} />}
                  >
                    {(url) => <img src={url()} alt={file.name} class="size-full object-cover" />}
                  </Show>
                </span>

                <div
                  data-slot="fileMeta"
                  style={resolved.slotStyle('fileMeta')}
                  class={resolved.slotClass('fileMeta')}
                >
                  <span
                    data-slot="fileName"
                    style={resolved.slotStyle('fileName')}
                    class={resolved.slotClass('fileName')}
                  >
                    {file.name}
                  </span>
                  <span
                    data-slot="fileSize"
                    style={resolved.slotStyle('fileSize')}
                    class={resolved.slotClass('fileSize')}
                  >
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
