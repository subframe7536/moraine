import type { Component, JSX, Ref } from 'solid-js'

import type { ComponentMessages } from '../../provider/locale/messages.types'
import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { FieldT } from '../field'
import type { IconT } from '../icon'

import type { defaultFileUploadMessages } from './file-upload.messages'
import type { FileUploadStyleSlot, FileUploadStyleVariants } from './file-upload.style-types'

type FileRejectionReason =
  | 'tooLong'
  | 'typeMismatch'
  | 'rangeOverflow'
  | 'rangeUnderflow'
  | 'duplicate'

interface FileRejection {
  /** The rejected file. */
  file: File
  /** Why the file was rejected; a file can fail `typeMismatch` and a size rule together. */
  reasons: FileRejectionReason[]
}

export namespace FileUploadT {
  export type Kind = 'single'
  export type Slot<T = unknown> = FileUploadStyleSlot<T>

  export type Variants = FileUploadStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>
  export type Messages = ComponentMessages<typeof defaultFileUploadMessages>
  export type Translations = Partial<Messages>

  export type Value<TMultiple extends boolean = boolean> = TMultiple extends true
    ? File[]
    : TMultiple extends false
      ? File | null
      : File | File[] | null

  /**
   * Why a file was rejected, named after the matching `ValidityState` key: `tooLong` (over
   * `maxFiles`), `typeMismatch` (not in `accept`), `rangeOverflow` (over `maxSize`),
   * `rangeUnderflow` (under `minSize`), or `duplicate` (same name, size, type, and modification
   * time as a selected file).
   */
  export type Reason = FileRejectionReason
  export type Rejection = FileRejection

  export interface ValueInvalidDetails {
    /** Files that failed validation, in pick order, each with its `reasons`. */
    rejections: Rejection[]
  }

  export interface ItemRenderProps {
    file: File
    index: number
    previewUrl?: string
    remove: () => void
    disabled: boolean
  }

  /** Base props for the FileUpload component. */
  export interface Base<TMultiple extends boolean = false> extends FieldT.ControlBase {
    /**
     * The selected file(s) (controlled): `File | null` in single mode, `File[]` when `multiple`.
     * `undefined` leaves the selection uncontrolled; pass `null` (single) or `[]` (multiple) for a
     * controlled empty selection. Update it from `onValueChange`.
     */
    value?: Value<TMultiple>
    /** Initial selection for uncontrolled usage. Defaults to `null` in single mode and `[]` when `multiple`. */
    defaultValue?: Value<TMultiple>

    /**
     * Localized message overrides for this file upload instance. `label` is the accessible name
     * used when no visible `label` is set, and `remove` builds each remove button's `aria-label`
     * from the file `name`.
     * @example
     * ```tsx
     * import { FileUpload } from 'moraine'
     *
     * <FileUpload
     *   label="Avatar"
     *   translations={{ label: 'Upload avatar', remove: ({ name }) => `Delete ${name}` }}
     * />
     * ```
     */
    translations?: Translations
    /** Ref to the hidden native `<input type="file">` that backs the control. */
    inputRef?: Ref<HTMLInputElement>

    /**
     * Comma-separated list of accepted file types. Each entry is a case-insensitive extension
     * (`.png`), a MIME wildcard (`image/*`), or an exact MIME type (`application/pdf`); `*`
     * accepts everything. It is also passed to the native file input and enforced on dropped
     * and picked files, which fail with `typeMismatch` in `onValueInvalid`.
     * @default '*'
     */
    accept?: string

    /**
     * Whether several files can be selected. When `true`, new files are appended to the current
     * selection and `value` is a `File[]`; otherwise a new file replaces the current one.
     * @default false
     */
    multiple?: TMultiple

    /**
     * Called when files are added or removed. Receives the complete new selection, a `File[]`
     * when `multiple` and `File | null` otherwise (`null` once the file is removed). It is not
     * called for files rejected by validation or while the control is disabled or read-only.
     */
    onValueChange?: (value: Value<TMultiple>) => void

    /**
     * Whether files can be dragged and dropped onto the control. When `false`, drag events are
     * ignored, but clicking the control or pressing `Enter` / `Space` still opens the file dialog.
     * @default true
     */
    dropzone?: boolean

    /**
     * Whether to render the list of selected files below the control, with an object-URL
     * thumbnail for image files. When `false`, no list or previews are rendered and `itemRender`
     * is not used.
     * @default true
     */
    fileList?: boolean

    /** Label text inside the upload area. It also names the control for assistive technology unless a surrounding `Field` supplies a label. */
    label?: JSX.Element

    /** Helper text inside the upload area, such as the accepted types. It is linked to the control through `aria-describedby`. */
    description?: JSX.Element

    /**
     * Icon shown in the upload area.
     * @default 'icon-upload'
     */
    icon?: IconT.Name

    /**
     * Icon shown in a file entry when there is no image thumbnail, such as for non-image files.
     * @default 'icon-file'
     */
    fileIcon?: IconT.Name

    /**
     * Maximum total number of selected files, counting files already selected. Files beyond the
     * limit are dropped and reported as `tooLong` in `onValueInvalid`. Only accepted when
     * `multiple` is `true`; single mode always keeps one file. Unlimited by default.
     */
    maxFiles?: TMultiple extends true ? number : never

    /** Minimum accepted file size in bytes, inclusive. Smaller files are rejected with `rangeUnderflow`. */
    minSize?: number

    /** Maximum accepted file size in bytes, inclusive. Larger files are rejected with `rangeOverflow`. */
    maxSize?: number

    /**
     * Called after a pick or drop with the files that failed validation, each with its `reasons`:
     * `typeMismatch` (not in `accept`), `rangeUnderflow` (under `minSize`), `rangeOverflow` (over
     * `maxSize`), `duplicate` (same name, size, type, and modification time as a selected file),
     * or `tooLong` (over `maxFiles`). Accepted
     * files from the same batch are still added and reported through `onValueChange`. It cannot
     * cancel the pick and is unrelated to the native `invalid` event.
     * @example
     * ```tsx
     * import { FileUpload } from 'moraine'
     *
     * <FileUpload
     *   maxSize={2 * 1024 * 1024}
     *   onValueInvalid={({ rejections }) => {
     *     for (const { file, reasons } of rejections) {
     *       console.warn(file.name, reasons.includes('rangeOverflow') ? 'is over 2 MB' : reasons)
     *     }
     *   }}
     * />
     * ```
     */
    onValueInvalid?: (details: ValueInvalidDetails) => void

    /**
     * Replaces the default entry for each selected file in the file list. Receives the `file`,
     * its `index`, an image `previewUrl` when available, a `remove()` function, and `disabled`
     * (`true` while disabled or read-only). Render a list item (`<li>`), since entries sit in a `<ul>`.
     * @example
     * ```tsx
     * import { FileUpload } from 'moraine'
     *
     * <FileUpload
     *   multiple
     *   itemRender={(item) => (
     *     <li>
     *       {item.file.name}
     *       <button type="button" disabled={item.disabled} onClick={item.remove}>
     *         Remove
     *       </button>
     *     </li>
     *   )}
     * />
     * ```
     */
    itemRender?: Component<ItemRenderProps>
  }

  /** Props for the FileUpload component. */
  export type Props<TMultiple extends boolean = false> = BaseProps<
    'div',
    Base<TMultiple>,
    Variants,
    Classes,
    Styles
  >
}

/** Props for the FileUpload component. */
export type FileUploadProps<TMultiple extends boolean = false> = FileUploadT.Props<TMultiple>
