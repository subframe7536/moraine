import type { defaultKbdMessages } from '../../element/kbd/kbd.messages'
import type { defaultResizableMessages } from '../../element/resizable/resizable.messages'
import type { defaultComboboxMessages } from '../../form/combobox/combobox.messages'
import type { defaultFileUploadMessages } from '../../form/file-upload/file-upload.messages'
import type { defaultFormMessages } from '../../form/form/form.messages'
import type { defaultInputNumberMessages } from '../../form/input-number/input-number.messages'
import type { defaultMultiSelectMessages } from '../../form/multi-select/multi-select.messages'
import type { defaultSelectMessages } from '../../form/select/select.messages'
import type { defaultTagsFieldMessages } from '../../form/shared/select/tags-field.messages'
import type { defaultSliderMessages } from '../../form/slider/slider.messages'
import type { defaultBreadcrumbMessages } from '../../navigation/breadcrumb/breadcrumb.messages'
import type { defaultCommandPaletteMessages } from '../../navigation/command-palette/command-palette.messages'
import type { defaultPaginationMessages } from '../../navigation/pagination/pagination.messages'
import type { defaultSidebarFrameMessages } from '../../navigation/sidebar-frame/sidebar-frame.messages'
import type { defaultDialogMessages } from '../../overlay/dialog/dialog.messages'
import type { defaultSheetMessages } from '../../overlay/sheet/sheet.messages'

type ComponentMessages<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R ? (...args: A) => R : string
}

export interface MoraineMessages {
  dialog: ComponentMessages<typeof defaultDialogMessages>
  sheet: ComponentMessages<typeof defaultSheetMessages>
  breadcrumb: ComponentMessages<typeof defaultBreadcrumbMessages>
  commandPalette: ComponentMessages<typeof defaultCommandPaletteMessages>
  select: ComponentMessages<typeof defaultSelectMessages>
  combobox: ComponentMessages<typeof defaultComboboxMessages>
  multiSelect: ComponentMessages<typeof defaultMultiSelectMessages>
  slider: ComponentMessages<typeof defaultSliderMessages>
  pagination: ComponentMessages<typeof defaultPaginationMessages>
  inputNumber: ComponentMessages<typeof defaultInputNumberMessages>
  fileUpload: ComponentMessages<typeof defaultFileUploadMessages>
  tagsField: ComponentMessages<typeof defaultTagsFieldMessages>
  resizable: ComponentMessages<typeof defaultResizableMessages>
  sidebarFrame: ComponentMessages<typeof defaultSidebarFrameMessages>
  form: ComponentMessages<typeof defaultFormMessages>
  kbd: ComponentMessages<typeof defaultKbdMessages>
}

export type MoraineMessagesInput = {
  [K in keyof MoraineMessages]?: Partial<MoraineMessages[K]>
}
