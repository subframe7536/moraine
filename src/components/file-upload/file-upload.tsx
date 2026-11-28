import type { JSX } from '@solidjs/web'
import { For, Show, createEffect, createMemo, createSignal, untrack, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import { useMessages } from '../../provider/locale/locale-context'
import { HiddenInput } from '../../shared/hidden-input'
import { createKeyDownHandler } from '../../shared/keyboard'
import { renderWithProps } from '../../shared/render-with-props'
import { callHandler, callRef, createId, mergeDefinedProps } from '../../shared/utils'
import { useFieldContext, useFormField } from '../field/field-context'
import { Icon } from '../icon'
import { useFormReset } from '../shared/form/use-form-reset'
import { useFormValue } from '../shared/form/use-form-value'
import { useHiddenInputValidation } from '../shared/form/use-hidden-input-validation'

import { createFileDropzone } from './create-file-dropzone'
import { createFilePreviews } from './create-file-previews'
import { createFileSelection } from './create-file-selection'
import { FileUploadItem } from './file-upload-item'
import { defaultFileUploadMessages } from './file-upload.messages'
import { fileUploadDataAttributes, fileUploadRecipe } from './file-upload.recipe'
import type { FileUploadProps, FileUploadT } from './file-upload.types'
function isSameFileValue(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((file, i) => file === b[i])
  }
  return a === b
}

/**
 * Drag-and-drop file upload control that collects local files, validates them, and lists the
 * selection. Selection and validation (`accept`, `minSize`, `maxSize`, `maxFiles`) happen in the
 * component; sending files to a server belongs to the caller. Use `multiple` for several files,
 * `variant="button"` for a compact picker, and `onValueChange` / `onValueInvalid` to react to accepted
 * and refused files. Wrap it in `Field` or `form.Field` for a label and validation message.
 *
 * @example
 * ```tsx
 * import { FileUpload } from 'moraine'
 *
 * <FileUpload
 *   multiple
 *   accept="image/png,image/jpeg"
 *   maxFiles={3}
 *   maxSize={1024 * 1024}
 *   label="Drop images here"
 *   description="PNG or JPEG up to 1 MB each"
 *   onValueChange={(files) => console.log(files)}
 *   onValueInvalid={({ rejections }) => console.warn(rejections)}
 * />
 * ```
 */
export function FileUpload<TMultiple extends boolean = false>(
  props: FileUploadProps<TMultiple>,
): JSX.Element {
  const rest = omit(
    props,
    'id',
    'name',
    'form',
    'value',
    'defaultValue',
    'required',
    'disabled',
    'readOnly',
    'inputRef',
    'onClick',
    'onKeyDown',
    'onFocus',
    'onBlur',
    'onDragOver',
    'onDragLeave',
    'onDrop',
    'accept',
    'multiple',
    'dropzone',
    'fileList',
    'label',
    'description',
    'icon',
    'fileIcon',
    'maxFiles',
    'minSize',
    'maxSize',
    'onValueChange',
    'onValueInvalid',
    'itemRender',
    'size',
    'variant',
    'classes',
    'styles',
    'class',
    'style',
    'aria-label',
    'translations',
  )
  const messages = useMessages('fileUpload', defaultFileUploadMessages, () => props.translations)
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
  } = useRecipe(fileUploadRecipe, props, {
    data: {
      root: fileUploadDataAttributes.root(() => ({
        disabled: field.disabled,
        readonly: field.readOnly,
        required: field.required,
        invalid,
      })),
      control: fileUploadDataAttributes.control(() => ({
        dragging: () => (dropzone() ? dragging() : undefined),
        invalid,
      })),
    },
    context: () => ({ variants: { size: themeField?.size } }),
  })

  const merged = mergeDefinedProps(
    {
      accept: '*',
      multiple: false,
      dropzone: true,
      fileList: true,
      icon: 'icon-upload' as const,
      fileIcon: 'icon-file' as const,
    },
    props,
  )
  const label = createMemo(() => merged.label)
  const description = createMemo(() => merged.description)
  const dropzone = createMemo(() => merged.dropzone)
  const fileList = createMemo(() => merged.fileList)

  const initialDefaultValue = untrack(() => {
    if (props.defaultValue !== undefined) {
      return props.defaultValue
    }
    return (merged.multiple ? [] : null) as FileUploadT.Value<TMultiple>
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
        return props.required
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

  const [formValue, setFormValue, resetFormValue] = useFormValue<FileUploadT.Value<TMultiple>>({
    value: () => props.value,
    defaultValue: () => initialDefaultValue,
    onValueChange: (val) => merged.onValueChange?.(val),
    field,
    isEqual: isSameFileValue,
  })

  const [hiddenInput, setHiddenInput] = createSignal<HTMLInputElement | undefined>(undefined)
  const [controlElement, setControlElement] = createSignal<HTMLElement | undefined>(undefined)

  createEffect(controlElement, (element) => {
    if (!element) {
      return
    }
    field.setControlRef(element)
    return () => field.setControlRef(undefined)
  })

  const { nativeInvalid, resetNativeInvalid, onInvalid } = useHiddenInputValidation({
    focusTarget: controlElement,
  })

  const { selectedFiles, interactive, addFiles, removeFileAt } = createFileSelection({
    value: formValue,
    multiple: () => merged.multiple,
    accept: () => merged.accept,
    maxFiles: () => merged.maxFiles,
    minSize: () => merged.minSize,
    maxSize: () => merged.maxSize,
    disabled: field.disabled,
    readOnly: field.readOnly,
    input: hiddenInput,
    commit: (value) => {
      resetNativeInvalid()
      setFormValue(value as FileUploadT.Value<TMultiple>)
    },
    onValueInvalid: (details) => merged.onValueInvalid?.(details),
  })

  const {
    dragging,
    resetDragging,
    onDragOver: onDropzoneDragOver,
    onDragLeave: onDropzoneDragLeave,
    onDrop: onDropzoneDrop,
  } = createFileDropzone({
    dropzone,
    interactive,
    onDragOver: () => merged.onDragOver,
    onDragLeave: () => merged.onDragLeave,
    onDrop: () => merged.onDrop,
    onFiles: addFiles,
  })

  const previewUrls = createFilePreviews({ files: selectedFiles, enabled: fileList })

  useFormReset(
    () => hiddenInput()?.form,
    () => {
      resetDragging()
      resetNativeInvalid()
      resetFormValue()
    },
  )

  const labelId = () => `${field.id()}-label`
  const descriptionId = () => (description() ? `${field.id()}-description` : undefined)
  const invalid = createMemo(() => field.invalid() || nativeInvalid())
  const labelling = createMemo<{ 'aria-labelledby'?: string; 'aria-label'?: string }>(
    () => {
      const labelledBy = field.ariaAttrs()['aria-labelledby'] || (label() ? labelId() : undefined)

      return labelledBy
        ? { 'aria-labelledby': labelledBy }
        : { 'aria-label': props['aria-label'] || messages().label }
    },
    {
      equals: (prev, next) =>
        prev['aria-labelledby'] === next['aria-labelledby'] &&
        prev['aria-label'] === next['aria-label'],
    },
  )
  const controlAriaAttrs = createMemo(
    () => {
      const attrs = { ...field.ariaAttrs() }
      const describedBy = [attrs['aria-describedby'], descriptionId()].filter(Boolean).join(' ')

      if (describedBy) {
        attrs['aria-describedby'] = describedBy
      }
      Object.assign(attrs, labelling())
      if (invalid()) {
        attrs['aria-invalid'] = 'true'
      }

      return attrs
    },
    {
      equals: (prev, next) => {
        const keys = Object.keys(next) as Array<keyof typeof next>
        return Object.keys(prev).length === keys.length && keys.every((k) => prev[k] === next[k])
      },
    },
  )

  const itemSlots = {
    file: fileSlot,
    filePreview: filePreviewSlot,
    icon: iconSlot,
    fileMeta: fileMetaSlot,
    fileName: fileNameSlot,
    fileSize: fileSizeSlot,
    fileRemove: fileRemoveSlot,
  }

  function openFileDialog(): void {
    if (interactive()) {
      hiddenInput()?.click()
    }
  }

  const onControlClick: JSX.EventHandler<HTMLButtonElement, MouseEvent> = (event) => {
    callHandler(event, merged.onClick)

    if (!event.defaultPrevented) {
      openFileDialog()
    }
  }

  const onControlKeyDown = createKeyDownHandler<HTMLButtonElement>({
    onKeyDown: () => merged.onKeyDown,
    keys: { Enter: openFileDialog, ' ': openFileDialog },
  })

  return (
    <div
      role="group"
      data-slot="file-upload"
      {...rootSlot}
      {...rest}
      id={`${field.id()}-root`}
      aria-labelledby={labelling()['aria-labelledby']}
      aria-label={labelling()['aria-label']}
      aria-disabled={field.disabled() ? 'true' : undefined}
    >
      <button
        type="button"
        data-slot="file-upload-control"
        {...controlAriaAttrs()}
        {...controlSlot}
        ref={setControlElement}
        disabled={field.disabled()}
        onFocus={(event) => {
          callHandler(event, props.onFocus)
          field.emit('focus', event)
        }}
        onBlur={(event) => {
          callHandler(event, props.onBlur)
          field.emit('blur', event)
        }}
        onClick={onControlClick}
        onKeyDown={onControlKeyDown}
        onDragOver={onDropzoneDragOver}
        onDragLeave={onDropzoneDragLeave}
        onDrop={onDropzoneDrop}
      >
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
      </button>

      <HiddenInput
        type="file"
        id={field.id()}
        ref={(element) => {
          setHiddenInput(element)
          callRef(() => props.inputRef, element)
        }}
        form={props.form}
        name={field.name()}
        accept={merged.accept}
        multiple={merged.multiple}
        required={field.required()}
        disabled={field.disabled()}
        readonly={field.readOnly()}
        tabindex={-1}
        aria-hidden="true"
        onChange={(event) => {
          addFiles(Array.from(event.currentTarget.files ?? []))
        }}
        onInvalid={onInvalid}
      />

      <Show when={fileList() && selectedFiles().length > 0}>
        <ul data-slot="file-upload-files" {...filesSlot}>
          <For each={selectedFiles()}>
            {(file, index) => (
              <Show
                when={merged.itemRender}
                fallback={
                  <FileUploadItem
                    file={file}
                    previewUrl={previewUrls().get(file)}
                    fileIcon={merged.fileIcon}
                    removeLabel={messages().remove({ name: file.name })}
                    disabled={!interactive()}
                    slots={itemSlots}
                    onRemove={() => removeFileAt(index())}
                  />
                }
              >
                {(renderer) => (
                  <>
                    {renderWithProps(renderer(), {
                      file,
                      get index() {
                        return index()
                      },
                      get previewUrl() {
                        return previewUrls().get(file)
                      },
                      remove: () => removeFileAt(index()),
                      get disabled() {
                        return !interactive()
                      },
                    })}
                  </>
                )}
              </Show>
            )}
          </For>
        </ul>
      </Show>
    </div>
  )
}
