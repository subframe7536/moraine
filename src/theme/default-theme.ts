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

import { THEME_LAYERS } from './types.ts'
import type { CompiledThemeLayer, MoraineTheme } from './types.ts'

const official = /* @__PURE__ */ Object.freeze({
  accordion: {
    recipe: accordionRecipe,
    get defaults() {
      return accordionRecipe.options.defaults
    },
  },
  avatar: {
    recipe: avatarRecipe,
    get defaults() {
      return avatarRecipe.options.defaults
    },
  },
  avatarGroup: {
    recipe: avatarGroupRecipe,
    get defaults() {
      return avatarGroupRecipe.options.defaults
    },
  },
  badge: {
    recipe: badgeRecipe,
    get defaults() {
      return badgeRecipe.options.defaults
    },
  },
  breadcrumb: {
    recipe: breadcrumbRecipe,
    get defaults() {
      return breadcrumbRecipe.options.defaults
    },
  },
  button: {
    recipe: buttonRecipe,
    get defaults() {
      return buttonRecipe.options.defaults
    },
  },
  buttonGroup: {
    recipe: buttonGroupRecipe,
    get defaults() {
      return buttonGroupRecipe.options.defaults
    },
  },
  card: {
    recipe: cardRecipe,
    get defaults() {
      return cardRecipe.options.defaults
    },
  },
  checkbox: {
    recipe: checkboxRecipe,
    get defaults() {
      return checkboxRecipe.options.defaults
    },
  },
  checkboxGroup: {
    recipe: checkboxGroupRecipe,
    get defaults() {
      return checkboxGroupRecipe.options.defaults
    },
  },
  commandPalette: {
    recipe: commandPaletteRecipe,
    get defaults() {
      return commandPaletteRecipe.options.defaults
    },
  },
  contextMenu: {
    recipe: contextMenuRecipe,
    get defaults() {
      return contextMenuRecipe.options.defaults
    },
  },
  dialog: {
    recipe: dialogRecipe,
    get defaults() {
      return dialogRecipe.options.defaults
    },
  },
  dropdownMenu: {
    recipe: dropdownMenuRecipe,
    get defaults() {
      return dropdownMenuRecipe.options.defaults
    },
  },
  fileUpload: {
    recipe: fileUploadRecipe,
    get defaults() {
      return fileUploadRecipe.options.defaults
    },
  },
  form: {
    recipe: formRecipe,
    get defaults() {
      return formRecipe.options.defaults
    },
  },
  formField: {
    recipe: formFieldRecipe,
    get defaults() {
      return formFieldRecipe.options.defaults
    },
  },
  icon: {
    recipe: iconRecipe,
    get defaults() {
      return iconRecipe.options.defaults
    },
  },
  input: {
    recipe: inputRecipe,
    get defaults() {
      return inputRecipe.options.defaults
    },
  },
  inputNumber: {
    recipe: inputNumberRecipe,
    get defaults() {
      return inputNumberRecipe.options.defaults
    },
  },
  kbd: {
    recipe: kbdRecipe,
    get defaults() {
      return kbdRecipe.options.defaults
    },
  },
  kbdGroup: {
    recipe: kbdGroupRecipe,
    get defaults() {
      return kbdGroupRecipe.options.defaults
    },
  },
  modal: {
    recipe: modalRecipe,
    get defaults() {
      return modalRecipe.options.defaults
    },
  },
  multiSelect: {
    recipe: multiSelectRecipe,
    get defaults() {
      return multiSelectRecipe.options.defaults
    },
  },
  pagination: {
    recipe: paginationRecipe,
    get defaults() {
      return paginationRecipe.options.defaults
    },
  },
  popover: {
    recipe: popoverRecipe,
    get defaults() {
      return popoverRecipe.options.defaults
    },
  },
  progress: {
    recipe: progressRecipe,
    get defaults() {
      return progressRecipe.options.defaults
    },
  },
  radioGroup: {
    recipe: radioGroupRecipe,
    get defaults() {
      return radioGroupRecipe.options.defaults
    },
  },
  resizable: {
    recipe: resizableRecipe,
    get defaults() {
      return resizableRecipe.options.defaults
    },
  },
  select: {
    recipe: selectRecipe,
    get defaults() {
      return selectRecipe.options.defaults
    },
  },
  separator: {
    recipe: separatorRecipe,
    get defaults() {
      return separatorRecipe.options.defaults
    },
  },
  sheet: {
    recipe: sheetRecipe,
    get defaults() {
      return sheetRecipe.options.defaults
    },
  },
  sidebarFrame: {
    recipe: sidebarFrameRecipe,
    get defaults() {
      return sidebarFrameRecipe.options.defaults
    },
  },
  slider: {
    recipe: sliderRecipe,
    get defaults() {
      return sliderRecipe.options.defaults
    },
  },
  stepper: {
    recipe: stepperRecipe,
    get defaults() {
      return stepperRecipe.options.defaults
    },
  },
  switch: {
    recipe: switchRecipe,
    get defaults() {
      return switchRecipe.options.defaults
    },
  },
  tabs: {
    recipe: tabsRecipe,
    get defaults() {
      return tabsRecipe.options.defaults
    },
  },
  textarea: {
    recipe: textareaRecipe,
    get defaults() {
      return textareaRecipe.options.defaults
    },
  },
  tooltip: {
    recipe: tooltipRecipe,
    get defaults() {
      return tooltipRecipe.options.defaults
    },
  },
  collapsible: { recipe: collapsibleRecipe },
} satisfies Required<CompiledThemeLayer>)

export const defaultTheme: MoraineTheme = /* @__PURE__ */ Object.freeze({
  [THEME_LAYERS]: /* @__PURE__ */ Object.freeze([official]),
})
