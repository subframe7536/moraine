import { accordionRecipe } from '../elements/accordion/accordion.class'
import { avatarGroupRecipe, avatarRecipe } from '../elements/avatar/avatar.class'
import { badgeRecipe } from '../elements/badge/badge.class'
import { buttonGroupRecipe } from '../elements/button/button-group.class'
import { buttonRecipe } from '../elements/button/button.class'
import { cardRecipe } from '../elements/card/card.class'
import { collapsibleRecipe } from '../elements/collapsible/collapsible.class'
import { iconRecipe } from '../elements/icon/icon.class'
import { kbdGroupRecipe, kbdRecipe } from '../elements/kbd/kbd.class'
import { progressRecipe } from '../elements/progress/progress.class'
import { resizableRecipe } from '../elements/resizable/resizable.class'
import { separatorRecipe } from '../elements/separator/separator.class'
import { baseSelectRecipe } from '../forms/base-select/base-select.class.ts'
import { checkboxGroupRecipe } from '../forms/checkbox-group/checkbox-group.class'
import { checkboxRecipe } from '../forms/checkbox/checkbox.class'
import { comboboxRecipe } from '../forms/combobox/combobox.class.ts'
import { fileUploadRecipe } from '../forms/file-upload/file-upload.class'
import { formFieldRecipe } from '../forms/form/form-field.class'
import { formRecipe } from '../forms/form/form.class'
import { inputGroupRecipe } from '../forms/input-group/input-group.class.ts'
import { inputNumberRecipe } from '../forms/input-number/input-number.class'
import { inputRecipe } from '../forms/input/input.class'
import { multiSelectRecipe } from '../forms/multi-select/multi-select.class.ts'
import { radioGroupRecipe } from '../forms/radio-group/radio-group.class'
import { selectRecipe } from '../forms/select/select.class.ts'
import { sliderRecipe } from '../forms/slider/slider.class'
import { switchRecipe } from '../forms/switch/switch.class'
import { tagsInputRecipe } from '../forms/tags-input/tags-input.class.ts'
import { textareaRecipe } from '../forms/textarea/textarea.class'
import { breadcrumbRecipe } from '../navigation/breadcrumb/breadcrumb.class'
import { commandPaletteRecipe } from '../navigation/command-palette/command-palette.class'
import { paginationRecipe } from '../navigation/pagination/pagination.class'
import { sidebarFrameRecipe } from '../navigation/sidebar-frame/sidebar-frame.class'
import { stepperRecipe } from '../navigation/stepper/stepper.class'
import { tabsRecipe } from '../navigation/tabs/tabs.class'
import { contextMenuRecipe } from '../overlays/context-menu/context-menu.class'
import { dialogRecipe } from '../overlays/dialog/dialog.class'
import { dropdownMenuRecipe } from '../overlays/dropdown-menu/dropdown-menu.class'
import { modalRecipe } from '../overlays/modal/modal.class'
import { popoverRecipe } from '../overlays/popover/popover.class'
import { sheetRecipe } from '../overlays/sheet/sheet.class'
import { tooltipRecipe } from '../overlays/tooltip/tooltip.class'

import { toThemeEntry } from './create-theme'
import type { MoraineTheme } from './types'

/** Official component presentation, explicitly supplied to MoraineProvider. */
export const defaultTheme: MoraineTheme = /* @__PURE__ */ Object.freeze({
  baseSelect: toThemeEntry(baseSelectRecipe),
  combobox: toThemeEntry(comboboxRecipe),
  accordion: toThemeEntry(accordionRecipe),
  avatar: toThemeEntry(avatarRecipe),
  avatarGroup: toThemeEntry(avatarGroupRecipe),
  badge: toThemeEntry(badgeRecipe),
  breadcrumb: toThemeEntry(breadcrumbRecipe),
  button: toThemeEntry(buttonRecipe),
  buttonGroup: toThemeEntry(buttonGroupRecipe),
  card: toThemeEntry(cardRecipe),
  checkbox: toThemeEntry(checkboxRecipe),
  checkboxGroup: toThemeEntry(checkboxGroupRecipe),
  commandPalette: toThemeEntry(commandPaletteRecipe),
  contextMenu: toThemeEntry(contextMenuRecipe),
  dialog: toThemeEntry(dialogRecipe),
  dropdownMenu: toThemeEntry(dropdownMenuRecipe),
  fileUpload: toThemeEntry(fileUploadRecipe),
  form: toThemeEntry(formRecipe),
  formField: toThemeEntry(formFieldRecipe),
  icon: toThemeEntry(iconRecipe),
  inputGroup: toThemeEntry(inputGroupRecipe),
  input: toThemeEntry(inputRecipe),
  inputNumber: toThemeEntry(inputNumberRecipe),
  kbd: toThemeEntry(kbdRecipe),
  kbdGroup: toThemeEntry(kbdGroupRecipe),
  modal: toThemeEntry(modalRecipe),
  multiSelect: toThemeEntry(multiSelectRecipe),
  pagination: toThemeEntry(paginationRecipe),
  popover: toThemeEntry(popoverRecipe),
  progress: toThemeEntry(progressRecipe),
  radioGroup: toThemeEntry(radioGroupRecipe),
  resizable: toThemeEntry(resizableRecipe),
  select: toThemeEntry(selectRecipe),
  tagsInput: toThemeEntry(tagsInputRecipe),
  separator: toThemeEntry(separatorRecipe),
  sheet: toThemeEntry(sheetRecipe),
  sidebarFrame: toThemeEntry(sidebarFrameRecipe),
  slider: toThemeEntry(sliderRecipe),
  stepper: toThemeEntry(stepperRecipe),
  switch: toThemeEntry(switchRecipe),
  tabs: toThemeEntry(tabsRecipe),
  textarea: toThemeEntry(textareaRecipe),
  tooltip: toThemeEntry(tooltipRecipe),
  collapsible: toThemeEntry(collapsibleRecipe),
} satisfies Required<MoraineTheme>)
