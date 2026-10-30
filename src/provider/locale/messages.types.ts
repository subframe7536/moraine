import type { defaultAlertMessages } from '../../components/alert/alert.messages'
import type { defaultBreadcrumbMessages } from '../../components/breadcrumb/breadcrumb.messages'
import type { defaultComboboxMessages } from '../../components/combobox/combobox.messages'
import type { defaultCommandPaletteMessages } from '../../components/command-palette/command-palette.messages'
import type { defaultCopyButtonMessages } from '../../components/copy-button/copy-button.messages'
import type { defaultDialogMessages } from '../../components/dialog/dialog.messages'
import type { defaultFileUploadMessages } from '../../components/file-upload/file-upload.messages'
import type { defaultFormMessages } from '../../components/form/form.messages'
import type { defaultInputNumberMessages } from '../../components/input-number/input-number.messages'
import type { defaultKbdMessages } from '../../components/kbd/kbd.messages'
import type { defaultMultiSelectMessages } from '../../components/multi-select/multi-select.messages'
import type { defaultPaginationMessages } from '../../components/pagination/pagination.messages'
import type { defaultProgressMessages } from '../../components/progress/progress.messages'
import type { defaultResizableMessages } from '../../components/resizable/resizable.messages'
import type { defaultSelectMessages } from '../../components/select/select.messages'
import type { defaultTagsFieldMessages } from '../../components/shared/form/select/tags-field.messages'
import type { defaultSheetMessages } from '../../components/sheet/sheet.messages'
import type { defaultSidebarMessages } from '../../components/sidebar/sidebar.messages'
import type { defaultSliderMessages } from '../../components/slider/slider.messages'
import type { defaultToastMessages } from '../../components/toast/toast.messages'
import type { defaultDataTableMessages } from '../../data-table/data-table.messages'

export type ComponentMessages<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R ? (...args: A) => R : string
}

export interface MoraineMessages {
  alert: ComponentMessages<typeof defaultAlertMessages>
  dialog: ComponentMessages<typeof defaultDialogMessages>
  sheet: ComponentMessages<typeof defaultSheetMessages>
  toast: ComponentMessages<typeof defaultToastMessages>
  breadcrumb: ComponentMessages<typeof defaultBreadcrumbMessages>
  commandPalette: ComponentMessages<typeof defaultCommandPaletteMessages>
  copyButton: ComponentMessages<typeof defaultCopyButtonMessages>
  dataTable: ComponentMessages<typeof defaultDataTableMessages>
  select: ComponentMessages<typeof defaultSelectMessages>
  combobox: ComponentMessages<typeof defaultComboboxMessages>
  multiSelect: ComponentMessages<typeof defaultMultiSelectMessages>
  slider: ComponentMessages<typeof defaultSliderMessages>
  pagination: ComponentMessages<typeof defaultPaginationMessages>
  inputNumber: ComponentMessages<typeof defaultInputNumberMessages>
  fileUpload: ComponentMessages<typeof defaultFileUploadMessages>
  tagsField: ComponentMessages<typeof defaultTagsFieldMessages>
  resizable: ComponentMessages<typeof defaultResizableMessages>
  sidebar: ComponentMessages<typeof defaultSidebarMessages>
  form: ComponentMessages<typeof defaultFormMessages>
  kbd: ComponentMessages<typeof defaultKbdMessages>
  progress: ComponentMessages<typeof defaultProgressMessages>
}

export type MoraineMessagesInput = Partial<{
  [K in keyof MoraineMessages]: Partial<MoraineMessages[K]>
}>
