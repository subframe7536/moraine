import type { JSX, ValidComponent } from 'solid-js'
import { For, Show, createEffect, createMemo, createSignal, mergeProps, onCleanup } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import type { IconT } from '../../elements/icon'
import { Icon } from '../../elements/icon'
import { HiddenInput } from '../../shared/hidden-input'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import { callHandler, useId } from '../../shared/utils'
import { useFormField } from '../form-field/form-field-context'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
} from '../form-field/form-options'

import type { FileUploadVariantProps } from './file-upload.class'
import {
  fileUploadBaseVariants,
  fileUploadDescriptionVariants,
  fileUploadFileVariants,
  fileUploadFilesVariants,
  fileUploadIconVariants,
  fileUploadLabelVariants,
  fileUploadMetaVariants,
  fileUploadNameVariants,
  fileUploadPreviewVariants,
  fileUploadRemoveVariants,
  fileUploadRootVariants,
  fileUploadSizeVariants,
  fileUploadWrapperVariants,
} from './file-upload.class'

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
  export type Extend = never

  export interface Item {}

  /**
   * Base props for the FileUpload component.
   */
  export interface Base
    extends FormIdentityOptions, FormRequiredOption, FormDisableOption, FormReadOnlyOption {
    /**
     * The HTML element or component to render as.
     * @default 'div'
     */
    as?: ValidComponent

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
  export interface Props extends BaseProps<Base, Variant, Extend, Classes, Styles> {}
}

/**
 * Props for the FileUpload component.
 */
export interface FileUploadProps extends FileUploadT.Props {}

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
    if (!isAcceptedFileType(file, options.accept)) {
      rejected.push(createRejection(file, 'FILE_INVALID_TYPE'))
      continue
    }

    if (options.minSize !== undefined && file.size < options.minSize) {
      rejected.push(createRejection(file, 'FILE_TOO_SMALL'))
      continue
    }

    if (options.maxSize !== undefined && file.size > options.maxSize) {
      rejected.push(createRejection(file, 'FILE_TOO_LARGE'))
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
export function FileUpload(props: FileUploadProps): JSX.Element {
  const merged = mergeProps(
    {
      as: 'div' as ValidComponent,
      accept: '*',
      multiple: false,
      dropzone: true,
      preview: true,
      size: 'md' as const,
      icon: 'icon-upload' as IconT.Name,
      fileIcon: 'icon-file' as IconT.Name,
    },
    props,
  )

  const generatedId = useId(() => merged.id, 'file-upload')
  const field = useFormField(
    () => ({
      id: merged.id,
      name: merged.name,
      size: merged.size,
      disabled: merged.disabled,
    }),
    () => ({
      defaultId: generatedId(),
      defaultSize: 'md',
      initialValue: null,
    }),
  )

  let hiddenInputEl: HTMLInputElement | undefined

  const [selectedFiles, setSelectedFiles] = createSignal<File[]>([])
  const [dragging, setDragging] = createSignal(false)
  const [previewUrls, setPreviewUrls] = createSignal<Map<File, string>>(new Map())

  const readOnly = createMemo(() => Boolean(merged.readOnly))

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

  function openFileDialog(): void {
    if (field.disabled() || readOnly()) {
      return
    }

    hiddenInputEl?.click()
  }

  function handleFileReject(files: FileRejection[]): void {
    merged.onFileReject?.(files)
  }

  function processIncomingFiles(files: File[]): void {
    if (files.length === 0 || field.disabled() || readOnly()) {
      return
    }

    const currentFiles = selectedFiles()
    const { accepted, rejected } = filterAcceptedFiles(files, {
      accept: merged.accept,
      existingFiles: currentFiles,
      minSize: merged.minSize,
      maxSize: merged.maxSize,
    })

    if (merged.multiple) {
      const bounded = constrainMultipleFiles(accepted, currentFiles.length, resolvedMaxFiles())
      rejected.push(...bounded.rejected)

      if (bounded.accepted.length > 0) {
        const nextFiles = [...currentFiles, ...bounded.accepted]
        setSelectedFiles(nextFiles)
        emitValueChange(nextFiles)
      }
    } else {
      const bounded = constrainSingleFile(accepted)
      rejected.push(...bounded.rejected)

      if (bounded.accepted.length > 0) {
        const nextFiles = [bounded.accepted[0]!]
        setSelectedFiles(nextFiles)
        emitValueChange(nextFiles)
      }
    }

    if (rejected.length > 0) {
      handleFileReject(rejected)
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
    setSelectedFiles(nextFiles)
    emitValueChange(nextFiles)
  }

  function FileRemoveButton(props: { file: File; index: number }): JSX.Element {
    return (
      <button
        type="button"
        aria-label={`Remove ${props.file.name}`}
        data-slot="fileRemove"
        style={merged.styles?.fileRemove}
        class={fileUploadRemoveVariants(
          {
            size: field.size(),
          },
          merged.classes?.fileRemove,
        )}
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

    setPreviewUrls((previous) => {
      const next = new Map(previous)

      for (const [file, url] of previous.entries()) {
        if (!files.includes(file) || !isImageFile(file)) {
          revokeObjectUrl(url)
          next.delete(file)
        }
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

  function Content(): JSX.Element {
    return (
      <div
        data-slot="wrapper"
        style={merged.styles?.wrapper}
        class={fileUploadWrapperVariants(
          {
            size: field.size(),
          },
          merged.classes?.wrapper,
        )}
      >
        <Icon
          name={merged.icon}
          slotName="icon"
          style={merged.styles?.icon}
          class={fileUploadIconVariants(
            {
              size: field.size(),
            },
            merged.classes?.icon,
          )}
        />

        <Show when={merged.label}>
          <span
            data-slot="label"
            style={merged.styles?.label}
            class={fileUploadLabelVariants(
              {
                size: field.size(),
              },
              merged.classes?.label,
            )}
          >
            {merged.label}
          </span>
        </Show>

        <Show when={merged.description}>
          <span
            data-slot="description"
            style={merged.styles?.description}
            class={fileUploadDescriptionVariants(
              {
                size: field.size(),
              },
              merged.classes?.description,
            )}
          >
            {merged.description}
          </span>
        </Show>
      </div>
    )
  }

  function onControlClick(event: MouseEvent): void {
    callHandler(event, merged.onClick)

    if (!event.defaultPrevented) {
      openFileDialog()
    }
  }

  function onDropzoneKeyDown(event: KeyboardEvent): void {
    callHandler(event, merged.onKeyDown)

    if (!event.defaultPrevented && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      openFileDialog()
    }
  }

  function onDropzoneDragOver(event: DragEvent): void {
    callHandler(event, merged.onDragOver)

    if (!event.defaultPrevented && !field.disabled() && !readOnly()) {
      event.preventDefault()
      setDragging(true)
    }
  }

  function onDropzoneDragLeave(event: DragEvent): void {
    callHandler(event, merged.onDragLeave)
    setDragging(false)
  }

  function onDropzoneDrop(event: DragEvent): void {
    callHandler(event, merged.onDrop)
    setDragging(false)

    if (event.defaultPrevented || field.disabled() || readOnly()) {
      return
    }

    event.preventDefault()
    const files = Array.from(event.dataTransfer?.files ?? [])
    processIncomingFiles(files)
  }

  return (
    <Dynamic
      component={merged.as ?? 'div'}
      id={`${field.id()}-root`}
      role="group"
      disabled={field.disabled()}
      data-slot="root"
      style={{ ...merged.styles?.root, ...merged.style }}
      data-disabled={field.disabled() ? '' : undefined}
      data-readonly={readOnly() ? '' : undefined}
      class={fileUploadRootVariants(
        {
          size: field.size(),
        },
        merged.classes?.root,
        merged.class,
      )}
    >
      <Show
        when={merged.dropzone}
        fallback={
          <button
            type="button"
            data-slot="control"
            style={merged.styles?.control}
            data-invalid={field.invalid() ? '' : undefined}
            class={fileUploadBaseVariants(
              {
                size: field.size(),
                dropzone: false,
              },
              field.disabled() && 'bg-muted/32',
              merged.classes?.control,
            )}
            disabled={field.disabled()}
            aria-disabled={field.disabled() || readOnly() ? true : undefined}
            onFocus={() => field.emit('focus')}
            onBlur={() => field.emit('blur')}
            onClick={onControlClick}
          >
            <Content />
          </button>
        }
      >
        <div
          role="button"
          tabIndex={field.disabled() ? undefined : 0}
          aria-disabled={field.disabled() || readOnly() ? true : undefined}
          data-slot="control"
          style={merged.styles?.control}
          data-dragging={dragging() ? '' : undefined}
          data-invalid={field.invalid() ? '' : undefined}
          class={fileUploadBaseVariants(
            {
              size: field.size(),
              dropzone: true,
            },
            field.disabled() && 'bg-muted/32',
            merged.classes?.control,
          )}
          onFocus={() => field.emit('focus')}
          onBlur={() => field.emit('blur')}
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
        required={merged.required}
        disabled={field.disabled()}
        readOnly={readOnly()}
        onChange={(event) => {
          const files = Array.from(event.currentTarget.files ?? [])
          processIncomingFiles(files)
        }}
        {...field.ariaAttrs()}
      />

      <Show when={merged.preview && selectedFiles().length > 0}>
        <ul
          data-slot="files"
          style={merged.styles?.files}
          class={fileUploadFilesVariants(
            {
              size: field.size(),
            },
            merged.classes?.files,
          )}
        >
          <For each={selectedFiles()}>
            {(file, index) => (
              <li
                data-slot="file"
                style={merged.styles?.file}
                class={fileUploadFileVariants(
                  {
                    size: field.size(),
                  },
                  merged.classes?.file,
                )}
              >
                <span
                  data-slot="filePreview"
                  style={merged.styles?.filePreview}
                  class={fileUploadPreviewVariants(
                    {
                      size: field.size(),
                    },
                    merged.classes?.filePreview,
                  )}
                >
                  <Show
                    when={previewUrls().get(file)}
                    fallback={
                      <Icon
                        name={merged.fileIcon}
                        class={fileUploadIconVariants({
                          size: field.size(),
                        })}
                      />
                    }
                  >
                    {(url) => <img src={url()} alt={file.name} class="size-full object-cover" />}
                  </Show>
                </span>

                <div
                  data-slot="fileMeta"
                  style={merged.styles?.fileMeta}
                  class={fileUploadMetaVariants(
                    {
                      size: field.size(),
                    },
                    merged.classes?.fileMeta,
                  )}
                >
                  <span
                    data-slot="fileName"
                    style={merged.styles?.fileName}
                    class={fileUploadNameVariants(
                      {
                        size: field.size(),
                      },
                      merged.classes?.fileName,
                    )}
                  >
                    {file.name}
                  </span>
                  <span
                    data-slot="fileSize"
                    style={merged.styles?.fileSize}
                    class={fileUploadSizeVariants(
                      {
                        size: field.size(),
                      },
                      merged.classes?.fileSize,
                    )}
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
