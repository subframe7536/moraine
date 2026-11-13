import type { JSX } from 'solid-js'
import { Show } from 'solid-js'

import type { SlotBinding } from '../../theme/use-recipe'
import { Icon } from '../icon'
import type { IconT } from '../icon'

import { FILE_UPLOAD_PREVIEW_IMAGE_CLASS } from './file-upload.recipe'
import { formatFileSize } from './file-validation'

export interface FileUploadItemProps {
  file: File
  previewUrl: string | undefined
  fileIcon: IconT.Name
  removeLabel: string
  disabled: boolean
  slots: {
    file: SlotBinding
    filePreview: SlotBinding
    icon: SlotBinding
    fileMeta: SlotBinding
    fileName: SlotBinding
    fileSize: SlotBinding
    fileRemove: SlotBinding
  }
  onRemove: () => void
}

export function FileUploadItem(props: FileUploadItemProps): JSX.Element {
  return (
    <li data-slot="file-upload-file" {...props.slots.file}>
      <span data-slot="file-upload-file-preview" {...props.slots.filePreview}>
        <Show
          when={props.previewUrl}
          fallback={
            <Icon name={props.fileIcon} data-slot="file-upload-icon" {...props.slots.icon} />
          }
        >
          {(url) => (
            <img class={FILE_UPLOAD_PREVIEW_IMAGE_CLASS} src={url()} alt={props.file.name} />
          )}
        </Show>
      </span>

      <div data-slot="file-upload-file-meta" {...props.slots.fileMeta}>
        <span data-slot="file-upload-file-name" {...props.slots.fileName}>
          {props.file.name}
        </span>
        <span data-slot="file-upload-file-size" {...props.slots.fileSize}>
          {formatFileSize(props.file.size)}
        </span>
      </div>

      <button
        type="button"
        aria-label={props.removeLabel}
        data-slot="file-upload-file-remove"
        {...props.slots.fileRemove}
        disabled={props.disabled}
        onClick={() => props.onRemove()}
      >
        <Icon name="icon-close" />
      </button>
    </li>
  )
}
