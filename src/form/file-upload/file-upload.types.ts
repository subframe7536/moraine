import type { JSX, Ref } from 'solid-js'

import type { IconT } from '../../element/icon'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
  FormValueOptions,
} from '../shared/form-options.types.ts'

import type { FileUploadStyleSlot, FileUploadStyleVariant } from './file-upload.style-types'

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
  export type Kind = 'single'
  export type Slot<T = unknown> = FileUploadStyleSlot<T>

  export type Variant = FileUploadStyleVariant

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export type Value<Multiple extends boolean = boolean> = Multiple extends true
    ? File[]
    : Multiple extends false
      ? File | null
      : File | File[] | null

  export type Error = FileError
  export type Rejection = FileRejection

  /** Base props for the FileUpload component. */
  export interface Base<Multiple extends boolean = false>
    extends
      FormIdentityOptions,
      FormValueOptions<Value<Multiple>>,
      FormRequiredOption,
      FormDisableOption,
      FormReadOnlyOption {
    /** Native input element ref. */
    inputRef?: Ref<HTMLInputElement>

    /**
     * Accepted file types (e.g., ".jpg,.png", "image/*").
     * @default '*'
     */
    accept?: string

    /**
     * Whether multiple files can be uploaded.
     * @default false
     */
    multiple?: Multiple

    /** Callback when the selected file(s) change. */
    onValueChange?: (value: Value<Multiple>) => void

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

    /** Label for the upload area. */
    label?: JSX.Element

    /** Description text for the upload area. */
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

    /** Maximum number of files allowed. */
    maxFiles?: number

    /** Minimum accepted file size in bytes. */
    minSize?: number

    /** Maximum accepted file size in bytes. */
    maxSize?: number

    /** Callback when files are rejected (e.g., due to type or count). */
    onFileReject?: (files: Rejection[]) => void
  }

  /** Props for the FileUpload component. */
  export type Props<Multiple extends boolean = false> = BaseProps<
    'div',
    Base<Multiple>,
    Variant,
    Classes,
    Styles
  >
}

/** Props for the FileUpload component. */
export type FileUploadProps<Multiple extends boolean = false> = FileUploadT.Props<Multiple>
