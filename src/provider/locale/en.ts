import { defaultKbdMessages } from '../../element/kbd/kbd.messages'
import { defaultResizableMessages } from '../../element/resizable/resizable.messages'
import { defaultComboboxMessages } from '../../form/combobox/combobox.messages'
import { defaultFileUploadMessages } from '../../form/file-upload/file-upload.messages'
import { defaultFormMessages } from '../../form/form/form.messages'
import { defaultInputNumberMessages } from '../../form/input-number/input-number.messages'
import { defaultMultiSelectMessages } from '../../form/multi-select/multi-select.messages'
import { defaultSelectMessages } from '../../form/select/select.messages'
import { defaultTagsFieldMessages } from '../../form/shared/select/tags-field.messages'
import { defaultSliderMessages } from '../../form/slider/slider.messages'
import { defaultBreadcrumbMessages } from '../../navigation/breadcrumb/breadcrumb.messages'
import { defaultCommandPaletteMessages } from '../../navigation/command-palette/command-palette.messages'
import { defaultPaginationMessages } from '../../navigation/pagination/pagination.messages'
import { defaultSidebarFrameMessages } from '../../navigation/sidebar-frame/sidebar-frame.messages'
import { defaultDialogMessages } from '../../overlay/dialog/dialog.messages'
import { defaultSheetMessages } from '../../overlay/sheet/sheet.messages'

import type { MoraineMessages } from './messages.types'

/** Built-in English copy. Aggregated from component defaults for whole-pack consumers and tests. */
export const enMessages: MoraineMessages = /* @__PURE__ */ Object.freeze({
  dialog: defaultDialogMessages,
  sheet: defaultSheetMessages,
  breadcrumb: defaultBreadcrumbMessages,
  commandPalette: defaultCommandPaletteMessages,
  select: defaultSelectMessages,
  combobox: defaultComboboxMessages,
  multiSelect: defaultMultiSelectMessages,
  slider: defaultSliderMessages,
  pagination: defaultPaginationMessages,
  inputNumber: defaultInputNumberMessages,
  fileUpload: defaultFileUploadMessages,
  tagsField: defaultTagsFieldMessages,
  resizable: defaultResizableMessages,
  sidebarFrame: defaultSidebarFrameMessages,
  form: defaultFormMessages,
  kbd: defaultKbdMessages,
})
