import { accordionRecipe } from '../elements/accordion/accordion.class.ts'
import { avatarGroupRecipe, avatarRecipe } from '../elements/avatar/avatar.class.ts'
import { badgeRecipe } from '../elements/badge/badge.class.ts'
import { buttonGroupRecipe } from '../elements/button/button-group.class.ts'
import { buttonRecipe } from '../elements/button/button.class.ts'
import { cardRecipe } from '../elements/card/card.class.ts'
import { collapsibleRecipe } from '../elements/collapsible/collapsible.class.ts'
import { iconRecipe } from '../elements/icon/icon.class.ts'
import { kbdGroupRecipe, kbdRecipe } from '../elements/kbd/kbd.class.ts'
import { progressRecipe } from '../elements/progress/progress.class.ts'
import { resizableRecipe } from '../elements/resizable/resizable.class.ts'
import { separatorRecipe } from '../elements/separator/separator.class.ts'
import { checkboxGroupRecipe } from '../forms/checkbox-group/checkbox-group.class.ts'
import { checkboxRecipe } from '../forms/checkbox/checkbox.class.ts'
import { fileUploadRecipe } from '../forms/file-upload/file-upload.class.ts'
import { formFieldRecipe } from '../forms/form/form-field.class.ts'
import { formRecipe } from '../forms/form/form.class.ts'
import { inputNumberRecipe } from '../forms/input-number/input-number.class.ts'
import { inputRecipe } from '../forms/input/input.class.ts'
import { radioGroupRecipe } from '../forms/radio-group/radio-group.class.ts'
import { multiSelectRecipe, selectRecipe } from '../forms/select/select.class.ts'
import { sliderRecipe } from '../forms/slider/slider.class.ts'
import { switchRecipe } from '../forms/switch/switch.class.ts'
import { textareaRecipe } from '../forms/textarea/textarea.class.ts'
import { breadcrumbRecipe } from '../navigation/breadcrumb/breadcrumb.class.ts'
import { commandPaletteRecipe } from '../navigation/command-palette/command-palette.class.ts'
import { paginationRecipe } from '../navigation/pagination/pagination.class.ts'
import { sidebarFrameRecipe } from '../navigation/sidebar-frame/sidebar-frame.class.ts'
import { stepperRecipe } from '../navigation/stepper/stepper.class.ts'
import { tabsRecipe } from '../navigation/tabs/tabs.class.ts'
import { contextMenuRecipe } from '../overlays/context-menu/context-menu.class.ts'
import { dialogRecipe } from '../overlays/dialog/dialog.class.ts'
import { dropdownMenuRecipe } from '../overlays/dropdown-menu/dropdown-menu.class.ts'
import { modalRecipe } from '../overlays/modal/modal.class.ts'
import { popoverRecipe } from '../overlays/popover/popover.class.ts'
import { sheetRecipe } from '../overlays/sheet/sheet.class.ts'
import { tooltipRecipe } from '../overlays/tooltip/tooltip.class.ts'

import { toThemeEntry } from './create-theme.ts'
import type { MoraineTheme } from './types.ts'

/** Official component presentation, explicitly supplied to MoraineProvider. */
export const defaultTheme: MoraineTheme = /* @__PURE__ */ Object.freeze({
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
