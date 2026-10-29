import type { AccordionStyleConfig } from '../components/accordion/accordion.style-types'
import type { AlertDialogStyleConfig } from '../components/alert-dialog/alert-dialog.style-types'
import type { AlertStyleConfig } from '../components/alert/alert.style-types'
import type { AvatarGroupStyleConfig } from '../components/avatar-group/avatar-group.style-types'
import type { AvatarStyleConfig } from '../components/avatar/avatar.style-types'
import type { BadgeStyleConfig } from '../components/badge/badge.style-types'
import type { BaseSelectStyleConfig } from '../components/base-select/base-select.style-types'
import type { BreadcrumbStyleConfig } from '../components/breadcrumb/breadcrumb.style-types'
import type { ButtonGroupStyleConfig } from '../components/button-group/button-group.style-types'
import type { ButtonStyleConfig } from '../components/button/button.style-types'
import type { CardStyleConfig } from '../components/card/card.style-types'
import type { CheckboxGroupStyleConfig } from '../components/checkbox-group/checkbox-group.style-types'
import type { CheckboxStyleConfig } from '../components/checkbox/checkbox.style-types'
import type { CollapsibleStyleConfig } from '../components/collapsible/collapsible.style-types'
import type { ComboboxStyleConfig } from '../components/combobox/combobox.style-types'
import type { CommandPaletteStyleConfig } from '../components/command-palette/command-palette.style-types'
import type { ContextMenuStyleConfig } from '../components/context-menu/context-menu.style-types'
import type { CopyButtonStyleConfig } from '../components/copy-button/copy-button.style-types'
import type { DataTableStyleConfig } from '../components/data-table/data-table.style-types'
import type { DialogStyleConfig } from '../components/dialog/dialog.style-types'
import type { DropdownMenuStyleConfig } from '../components/dropdown-menu/dropdown-menu.style-types'
import type { EmptyStyleConfig } from '../components/empty/empty.style-types'
import type { FieldStyleConfig } from '../components/field/field.style-types'
import type { FileUploadStyleConfig } from '../components/file-upload/file-upload.style-types'
import type { FormStyleConfig } from '../components/form/form.style-types'
import type { IconStyleConfig } from '../components/icon/icon.style-types'
import type { InputGroupStyleConfig } from '../components/input-group/input-group.style-types'
import type { InputNumberStyleConfig } from '../components/input-number/input-number.style-types'
import type { InputStyleConfig } from '../components/input/input.style-types'
import type { KbdGroupStyleConfig } from '../components/kbd-group/kbd-group.style-types'
import type { KbdStyleConfig } from '../components/kbd/kbd.style-types'
import type { ListStyleConfig } from '../components/list/list.style-types'
import type { ModalStyleConfig } from '../components/modal/modal.style-types'
import type { MultiSelectStyleConfig } from '../components/multi-select/multi-select.style-types'
import type { NavigationMenuStyleConfig } from '../components/navigation-menu/navigation-menu.style-types'
import type { PaginationStyleConfig } from '../components/pagination/pagination.style-types'
import type { PopoverStyleConfig } from '../components/popover/popover.style-types'
import type { ProgressStyleConfig } from '../components/progress/progress.style-types'
import type { RadioGroupStyleConfig } from '../components/radio-group/radio-group.style-types'
import type { ResizableStyleConfig } from '../components/resizable/resizable.style-types'
import type { ScrollAreaStyleConfig } from '../components/scroll-area/scroll-area.style-types'
import type { SelectStyleConfig } from '../components/select/select.style-types'
import type { SeparatorStyleConfig } from '../components/separator/separator.style-types'
import type { SheetStyleConfig } from '../components/sheet/sheet.style-types'
import type { SidebarFrameStyleConfig } from '../components/sidebar-frame/sidebar-frame.style-types'
import type { SkeletonStyleConfig } from '../components/skeleton/skeleton.style-types'
import type { SliderStyleConfig } from '../components/slider/slider.style-types'
import type { StepperStyleConfig } from '../components/stepper/stepper.style-types'
import type { SwitchStyleConfig } from '../components/switch/switch.style-types'
import type { TableStyleConfig } from '../components/table/table.style-types'
import type { TabsStyleConfig } from '../components/tabs/tabs.style-types'
import type { TextareaStyleConfig } from '../components/textarea/textarea.style-types'
import type { ToastStyleConfig } from '../components/toast/toast.style-types'
import type { ToggleButtonStyleConfig } from '../components/toggle-button/toggle-button.style-types'
import type { TooltipStyleConfig } from '../components/tooltip/tooltip.style-types'
import type { TreeStyleConfig } from '../components/tree/tree.style-types'

import type { RecipeLayerConfig } from './recipe'

export interface ComponentStyleConfig<Slots extends object, Variants = never> {
  readonly slots: Slots
  readonly variants: Variants
}

/** Declarative registry of Moraine component style configurations. */
export interface MoraineStyleSchema {
  accordion: AccordionStyleConfig
  alert: AlertStyleConfig
  avatar: AvatarStyleConfig
  avatarGroup: AvatarGroupStyleConfig
  badge: BadgeStyleConfig
  buttonGroup: ButtonGroupStyleConfig
  button: ButtonStyleConfig
  card: CardStyleConfig
  copyButton: CopyButtonStyleConfig
  empty: EmptyStyleConfig
  collapsible: CollapsibleStyleConfig
  icon: IconStyleConfig
  kbd: KbdStyleConfig
  kbdGroup: KbdGroupStyleConfig
  list: ListStyleConfig
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
  table: TableStyleConfig
  dataTable: DataTableStyleConfig
  tabs: TabsStyleConfig
  navigationMenu: NavigationMenuStyleConfig
  alertDialog: AlertDialogStyleConfig
  contextMenu: ContextMenuStyleConfig
  dialog: DialogStyleConfig
  dropdownMenu: DropdownMenuStyleConfig
  modal: ModalStyleConfig
  popover: PopoverStyleConfig
  sheet: SheetStyleConfig
  toast: ToastStyleConfig
  tooltip: TooltipStyleConfig
  tree: TreeStyleConfig
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
