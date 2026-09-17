import type { AccordionStyleSlot } from '../elements/accordion/accordion.style-types'
import type {
  AvatarGroupStyleSlot,
  AvatarGroupStyleVariant,
} from '../elements/avatar/avatar-group.style-types'
import type { AvatarStyleSlot, AvatarStyleVariant } from '../elements/avatar/avatar.style-types'
import type { BadgeStyleSlot, BadgeRecipeVariant } from '../elements/badge/badge.style-types'
import type {
  ButtonGroupStyleSlot,
  ButtonGroupThemeVariant,
} from '../elements/button/button-group.style-types'
import type { ButtonStyleSlot, ButtonStyleVariant } from '../elements/button/button.style-types'
import type { CardStyleSlot, CardStyleVariant } from '../elements/card/card.style-types'
import type { CollapsibleStyleSlot } from '../elements/collapsible/collapsible.style-types'
import type { IconStyleSlot } from '../elements/icon/icon.style-types'
import type { KbdGroupStyleSlot, KbdGroupStyleVariant } from '../elements/kbd/kbd-group.style-types'
import type { KbdStyleSlot, KbdStyleVariant } from '../elements/kbd/kbd.style-types'
import type {
  ProgressStyleSlot,
  ProgressStyleVariant,
} from '../elements/progress/progress.style-types'
import type {
  ResizableStyleSlot,
  ResizableStyleVariant,
} from '../elements/resizable/resizable.style-types'
import type {
  SeparatorStyleSlot,
  SeparatorStyleVariant,
} from '../elements/separator/separator.style-types'
import type {
  BaseSelectStyleSlot,
  BaseSelectStyleVariant,
} from '../forms/base-select/base-select.style-types'
import type {
  CheckboxGroupStyleSlot,
  CheckboxGroupStyleVariant,
} from '../forms/checkbox-group/checkbox-group.style-types'
import type {
  CheckboxStyleSlot,
  CheckboxStyleVariant,
} from '../forms/checkbox/checkbox.style-types'
import type {
  ComboboxStyleSlot,
  ComboboxStyleVariant,
} from '../forms/combobox/combobox.style-types'
import type { FieldStyleSlot, FieldStyleVariant } from '../forms/field/field.style-types'
import type {
  FileUploadStyleSlot,
  FileUploadStyleVariant,
} from '../forms/file-upload/file-upload.style-types'
import type { FormStyleSlot } from '../forms/form/form.style-types'
import type {
  InputGroupStyleSlot,
  InputGroupRecipeVariant,
} from '../forms/input-group/input-group.style-types'
import type {
  InputNumberStyleSlot,
  InputNumberStyleVariant,
} from '../forms/input-number/input-number.style-types'
import type { InputStyleSlot, InputRecipeVariant } from '../forms/input/input.style-types'
import type {
  MultiSelectStyleSlot,
  MultiSelectStyleVariant,
} from '../forms/multi-select/multi-select.style-types'
import type {
  RadioGroupStyleSlot,
  RadioGroupStyleVariant,
} from '../forms/radio-group/radio-group.style-types'
import type { SelectStyleSlot, SelectStyleVariant } from '../forms/select/select.style-types'
import type { SliderStyleSlot, SliderStyleVariant } from '../forms/slider/slider.style-types'
import type { SwitchStyleSlot, SwitchStyleVariant } from '../forms/switch/switch.style-types'
import type {
  TextareaStyleSlot,
  TextareaRecipeVariant,
} from '../forms/textarea/textarea.style-types'
import type {
  BreadcrumbStyleSlot,
  BreadcrumbStyleVariant,
} from '../navigation/breadcrumb/breadcrumb.style-types'
import type {
  CommandPaletteStyleSlot,
  CommandPaletteStyleVariant,
} from '../navigation/command-palette/command-palette.style-types'
import type {
  PaginationStyleSlot,
  PaginationStyleVariant,
} from '../navigation/pagination/pagination.style-types'
import type {
  SidebarFrameStyleSlot,
  SidebarFrameStyleVariant,
} from '../navigation/sidebar-frame/sidebar-frame.style-types'
import type {
  StepperStyleSlot,
  StepperStyleVariant,
} from '../navigation/stepper/stepper.style-types'
import type { TabsStyleSlot, TabsStyleVariant } from '../navigation/tabs/tabs.style-types'
import type {
  ContextMenuStyleSlot,
  ContextMenuStyleVariant,
} from '../overlays/context-menu/context-menu.style-types'
import type { DialogStyleSlot, DialogStyleVariant } from '../overlays/dialog/dialog.style-types'
import type {
  DropdownMenuStyleSlot,
  DropdownMenuStyleVariant,
} from '../overlays/dropdown-menu/dropdown-menu.style-types'
import type { ModalStyleSlot } from '../overlays/modal/modal.style-types'
import type { PopoverStyleSlot } from '../overlays/popover/popover.style-types'
import type { SheetStyleSlot, SheetStyleVariant } from '../overlays/sheet/sheet.style-types'
import type { TooltipStyleSlot, TooltipStyleVariant } from '../overlays/tooltip/tooltip.style-types'

/** Lightweight type-only style contract used by theme declarations. */
export interface StyleContract<Slots extends object, Variants = never> {
  readonly slots: Slots
  readonly variants: Variants
}

/** Declarative registry of Moraine component style contracts. */
export interface MoraineStyleSchema {
  accordion: StyleContract<AccordionStyleSlot>
  avatar: StyleContract<AvatarStyleSlot, AvatarStyleVariant>
  avatarGroup: StyleContract<AvatarGroupStyleSlot, AvatarGroupStyleVariant>
  badge: StyleContract<BadgeStyleSlot, BadgeRecipeVariant>
  buttonGroup: StyleContract<ButtonGroupStyleSlot, ButtonGroupThemeVariant>
  button: StyleContract<ButtonStyleSlot, ButtonStyleVariant>
  card: StyleContract<CardStyleSlot, CardStyleVariant>
  collapsible: StyleContract<CollapsibleStyleSlot>
  icon: StyleContract<IconStyleSlot>
  kbd: StyleContract<KbdStyleSlot, KbdStyleVariant>
  kbdGroup: StyleContract<KbdGroupStyleSlot, KbdGroupStyleVariant>
  progress: StyleContract<ProgressStyleSlot, ProgressStyleVariant>
  resizable: StyleContract<ResizableStyleSlot, ResizableStyleVariant>
  separator: StyleContract<SeparatorStyleSlot, SeparatorStyleVariant>
  baseSelect: StyleContract<BaseSelectStyleSlot, BaseSelectStyleVariant>
  checkbox: StyleContract<CheckboxStyleSlot, CheckboxStyleVariant>
  checkboxGroup: StyleContract<CheckboxGroupStyleSlot, CheckboxGroupStyleVariant>
  combobox: StyleContract<ComboboxStyleSlot, ComboboxStyleVariant>
  field: StyleContract<FieldStyleSlot, FieldStyleVariant>
  fileUpload: StyleContract<FileUploadStyleSlot, FileUploadStyleVariant>
  form: StyleContract<FormStyleSlot>
  input: StyleContract<InputStyleSlot, InputRecipeVariant>
  inputGroup: StyleContract<InputGroupStyleSlot, InputGroupRecipeVariant>
  inputNumber: StyleContract<InputNumberStyleSlot, InputNumberStyleVariant>
  multiSelect: StyleContract<MultiSelectStyleSlot, MultiSelectStyleVariant>
  radioGroup: StyleContract<RadioGroupStyleSlot, RadioGroupStyleVariant>
  select: StyleContract<SelectStyleSlot, SelectStyleVariant>
  slider: StyleContract<SliderStyleSlot, SliderStyleVariant>
  switch: StyleContract<SwitchStyleSlot, SwitchStyleVariant>
  textarea: StyleContract<TextareaStyleSlot, TextareaRecipeVariant>
  breadcrumb: StyleContract<BreadcrumbStyleSlot, BreadcrumbStyleVariant>
  commandPalette: StyleContract<CommandPaletteStyleSlot, CommandPaletteStyleVariant>
  pagination: StyleContract<PaginationStyleSlot, PaginationStyleVariant>
  sidebarFrame: StyleContract<SidebarFrameStyleSlot, SidebarFrameStyleVariant>
  stepper: StyleContract<StepperStyleSlot, StepperStyleVariant>
  tabs: StyleContract<TabsStyleSlot, TabsStyleVariant>
  contextMenu: StyleContract<ContextMenuStyleSlot, ContextMenuStyleVariant>
  dialog: StyleContract<DialogStyleSlot, DialogStyleVariant>
  dropdownMenu: StyleContract<DropdownMenuStyleSlot, DropdownMenuStyleVariant>
  modal: StyleContract<ModalStyleSlot>
  popover: StyleContract<PopoverStyleSlot>
  sheet: StyleContract<SheetStyleSlot, SheetStyleVariant>
  tooltip: StyleContract<TooltipStyleSlot, TooltipStyleVariant>
}
