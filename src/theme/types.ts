import type { AccordionStyleConfig } from '../element/accordion/accordion.style-types'
import type { AvatarGroupStyleConfig } from '../element/avatar-group/avatar-group.style-types'
import type { AvatarStyleConfig } from '../element/avatar/avatar.style-types'
import type { BadgeStyleConfig } from '../element/badge/badge.style-types'
import type { ButtonGroupStyleConfig } from '../element/button-group/button-group.style-types'
import type { ButtonStyleConfig } from '../element/button/button.style-types'
import type { CardStyleConfig } from '../element/card/card.style-types'
import type { CollapsibleStyleConfig } from '../element/collapsible/collapsible.style-types'
import type { EmptyStyleConfig } from '../element/empty/empty.style-types'
import type { IconStyleConfig } from '../element/icon/icon.style-types'
import type { KbdGroupStyleConfig } from '../element/kbd-group/kbd-group.style-types'
import type { KbdStyleConfig } from '../element/kbd/kbd.style-types'
import type { ProgressStyleConfig } from '../element/progress/progress.style-types'
import type { ResizableStyleConfig } from '../element/resizable/resizable.style-types'
import type { ScrollAreaStyleConfig } from '../element/scroll-area/scroll-area.style-types'
import type { SeparatorStyleConfig } from '../element/separator/separator.style-types'
import type { SkeletonStyleConfig } from '../element/skeleton/skeleton.style-types'
import type { ToggleButtonStyleConfig } from '../element/toggle-button/toggle-button.style-types'
import type { BaseSelectStyleConfig } from '../form/base-select/base-select.style-types'
import type { CheckboxGroupStyleConfig } from '../form/checkbox-group/checkbox-group.style-types'
import type { CheckboxStyleConfig } from '../form/checkbox/checkbox.style-types'
import type { ComboboxStyleConfig } from '../form/combobox/combobox.style-types'
import type { FieldStyleConfig } from '../form/field/field.style-types'
import type { FileUploadStyleConfig } from '../form/file-upload/file-upload.style-types'
import type { FormStyleConfig } from '../form/form/form.style-types'
import type { InputGroupStyleConfig } from '../form/input-group/input-group.style-types'
import type { InputNumberStyleConfig } from '../form/input-number/input-number.style-types'
import type { InputStyleConfig } from '../form/input/input.style-types'
import type { MultiSelectStyleConfig } from '../form/multi-select/multi-select.style-types'
import type { RadioGroupStyleConfig } from '../form/radio-group/radio-group.style-types'
import type { SelectStyleConfig } from '../form/select/select.style-types'
import type { SliderStyleConfig } from '../form/slider/slider.style-types'
import type { SwitchStyleConfig } from '../form/switch/switch.style-types'
import type { TextareaStyleConfig } from '../form/textarea/textarea.style-types'
import type { BreadcrumbStyleConfig } from '../navigation/breadcrumb/breadcrumb.style-types'
import type { CommandPaletteStyleConfig } from '../navigation/command-palette/command-palette.style-types'
import type { PaginationStyleConfig } from '../navigation/pagination/pagination.style-types'
import type { SidebarFrameStyleConfig } from '../navigation/sidebar-frame/sidebar-frame.style-types'
import type { StepperStyleConfig } from '../navigation/stepper/stepper.style-types'
import type { TabsStyleConfig } from '../navigation/tabs/tabs.style-types'
import type { ContextMenuStyleConfig } from '../overlay/context-menu/context-menu.style-types'
import type { DialogStyleConfig } from '../overlay/dialog/dialog.style-types'
import type { DropdownMenuStyleConfig } from '../overlay/dropdown-menu/dropdown-menu.style-types'
import type { ModalStyleConfig } from '../overlay/modal/modal.style-types'
import type { PopoverStyleConfig } from '../overlay/popover/popover.style-types'
import type { SheetStyleConfig } from '../overlay/sheet/sheet.style-types'
import type { TooltipStyleConfig } from '../overlay/tooltip/tooltip.style-types'

import type { RecipeLayerConfig } from './recipe'

export interface ComponentStyleConfig<Slots extends object, Variants = never> {
  readonly slots: Slots
  readonly variants: Variants
}

/** Declarative registry of Moraine component style configurations. */
export interface MoraineStyleSchema {
  accordion: AccordionStyleConfig
  avatar: AvatarStyleConfig
  avatarGroup: AvatarGroupStyleConfig
  badge: BadgeStyleConfig
  buttonGroup: ButtonGroupStyleConfig
  button: ButtonStyleConfig
  card: CardStyleConfig
  empty: EmptyStyleConfig
  collapsible: CollapsibleStyleConfig
  icon: IconStyleConfig
  kbd: KbdStyleConfig
  kbdGroup: KbdGroupStyleConfig
  progress: ProgressStyleConfig
  resizable: ResizableStyleConfig
  scrollArea: ScrollAreaStyleConfig
  separator: SeparatorStyleConfig
  skeleton: SkeletonStyleConfig
  toggleButton: ToggleButtonStyleConfig
  baseSelect: BaseSelectStyleConfig
  checkbox: CheckboxStyleConfig
  checkboxGroup: CheckboxGroupStyleConfig
  combobox: ComboboxStyleConfig
  field: FieldStyleConfig
  fileUpload: FileUploadStyleConfig
  form: FormStyleConfig
  input: InputStyleConfig
  inputGroup: InputGroupStyleConfig
  inputNumber: InputNumberStyleConfig
  multiSelect: MultiSelectStyleConfig
  radioGroup: RadioGroupStyleConfig
  select: SelectStyleConfig
  slider: SliderStyleConfig
  switch: SwitchStyleConfig
  textarea: TextareaStyleConfig
  breadcrumb: BreadcrumbStyleConfig
  commandPalette: CommandPaletteStyleConfig
  pagination: PaginationStyleConfig
  sidebarFrame: SidebarFrameStyleConfig
  stepper: StepperStyleConfig
  tabs: TabsStyleConfig
  contextMenu: ContextMenuStyleConfig
  dialog: DialogStyleConfig
  dropdownMenu: DropdownMenuStyleConfig
  modal: ModalStyleConfig
  popover: PopoverStyleConfig
  sheet: SheetStyleConfig
  tooltip: TooltipStyleConfig
}

export type ThemeRecipeOverride<C extends ComponentStyleConfig<object, unknown>> =
  RecipeLayerConfig<C['slots'], C['variants']>

type ThemeEntries = {
  [K in keyof MoraineStyleSchema]?: ThemeRecipeOverride<MoraineStyleSchema[K]>
}

declare const MORAINE_THEME: unique symbol

/** Immutable theme value produced by defineTheme(). */
export interface MoraineTheme {
  readonly [MORAINE_THEME]: true
}

/** Theme overrides plus optional explicit composition with a parent Theme. */
export type DefineThemeOptions = ThemeEntries & {
  extends?: MoraineTheme
}
