export interface FileUploadStyleSlot<T = unknown> {
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

export interface FileUploadStyleVariant {
  /** Visual size of the component.
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'
}
