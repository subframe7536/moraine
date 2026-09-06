import { accordionRecipeOptions } from '../elements/accordion/accordion.class.ts'
import { avatarGroupRecipeOptions, avatarRecipeOptions } from '../elements/avatar/avatar.class.ts'
import { badgeRecipeOptions } from '../elements/badge/badge.class.ts'
import { buttonGroupRecipeOptions } from '../elements/button/button-group.class.ts'
import { buttonRecipeOptions } from '../elements/button/button.class.ts'
import { cardRecipeOptions } from '../elements/card/card.class.ts'
import { iconRecipeOptions } from '../elements/icon/icon.class.ts'
import { kbdGroupRecipeOptions, kbdRecipeOptions } from '../elements/kbd/kbd.class.ts'
import { progressRecipeOptions } from '../elements/progress/progress.class.ts'
import { resizableRecipeOptions } from '../elements/resizable/resizable.class.ts'
import { separatorRecipeOptions } from '../elements/separator/separator.class.ts'
import { checkboxGroupRecipeOptions } from '../forms/checkbox-group/checkbox-group.class.ts'
import { checkboxRecipeOptions } from '../forms/checkbox/checkbox.class.ts'
import { fileUploadRecipeOptions } from '../forms/file-upload/file-upload.class.ts'
import { formFieldRecipeOptions } from '../forms/form/form-field.class.ts'
import { formRecipeOptions } from '../forms/form/form.class.ts'
import { inputNumberRecipeOptions } from '../forms/input-number/input-number.class.ts'
import { inputRecipeOptions } from '../forms/input/input.class.ts'
import { radioGroupRecipeOptions } from '../forms/radio-group/radio-group.class.ts'
import { multiSelectRecipeOptions, selectRecipeOptions } from '../forms/select/select.class.ts'
import { sliderRecipeOptions } from '../forms/slider/slider.class.ts'
import { switchRecipeOptions } from '../forms/switch/switch.class.ts'
import { textareaRecipeOptions } from '../forms/textarea/textarea.class.ts'
import { breadcrumbRecipeOptions } from '../navigation/breadcrumb/breadcrumb.class.ts'
import { commandPaletteRecipeOptions } from '../navigation/command-palette/command-palette.class.ts'
import { paginationRecipeOptions } from '../navigation/pagination/pagination.class.ts'
import { sidebarFrameRecipeOptions } from '../navigation/sidebar-frame/sidebar-frame.class.ts'
import { stepperRecipeOptions } from '../navigation/stepper/stepper.class.ts'
import { tabsRecipeOptions } from '../navigation/tabs/tabs.class.ts'
import { contextMenuRecipeOptions } from '../overlays/context-menu/context-menu.class.ts'
import { dialogRecipeOptions } from '../overlays/dialog/dialog.class.ts'
import { dropdownMenuRecipeOptions } from '../overlays/dropdown-menu/dropdown-menu.class.ts'
import { modalRecipeOptions } from '../overlays/modal/modal.class.ts'
import { popoverRecipeOptions } from '../overlays/popover/popover.class.ts'
import { sheetRecipeOptions } from '../overlays/sheet/sheet.class.ts'
import { tooltipRecipeOptions } from '../overlays/tooltip/tooltip.class.ts'

import type { ComponentDesignInput } from './types.ts'

export function getOfficialDesignOptions(): Record<string, ComponentDesignInput<string, any>> {
  return {
    accordion: accordionRecipeOptions,
    avatar: avatarRecipeOptions,
    avatarGroup: avatarGroupRecipeOptions,
    badge: badgeRecipeOptions,
    breadcrumb: breadcrumbRecipeOptions,
    button: buttonRecipeOptions,
    buttonGroup: buttonGroupRecipeOptions,
    card: cardRecipeOptions,
    checkbox: checkboxRecipeOptions,
    checkboxGroup: checkboxGroupRecipeOptions,
    commandPalette: commandPaletteRecipeOptions,
    contextMenu: contextMenuRecipeOptions,
    dialog: dialogRecipeOptions,
    dropdownMenu: dropdownMenuRecipeOptions,
    fileUpload: fileUploadRecipeOptions,
    form: formRecipeOptions,
    formField: formFieldRecipeOptions,
    icon: iconRecipeOptions,
    input: inputRecipeOptions,
    inputNumber: inputNumberRecipeOptions,
    kbd: kbdRecipeOptions,
    kbdGroup: kbdGroupRecipeOptions,
    modal: modalRecipeOptions,
    multiSelect: multiSelectRecipeOptions,
    pagination: paginationRecipeOptions,
    popover: popoverRecipeOptions,
    progress: progressRecipeOptions,
    radioGroup: radioGroupRecipeOptions,
    resizable: resizableRecipeOptions,
    select: selectRecipeOptions,
    separator: separatorRecipeOptions,
    sheet: sheetRecipeOptions,
    sidebarFrame: sidebarFrameRecipeOptions,
    slider: sliderRecipeOptions,
    stepper: stepperRecipeOptions,
    switch: switchRecipeOptions,
    tabs: tabsRecipeOptions,
    textarea: textareaRecipeOptions,
    tooltip: tooltipRecipeOptions,
  }
}
