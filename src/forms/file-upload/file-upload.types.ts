import type { JSX, Ref, ValidComponent } from 'solid-js'

import type { IconT } from '../../elements/icon/index.ts'
import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import type {
  FormDisableOption,
  FormIdentityOptions,
  FormReadOnlyOption,
  FormRequiredOption,
} from '../shared/form-options.ts'

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
  export type Error = FileError
  export type Rejection = FileRejection

  export interface Slot<T = unknown> {
    /** Upload component container that owns dropzone, file input, and file list. */
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

  export interface Variant {
    size?: 'sm' | 'md' | 'lg'
    dropzone?: boolean
  }

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {}

  /** Base props for the FileUpload component. */
  export interface Base<T extends ValidComponent = 'div'>
    extends FormIdentityOptions, FormRequiredOption, FormDisableOption, FormReadOnlyOption {
    /**
     * The HTML element or component to render as.
     * @default 'div'
     */
    as?: T

    /** Native input element ref. */
    inputRef?: Ref<HTMLInputElement>

    /** Click handler for the upload control. */
    onClick?: JSX.EventHandlerUnion<HTMLElement, MouseEvent>

    /** Keyboard handler for the upload control. */
    onKeyDown?: JSX.EventHandlerUnion<HTMLElement, KeyboardEvent>

    /** Drag-over handler for the upload dropzone. */
    onDragOver?: JSX.EventHandlerUnion<HTMLElement, DragEvent>

    /** Drag-leave handler for the upload dropzone. */
    onDragLeave?: JSX.EventHandlerUnion<HTMLElement, DragEvent>

    /** Drop handler for the upload dropzone. */
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

    /** Callback when the selected files change. */
    onValueChange?: (value: Value) => void

    /** Callback when files are rejected (e.g., due to type or count). */
    onFileReject?: (files: FileRejection[]) => void
  }

  /** Props for the FileUpload component. */
  export type Props<T extends ValidComponent = 'div'> = BaseProps<
    T,
    Base<T>,
    Variant,
    Classes,
    Styles
  >
}

/** Props for the FileUpload component. */
export type FileUploadProps<T extends ValidComponent = 'div'> = FileUploadT.Props<T>
