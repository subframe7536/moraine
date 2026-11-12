import type { JSX } from 'solid-js'
import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  on,
  onCleanup,
  splitProps,
  untrack,
} from 'solid-js'

import { useRecipe } from '../../provider'
import { useMessages } from '../../provider/locale/locale-context'
import { HiddenInput } from '../../shared/hidden-input'
import { createKeyDownHandler } from '../../shared/keyboard'
import { renderWithProps } from '../../shared/render-with-props'
import { callHandler, callRef, createId } from '../../shared/utils'
import { useFieldContext, useFormField } from '../field/field-context'
import { Icon } from '../icon'
import { useFormReset } from '../shared/form/use-form-reset'
import { useFormValue } from '../shared/form/use-form-value'
import { useHiddenInputValidation } from '../shared/form/use-hidden-input-validation'

import { useFilePreviews } from './create-file-previews'
import {
  constrainMultipleFiles,
  constrainSingleFile,
  filterAcceptedFiles,
  formatFileSize,
  isFileDragEvent,
  syncNativeInputFiles,
} from './file-upload-utils'
import { defaultFileUploadMessages } from './file-upload.messages'
import { fileUploadDataAttributes, fileUploadRecipe } from './file-upload.recipe'
import type { FileUploadProps, FileUploadT } from './file-upload.types'

/** Drag-and-drop file upload component with progress tracking and file list management. */
export function FileUpload<Multiple extends boolean = false>(
  props: FileUploadProps<Multiple>,
): JSX.Element {
  const [local, rest] = splitProps(props, [
    'id',
    'name',
    'value',
    'defaultValue',
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
    'itemRender',
    'size',
    'classes',
    'styles',
    'class',
    'style',
    'aria-label',
    'translations',
  ])
  const messages = useMessages('fileUpload', defaultFileUploadMessages, () => local.translations)
  const themeField = useFieldContext()
  const {
    slots: {
      root: rootSlot,
      control: controlSlot,
      wrapper: wrapperSlot,
      icon: iconSlot,
      label: labelSlot,
      description: descriptionSlot,
      files: filesSlot,
      file: fileSlot,
      filePreview: filePreviewSlot,
      fileMeta: fileMetaSlot,
      fileName: fileNameSlot,
      fileSize: fileSizeSlot,
      fileRemove: fileRemoveSlot,
    },
    variants,
  } = useRecipe(fileUploadRecipe, local, {
    data: {
      root: fileUploadDataAttributes.root(() => ({
        disabled: field.disabled,
        readonly: readOnly,
        required: field.required,
        invalid,
      })),
      control: fileUploadDataAttributes.control(() => ({
        dropzone,
        dragging: () => (dropzone() ? dragging() : undefined),
        invalid,
      })),
      wrapper: fileUploadDataAttributes.wrapper(() => ({ dropzone })),
    },
    context: () => ({ variants: { size: themeField?.size } }),
  })

  const merged = mergeProps(
    {
      accept: '*',
      multiple: false,
      dropzone: true,
      preview: true,
      icon: 'icon-upload' as const,
      fileIcon: 'icon-file' as const,
    },
    local,
  )
  const label = createMemo(() => merged.label)
  const description = createMemo(() => merged.description)
  const dropzone = createMemo(() => merged.dropzone)
  const preview = createMemo(() => merged.preview)

  const initialDefaultValue = untrack(() => {
    if (local.defaultValue !== undefined) {
      return local.defaultValue
    }
    return (merged.multiple ? [] : null) as FileUploadT.Value<Multiple>
  })

  const generatedId = createId(() => merged.id, 'file-upload')
  const field = useFormField(
    {
      get id() {
        return merged.id
      },
      get name() {
        return merged.name
      },
      get size() {
        return variants.size
      },
      get disabled() {
        return merged.disabled
      },
      get required() {
        return local.required
      },
      get readOnly() {
        return merged.readOnly
      },
    },
    {
      get defaultId() {
        return generatedId()
      },
      initialValue: initialDefaultValue,
    },
  )

  const readOnly = field.readOnly

  const [formValue, setFormValue, resetFormValue] = useFormValue<FileUploadT.Value<Multiple>>({
    value: () => local.value,
    defaultValue: () => initialDefaultValue,
    onValueChange: (val) => merged.onValueChange?.(val),
    field,
    fallback: initialDefaultValue,
    isEqual: (a, b) => {
      if (Array.isArray(a) && Array.isArray(b)) {
        return a.length === b.length && a.every((file, i) => file === b[i])
      }
      return a === b
    },
  })

  const [hiddenInput, setHiddenInput] = createSignal<HTMLInputElement>()
  let controlEl: HTMLElement | undefined

  const selectedFiles = createMemo<File[]>(() => {
    const val = formValue()
    if (Array.isArray(val)) {
      return val.filter(
        (item): item is File => item !== null && item !== undefined && typeof item === 'object',
      )
    }
    if (val !== null && val !== undefined && typeof val === 'object') {
      return [val]
    }
    return []
  })

  createEffect(
    on([hiddenInput, selectedFiles], ([input, files]) => {
      syncNativeInputFiles(input, files)
    }),
  )

  const [dragging, setDragging] = createSignal(false)
  const {
    nativeInvalid,
    resetNativeInvalid,
    onInvalid: handleHiddenInputInvalid,
  } = useHiddenInputValidation({
    focusTarget: () => controlEl,
  })
  const previewUrls = useFilePreviews({
    files: () => selectedFiles(),
    preview: () => preview(),
  })

  const labelId = () => `${field.id()}-label`
  const descriptionId = () => (description() ? `${field.id()}-description` : undefined)
  const invalid = createMemo(() => field.invalid() || nativeInvalid())
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
        attrs['aria-label'] ??= local['aria-label'] ?? messages().label
      }
    }
    if (invalid()) {
      attrs['aria-invalid'] = 'true'
    }

    return attrs
  })

  const resolvedMaxFiles = createMemo(() => {
    if (merged.maxFiles !== undefined) {
      return merged.maxFiles
    }

    return merged.multiple ? Number.POSITIVE_INFINITY : 1
  })

  function resolveValue(files: File[]): FileUploadT.Value<Multiple> {
    if (merged.multiple) {
      return [...files] as FileUploadT.Value<Multiple>
    }

    return (files[0] ?? null) as FileUploadT.Value<Multiple>
  }

  function commitSelectedFiles(files: File[]): void {
    resetNativeInvalid()
    const nextValue = resolveValue(files)
    setFormValue(nextValue)
  }

  function setControlElement(element: HTMLElement): void {
    controlEl = element
    field.setControlRef(element)
    onCleanup(() => {
      if (controlEl === element) {
        controlEl = undefined
        field.setControlRef(undefined)
      }
    })
  }

  function openFileDialog(): void {
    if (field.disabled() || readOnly()) {
      return
    }

    hiddenInput()?.click()
  }

  function processIncomingFiles(files: File[]): void {
    if (files.length === 0) {
      return
    }

    if (field.disabled() || readOnly()) {
      syncNativeInputFiles(hiddenInput(), selectedFiles())
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
      syncNativeInputFiles(hiddenInput(), currentFiles)
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

  function FileRemoveButton(buttonProps: { file: File; index: number }): JSX.Element {
    return (
      <button
        type="button"
        aria-label={messages().remove({ name: buttonProps.file.name })}
        data-slot="file-upload-file-remove"
        {...fileRemoveSlot}
        disabled={field.disabled() || readOnly()}
        onClick={() => {
          removeFileAt(buttonProps.index)
        }}
      >
        <Icon name="icon-close" />
      </button>
    )
  }

  useFormReset(
    () => hiddenInput()?.form,
    () => {
      setDragging(false)
      resetNativeInvalid()
      resetFormValue()
    },
  )

  function Content(): JSX.Element {
    return (
      <div data-slot="file-upload-wrapper" {...wrapperSlot}>
        <Icon name={merged.icon} data-slot="file-upload-icon" {...iconSlot} />

        <Show when={label()}>
          <span id={labelId()} data-slot="file-upload-label" {...labelSlot}>
            {label()}
          </span>
        </Show>

        <Show when={description()}>
          <span id={descriptionId()} data-slot="file-upload-description" {...descriptionSlot}>
            {description()}
          </span>
        </Show>
      </div>
    )
  }

  const onControlClick: JSX.EventHandler<HTMLButtonElement, MouseEvent> = (event) => {
    callHandler(event, merged.onClick)

    if (!event.defaultPrevented) {
      openFileDialog()
    }
  }

  const onControlKeyDown = createKeyDownHandler<HTMLButtonElement>({
    onKeyDown: () => merged.onKeyDown as any,
    keys: { Enter: openFileDialog, ' ': openFileDialog },
  })

  const onDropzoneDragOver: JSX.EventHandler<HTMLButtonElement, DragEvent> = (event) => {
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

  const onDropzoneDragLeave: JSX.EventHandler<HTMLButtonElement, DragEvent> = (event) => {
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

  const onDropzoneDrop: JSX.EventHandler<HTMLButtonElement, DragEvent> = (event) => {
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
    <div
      role="group"
      data-slot="file-upload"
      {...rootSlot}
      {...rest}
      id={`${field.id()}-root`}
      aria-labelledby={field.ariaAttrs()['aria-labelledby'] ?? (label() ? labelId() : undefined)}
      aria-label={
        field.ariaAttrs()['aria-labelledby'] || label()
          ? undefined
          : (local['aria-label'] ?? messages().label)
      }
      aria-disabled={field.disabled() ? true : undefined}
    >
      <button
        type="button"
        data-slot="file-upload-control"
        {...controlAriaAttrs()}
        {...controlSlot}
        ref={setControlElement}
        disabled={field.disabled()}
        onFocus={(event) => field.emit('focus', event)}
        onBlur={(event) => field.emit('blur', event)}
        onClick={onControlClick}
        onKeyDown={onControlKeyDown}
        onDragOver={(event) => {
          if (dropzone()) {
            onDropzoneDragOver(event)
          }
        }}
        onDragLeave={(event) => {
          if (dropzone()) {
            onDropzoneDragLeave(event)
          }
        }}
        onDrop={(event) => {
          if (dropzone()) {
            onDropzoneDrop(event)
          }
        }}
      >
        <Content />
      </button>

      <HiddenInput
        type="file"
        id={field.id()}
        ref={(element) => {
          setHiddenInput(element)
          callRef(local.inputRef, element)
        }}
        name={field.name()}
        accept={merged.accept}
        multiple={merged.multiple}
        required={field.required()}
        disabled={field.disabled()}
        readonly={readOnly()}
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          const files = Array.from(event.currentTarget.files ?? [])
          processIncomingFiles(files)
        }}
        onInvalid={handleHiddenInputInvalid}
      />

      <Show when={preview() && selectedFiles().length > 0}>
        <ul data-slot="file-upload-files" {...filesSlot}>
          <For each={selectedFiles()}>
            {(file, index) => (
              <Show
                when={merged.itemRender}
                fallback={
                  <li data-slot="file-upload-file" {...fileSlot}>
                    <span data-slot="file-upload-file-preview" {...filePreviewSlot}>
                      <Show
                        when={previewUrls().get(file)}
                        fallback={
                          <Icon name={merged.fileIcon} data-slot="file-upload-icon" {...iconSlot} />
                        }
                      >
                        {(url) => (
                          <img class="size-full object-cover" src={url()} alt={file.name} />
                        )}
                      </Show>
                    </span>

                    <div data-slot="file-upload-file-meta" {...fileMetaSlot}>
                      <span data-slot="file-upload-file-name" {...fileNameSlot}>
                        {file.name}
                      </span>
                      <span data-slot="file-upload-file-size" {...fileSizeSlot}>
                        {formatFileSize(file.size)}
                      </span>
                    </div>

                    <FileRemoveButton file={file} index={index()} />
                  </li>
                }
              >
                {(renderer) =>
                  renderWithProps(renderer(), {
                    file,
                    get index() {
                      return index()
                    },
                    get previewUrl() {
                      return previewUrls().get(file)
                    },
                    remove: () => removeFileAt(index()),
                    get disabled() {
                      return field.disabled() || readOnly()
                    },
                  })
                }
              </Show>
            )}
          </For>
        </ul>
      </Show>
    </div>
  )
}
