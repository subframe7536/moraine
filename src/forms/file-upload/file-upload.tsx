import * as KobalteFileField from '@kobalte/core/file-field'
import type { FileError, FileRejection } from '@kobalte/core/file-field'
import type { JSX } from 'solid-js'
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

import type { IconT } from '../../elements/icon'
import { Icon } from '../../elements/icon'
import type { BaseProps, SlotClasses, SlotStyles } from '../../shared/types'
import { useId } from '../../shared/utils'
import { useFormField } from '../form-field/form-field-context'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormRequiredOption,
} from '../form-field/form-options'
import { FORM_ID_NAME_DISABLED_KEYS } from '../form-field/form-options'

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

export namespace FileUploadT {
  export type Value = File | File[] | null

  export type Slot =
    | 'root'
    | 'control'
    | 'wrapper'
    | 'icon'
    | 'label'
    | 'description'
    | 'files'
    | 'file'
    | 'filePreview'
    | 'fileMeta'
    | 'fileName'
    | 'fileSize'
    | 'fileRemove'

  export type Variant = FileUploadVariantProps
  export type Classes = SlotClasses<Slot>
  export type Styles = SlotStyles<Slot>
  export type Extend = JSX.HTMLAttributes<HTMLDivElement>

  export interface Item {}

  /**
   * Base props for the FileUpload component.
   */
  export interface Base extends FormIdentityOptions, FormRequiredOption, FormDisableOption {
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
  export interface Props extends BaseProps<Base, Variant, Extend, Slot> {}
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

function filterAcceptedFiles(
  files: File[],
  accept: string | undefined,
): {
  accepted: File[]
  rejected: FileRejection[]
} {
  const accepted: File[] = []
  const rejected: FileRejection[] = []

  for (const file of files) {
    if (!isAcceptedFileType(file, accept)) {
      rejected.push(createRejection(file, 'FILE_INVALID_TYPE'))
      continue
    }

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

  const [local, rest] = splitProps(merged, [
    ...FORM_ID_NAME_DISABLED_KEYS,
    'accept',
    'multiple',
    'required',
    'maxFiles',
    'onValueChange',
    'onFileReject',
    'dropzone',
    'preview',
    'label',
    'description',
    'icon',
    'fileIcon',
    'size',
    'classes',
  ])

  const generatedId = useId(() => local.id, 'file-upload')
  const field = useFormField(
    () => ({
      id: local.id,
      name: local.name,
      size: local.size,
      disabled: local.disabled,
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

  const resolvedMaxFiles = createMemo(() => {
    if (local.maxFiles !== undefined) {
      return local.maxFiles
    }

    return local.multiple ? Number.POSITIVE_INFINITY : 1
  })

  function resolveValue(files: File[]): FileUploadT.Value {
    if (local.multiple) {
      return [...files]
    }

    return files[0] ?? null
  }

  function emitValueChange(files: File[]): void {
    const nextValue = resolveValue(files)

    field.setFormValue(nextValue)
    local.onValueChange?.(nextValue)
    field.emit('change')
    field.emit('input')
  }

  function handleFileReject(files: FileRejection[]): void {
    local.onFileReject?.(files)
  }

  function processIncomingFiles(files: File[]): void {
    if (files.length === 0) {
      return
    }

    const { accepted, rejected } = filterAcceptedFiles(files, local.accept)

    if (local.multiple) {
      const currentFiles = selectedFiles()
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
          local.classes?.fileRemove,
        )}
        disabled={field.disabled()}
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
          local.classes?.wrapper,
        )}
      >
        <Icon
          name={local.icon}
          slotName="icon"
          style={merged.styles?.icon}
          class={fileUploadIconVariants(
            {
              size: field.size(),
            },
            local.classes?.icon,
          )}
        />

        <Show when={local.label}>
          <span
            data-slot="label"
            style={merged.styles?.label}
            class={fileUploadLabelVariants(
              {
                size: field.size(),
              },
              local.classes?.label,
            )}
          >
            {local.label}
          </span>
        </Show>

        <Show when={local.description}>
          <span
            data-slot="description"
            style={merged.styles?.description}
            class={fileUploadDescriptionVariants(
              {
                size: field.size(),
              },
              local.classes?.description,
            )}
          >
            {local.description}
          </span>
        </Show>
      </div>
    )
  }

  return (
    <KobalteFileField.Root
      id={`${field.id()}-root`}
      name={field.name()}
      accept={local.accept}
      multiple={local.multiple}
      maxFiles={resolvedMaxFiles()}
      allowDragAndDrop={local.dropzone}
      required={local.required}
      disabled={field.disabled()}
      data-slot="root"
      style={merged.styles?.root}
      data-disabled={field.disabled() ? '' : undefined}
      class={fileUploadRootVariants(
        {
          size: field.size(),
        },
        local.classes?.root,
      )}
      {...(rest as Record<string, unknown>)}
    >
      <Show
        when={local.dropzone}
        fallback={
          <KobalteFileField.Trigger
            data-slot="control"
            style={merged.styles?.control}
            data-invalid={field.invalid() ? '' : undefined}
            class={fileUploadBaseVariants(
              {
                size: field.size(),
                dropzone: false,
              },
              field.disabled() && 'bg-muted/32',
              local.classes?.control,
            )}
            onFocus={() => field.emit('focus')}
            onBlur={() => field.emit('blur')}
          >
            <Content />
          </KobalteFileField.Trigger>
        }
      >
        <KobalteFileField.Dropzone
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
            local.classes?.control,
          )}
          onFocus={() => field.emit('focus')}
          onBlur={() => field.emit('blur')}
          onDragOver={() => {
            if (!field.disabled()) {
              setDragging(true)
            }
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            setDragging(false)

            if (field.disabled()) {
              return
            }

            const files = Array.from(event.dataTransfer?.files ?? [])
            processIncomingFiles(files)
          }}
        >
          <Content />
        </KobalteFileField.Dropzone>
      </Show>

      <KobalteFileField.HiddenInput
        id={field.id()}
        ref={(element) => (hiddenInputEl = element)}
        name={field.name()}
        required={local.required}
        disabled={field.disabled()}
        onChange={(event) => {
          const files = Array.from(event.currentTarget.files ?? [])
          processIncomingFiles(files)
        }}
        {...field.ariaAttrs()}
      />

      <Show when={local.preview && selectedFiles().length > 0}>
        <ul
          data-slot="files"
          style={merged.styles?.files}
          class={fileUploadFilesVariants(
            {
              size: field.size(),
            },
            local.classes?.files,
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
                  local.classes?.file,
                )}
              >
                <span
                  data-slot="filePreview"
                  style={merged.styles?.filePreview}
                  class={fileUploadPreviewVariants(
                    {
                      size: field.size(),
                    },
                    local.classes?.filePreview,
                  )}
                >
                  <Show
                    when={previewUrls().get(file)}
                    fallback={
                      <Icon
                        name={local.fileIcon}
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
                    local.classes?.fileMeta,
                  )}
                >
                  <span
                    data-slot="fileName"
                    style={merged.styles?.fileName}
                    class={fileUploadNameVariants(
                      {
                        size: field.size(),
                      },
                      local.classes?.fileName,
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
                      local.classes?.fileSize,
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
    </KobalteFileField.Root>
  )
}
