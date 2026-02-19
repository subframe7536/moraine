import * as KobalteFileField from '@kobalte/core/file-field'
import type { FileError, FileRejection } from '@kobalte/core/file-field'
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

import { useFormField } from '../form-field/form-field-context'
import type { IconName } from '../icon'
import { Icon } from '../icon'
import { useId } from '../shared/utils'

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

type FileUploadColor = NonNullable<FileUploadBaseProps['color']>
type FileUploadSize = NonNullable<FileUploadBaseProps['size']>

export type FileUploadValue = File | File[] | null

export interface FileUploadClasses {
  root?: string
  base?: string
  wrapper?: string
  icon?: string
  label?: string
  description?: string
  files?: string
  file?: string
  filePreview?: string
  fileMeta?: string
  fileName?: string
  fileSize?: string
  fileRemove?: string
}

export interface FileUploadBaseProps extends Pick<
  FileUploadVariantProps,
  'color' | 'size' | 'highlight'
> {
  as?: ValidComponent
  id?: string
  name?: string
  accept?: string
  multiple?: boolean
  required?: boolean
  disabled?: boolean
  dropzone?: boolean
  preview?: boolean
  label?: JSX.Element
  description?: JSX.Element
  icon?: IconName
  fileIcon?: IconName
  maxFiles?: number
  onValueChange?: (value: FileUploadValue) => void
  onFileReject?: (files: FileRejection[]) => void
  classes?: FileUploadClasses
}

export type FileUploadProps = FileUploadBaseProps &
  Omit<JSX.HTMLAttributes<HTMLDivElement>, keyof FileUploadBaseProps | 'id' | 'children' | 'class'>

function normalizeFileUploadColor(value?: string): FileUploadColor {
  return (value as FileUploadColor | undefined) ?? 'primary'
}

function normalizeFileUploadSize(value?: string): FileUploadSize {
  return (value as FileUploadSize | undefined) ?? 'md'
}

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

export function FileUpload(props: FileUploadProps): JSX.Element {
  const merged = mergeProps(
    {
      as: 'div' as ValidComponent,
      accept: '*',
      multiple: false,
      dropzone: true,
      preview: true,
      color: 'primary' as const,
      size: 'md' as const,
      icon: 'icon-upload' as IconName,
      fileIcon: 'icon-file' as IconName,
    },
    props,
  )

  const [local, rest] = splitProps(merged as FileUploadProps, [
    'as',
    'id',
    'name',
    'accept',
    'multiple',
    'required',
    'disabled',
    'dropzone',
    'preview',
    'label',
    'description',
    'icon',
    'fileIcon',
    'maxFiles',
    'onValueChange',
    'onFileReject',
    'color',
    'size',
    'highlight',
    'classes',
  ])

  const field = useFormField(() => ({
    id: local.id,
    name: local.name,
    size: local.size,
    color: local.color,
    highlight: local.highlight,
    disabled: local.disabled,
  }))
  const generatedId = useId(() => local.id, 'file-upload')

  let hiddenInputEl: HTMLInputElement | undefined
  let fileFieldContext: ReturnType<typeof KobalteFileField.useFileFieldContext> | undefined

  const [selectedFiles, setSelectedFiles] = createSignal<File[]>([])
  const [dragging, setDragging] = createSignal(false)
  const [previewUrls, setPreviewUrls] = createSignal<Map<File, string>>(new Map())

  const inputId = () => field.id() ?? generatedId()
  const resolvedColor = () => normalizeFileUploadColor(field.color() ?? local.color)
  const resolvedSize = createMemo(() => normalizeFileUploadSize(field.size() ?? local.size))
  const resolvedMaxFiles = createMemo(() => {
    if (local.maxFiles !== undefined) {
      return local.maxFiles
    }

    return local.multiple ? Number.POSITIVE_INFINITY : 1
  })

  function FileFieldContextBridge(): null {
    fileFieldContext = KobalteFileField.useFileFieldContext()
    return null
  }

  function resolveValue(files: File[]): FileUploadValue {
    if (local.multiple) {
      return [...files]
    }

    return files[0] ?? null
  }

  function emitValueChange(files: File[]): void {
    local.onValueChange?.(resolveValue(files))
    field.emitFormChange()
    field.emitFormInput()
  }

  function handleFileReject(files: FileRejection[]): void {
    local.onFileReject?.(files)
  }

  function processIncomingFiles(files: File[]): void {
    if (files.length === 0) {
      return
    }

    const accepted: File[] = []
    const rejected: FileRejection[] = []

    for (const file of files) {
      if (!isAcceptedFileType(file, local.accept)) {
        rejected.push(createRejection(file, 'FILE_INVALID_TYPE'))
        continue
      }

      accepted.push(file)
    }

    if (local.multiple) {
      const currentFiles = selectedFiles()
      const maxFiles = resolvedMaxFiles()
      const remainingSlots = Number.isFinite(maxFiles)
        ? Math.max(0, maxFiles - currentFiles.length)
        : Number.POSITIVE_INFINITY

      if (remainingSlots === 0) {
        for (const file of accepted) {
          rejected.push(createRejection(file, 'TOO_MANY_FILES'))
        }
        accepted.length = 0
      } else if (Number.isFinite(remainingSlots) && accepted.length > remainingSlots) {
        const overflow = accepted.splice(remainingSlots)
        for (const file of overflow) {
          rejected.push(createRejection(file, 'TOO_MANY_FILES'))
        }
      }

      if (accepted.length > 0) {
        const nextFiles = [...currentFiles, ...accepted]
        setSelectedFiles(nextFiles)
        emitValueChange(nextFiles)
      }
    } else {
      if (accepted.length > 1) {
        const overflow = accepted.splice(1)
        for (const file of overflow) {
          rejected.push(createRejection(file, 'TOO_MANY_FILES'))
        }
      }

      if (accepted.length > 0) {
        const nextFiles = [accepted[0]!]
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
    const targetFile = currentFiles[index]

    if (!targetFile) {
      return
    }

    fileFieldContext?.removeFile(targetFile)

    const nextFiles = currentFiles.filter((_, fileIndex) => fileIndex !== index)
    setSelectedFiles(nextFiles)
    emitValueChange(nextFiles)
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

  function renderBaseContent(): JSX.Element {
    return (
      <div
        data-slot="wrapper"
        class={fileUploadWrapperVariants(
          {
            size: resolvedSize(),
          },
          local.classes?.wrapper,
        )}
      >
        <Icon
          name={local.icon}
          data-slot="icon"
          classes={{
            root: fileUploadIconVariants(
              {
                size: resolvedSize(),
              },
              local.classes?.icon,
            ),
          }}
        />

        <Show when={local.label}>
          <span
            data-slot="label"
            class={fileUploadLabelVariants(
              {
                size: resolvedSize(),
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
            class={fileUploadDescriptionVariants(
              {
                size: resolvedSize(),
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

  function renderFilePreview(file: File): JSX.Element {
    const previewUrl = previewUrls().get(file)

    return (
      <span
        data-slot="filePreview"
        class={fileUploadPreviewVariants(
          {
            size: resolvedSize(),
          },
          local.classes?.filePreview,
        )}
      >
        <Show
          when={previewUrl}
          fallback={
            <Icon
              name={local.fileIcon}
              classes={{
                root: fileUploadIconVariants({
                  size: resolvedSize(),
                }),
              }}
            />
          }
        >
          {(url) => <img src={url()} alt={file.name} class="size-full object-cover" />}
        </Show>
      </span>
    )
  }

  return (
    <KobalteFileField.Root
      as={local.as}
      id={`${inputId()}-root`}
      name={field.name()}
      accept={local.accept}
      multiple={local.multiple}
      maxFiles={resolvedMaxFiles()}
      allowDragAndDrop={local.dropzone}
      required={local.required}
      disabled={field.disabled()}
      data-slot="root"
      class={fileUploadRootVariants(
        {
          size: resolvedSize(),
          disabled: field.disabled(),
        },
        local.classes?.root,
      )}
      {...rest}
    >
      <FileFieldContextBridge />

      <Show
        when={local.dropzone}
        fallback={
          <KobalteFileField.Trigger
            data-slot="base"
            class={fileUploadBaseVariants(
              {
                color: resolvedColor(),
                size: resolvedSize(),
                highlight: field.highlight(),
                disabled: field.disabled(),
                dragging: false,
                dropzone: false,
              },
              local.classes?.base,
            )}
            onFocus={() => field.emitFormFocus()}
            onBlur={() => field.emitFormBlur()}
          >
            {renderBaseContent()}
          </KobalteFileField.Trigger>
        }
      >
        <KobalteFileField.Dropzone
          data-slot="base"
          class={fileUploadBaseVariants(
            {
              color: resolvedColor(),
              size: resolvedSize(),
              highlight: field.highlight(),
              disabled: field.disabled(),
              dragging: dragging(),
              dropzone: true,
            },
            local.classes?.base,
          )}
          onFocus={() => field.emitFormFocus()}
          onBlur={() => field.emitFormBlur()}
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
          {renderBaseContent()}
        </KobalteFileField.Dropzone>
      </Show>

      <KobalteFileField.HiddenInput
        id={inputId()}
        ref={(element) => (hiddenInputEl = element)}
        name={field.name()}
        required={local.required}
        disabled={field.disabled()}
        onChange={(event) => {
          const files = Array.from(event.currentTarget.files ?? [])
          processIncomingFiles(files)
        }}
        {...(field.ariaAttrs() ?? {})}
      />

      <Show when={local.preview && selectedFiles().length > 0}>
        <ul
          data-slot="files"
          class={fileUploadFilesVariants(
            {
              size: resolvedSize(),
            },
            local.classes?.files,
          )}
        >
          <For each={selectedFiles()}>
            {(file, index) => (
              <li
                data-slot="file"
                class={fileUploadFileVariants(
                  {
                    size: resolvedSize(),
                  },
                  local.classes?.file,
                )}
              >
                {renderFilePreview(file)}

                <div
                  data-slot="fileMeta"
                  class={fileUploadMetaVariants(
                    {
                      size: resolvedSize(),
                    },
                    local.classes?.fileMeta,
                  )}
                >
                  <span
                    data-slot="fileName"
                    class={fileUploadNameVariants(
                      {
                        size: resolvedSize(),
                      },
                      local.classes?.fileName,
                    )}
                  >
                    {file.name}
                  </span>
                  <span
                    data-slot="fileSize"
                    class={fileUploadSizeVariants(
                      {
                        size: resolvedSize(),
                      },
                      local.classes?.fileSize,
                    )}
                  >
                    {formatFileSize(file.size)}
                  </span>
                </div>

                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  data-slot="fileRemove"
                  class={fileUploadRemoveVariants(
                    {
                      size: resolvedSize(),
                      disabled: field.disabled(),
                    },
                    local.classes?.fileRemove,
                  )}
                  onClick={() => removeFileAt(index())}
                >
                  <Icon name="icon-close" />
                </button>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </KobalteFileField.Root>
  )
}
